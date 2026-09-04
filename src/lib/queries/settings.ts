// src/lib/queries/settings.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { DbPlatformSetting } from '../db';

/**
 * Fetch all platform settings as key-value pairs
 */
export async function getPlatformSettings(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db
    .prepare('SELECT key, value FROM platform_settings')
    .all<DbPlatformSetting>();

  const settings: Record<string, string> = {};
  for (const row of results || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

/**
 * Fetch single platform setting value by key
 */
export async function getPlatformSetting(
  db: D1Database,
  key: string,
  defaultValue = ''
): Promise<string> {
  const row = await db
    .prepare('SELECT value FROM platform_settings WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();

  return row ? row.value : defaultValue;
}
