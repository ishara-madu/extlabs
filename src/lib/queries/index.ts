// src/lib/queries/index.ts
/**
 * ExtLabs D1 Database Query Layer (Repository Pattern)
 * 
 * Rules:
 * 1. All D1 SQL queries MUST reside in this directory (src/lib/queries/).
 * 2. Before writing a new query, always check here first to reuse or extend an existing query.
 * 3. Never write raw inline db.prepare(...) SQL queries inside .astro pages or components.
 */

export * from './developers';
export * from './extensions';
export * from './settings';
