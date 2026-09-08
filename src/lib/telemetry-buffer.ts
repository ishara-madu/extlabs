// src/lib/telemetry-buffer.ts
import type { D1Database } from '@cloudflare/workers-types';
import { flushTelemetryBatch, type TelemetryBatchItem } from './queries/extensions';

export type TelemetryEventType = 'download' | 'page_visit' | 'dev_ad_click' | 'extlabs_ad_click';

interface AccumulatedCounters {
  extensionId: string;
  date: string;
  countryCode: string;
  downloads: number;
  pageVisits: number;
  devAdClicks: number;
  extlabsAdClicks: number;
}

// Module-level in-memory buffer (persists across requests within the worker isolate)
const memoryBuffer = new Map<string, AccumulatedCounters>();
let lastFlushTimestamp = Date.now();

// 5-minute flush interval = 288 database writes per 24 hours max
export const FLUSH_INTERVAL_MS = 5 * 60 * 1000;

// Maximum number of distinct aggregated keys in memory to prevent RAM bloat/DDoS
export const MAX_BUFFER_KEYS = 500;

const EXT_ID_REGEX = /^[a-zA-Z0-9_\-\.]{1,64}$/;

export function isValidExtensionId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && id.length <= 64 && EXT_ID_REGEX.test(id);
}

/**
 * Record a telemetry event into the in-memory buffer and flush to D1 only
 * when the time-window threshold (5 minutes) is reached or buffer reaches capacity.
 */
export async function recordTelemetryEvent(
  db: D1Database | null,
  extensionId: string,
  type: TelemetryEventType,
  countryCode: string = 'GLOBAL'
): Promise<{ buffered: boolean; flushed: boolean; bufferSize: number }> {
  if (!isValidExtensionId(extensionId)) {
    return { buffered: false, flushed: false, bufferSize: memoryBuffer.size };
  }

  const today = new Date().toISOString().split('T')[0];
  const cleanCountry = (countryCode || 'GLOBAL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'GLOBAL';
  const key = `${extensionId}:${today}:${cleanCountry}`;

  // If buffer is reaching capacity and key is new, trigger early flush to prevent memory bloat
  if (!memoryBuffer.has(key) && memoryBuffer.size >= MAX_BUFFER_KEYS && db) {
    const itemsToFlush: TelemetryBatchItem[] = Array.from(memoryBuffer.values());
    memoryBuffer.clear();
    lastFlushTimestamp = Date.now();
    try {
      await flushTelemetryBatch(db, itemsToFlush);
    } catch (err) {
      console.error('Failed early emergency buffer flush:', err);
    }
  }

  // 1. Accumulate event in memory (takes 0.001ms, 0 database queries)
  let entry = memoryBuffer.get(key);
  if (!entry) {
    if (memoryBuffer.size >= MAX_BUFFER_KEYS) {
      // If still at capacity (e.g. no DB connection), drop to prevent RAM exhaust
      return { buffered: false, flushed: false, bufferSize: memoryBuffer.size };
    }
    entry = {
      extensionId,
      date: today,
      countryCode: cleanCountry,
      downloads: 0,
      pageVisits: 0,
      devAdClicks: 0,
      extlabsAdClicks: 0
    };
    memoryBuffer.set(key, entry);
  }

  switch (type) {
    case 'download':
      entry.downloads += 1;
      break;
    case 'page_visit':
      entry.pageVisits += 1;
      break;
    case 'dev_ad_click':
      entry.devAdClicks += 1;
      break;
    case 'extlabs_ad_click':
      entry.extlabsAdClicks += 1;
      break;
  }

  // 2. Check if the 5-minute interval has elapsed
  const now = Date.now();
  const shouldFlush = (now - lastFlushTimestamp >= FLUSH_INTERVAL_MS) && memoryBuffer.size > 0;

  if (shouldFlush && db) {
    lastFlushTimestamp = now;
    const itemsToFlush: TelemetryBatchItem[] = Array.from(memoryBuffer.values());
    memoryBuffer.clear();

    try {
      await flushTelemetryBatch(db, itemsToFlush);
      return { buffered: true, flushed: true, bufferSize: 0 };
    } catch (err) {
      console.error('Failed to flush telemetry batch to D1:', err);
      // Re-add to buffer so counts aren't lost
      for (const item of itemsToFlush) {
        const itemKey = `${item.extensionId}:${item.date}:${item.countryCode}`;
        const existing = memoryBuffer.get(itemKey);
        if (existing) {
          existing.downloads += item.downloads;
          existing.pageVisits += item.pageVisits;
          existing.devAdClicks += item.devAdClicks;
          existing.extlabsAdClicks += item.extlabsAdClicks;
        } else {
          memoryBuffer.set(itemKey, item);
        }
      }
      return { buffered: true, flushed: false, bufferSize: memoryBuffer.size };
    }
  }

  return { buffered: true, flushed: false, bufferSize: memoryBuffer.size };
}

/**
 * Force flush the current buffer immediately (useful for testing or shutdown)
 */
export async function forceFlushTelemetry(db: D1Database): Promise<{ flushed: boolean; count: number }> {
  if (memoryBuffer.size === 0) {
    return { flushed: true, count: 0 };
  }

  lastFlushTimestamp = Date.now();
  const itemsToFlush: TelemetryBatchItem[] = Array.from(memoryBuffer.values());
  memoryBuffer.clear();

  try {
    await flushTelemetryBatch(db, itemsToFlush);
    return { flushed: true, count: itemsToFlush.length };
  } catch (err) {
    console.error('Failed to force flush telemetry batch:', err);
    return { flushed: false, count: 0 };
  }
}

/**
 * Get current in-memory buffer statistics (for monitoring/debugging)
 */
export function getBufferStats(): { size: number; lastFlushAgeSec: number } {
  return {
    size: memoryBuffer.size,
    lastFlushAgeSec: Math.round((Date.now() - lastFlushTimestamp) / 1000)
  };
}
