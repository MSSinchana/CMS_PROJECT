import pool from '../db/connection.js';

/**
 * Record an activity log entry.
 * This is intentionally fire-and-forget — it never throws or rejects so that
 * a logging failure can never break the operation that triggered it.
 *
 * @param {object} opts
 * @param {number|null} opts.userId     - The user performing the action (null = system)
 * @param {string}      opts.username   - Username at the time of the action
 * @param {string}      opts.action     - Machine-readable action key, e.g. 'content.created'
 * @param {string|null} [opts.entityType] - 'content' | 'user' | null
 * @param {number|null} [opts.entityId]   - ID of the affected record, if applicable
 * @param {string|null} [opts.details]    - Short human-readable description
 */
export function logActivity({ userId = null, username = 'system', action, entityType = null, entityId = null, details = null }) {
  // Truncate details to the column limit
  const safeDetails = details ? String(details).slice(0, 500) : null;

  pool
    .query(
      `INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId ?? null, username, action, entityType ?? null, entityId ?? null, safeDetails]
    )
    .catch((err) => {
      // Log to server console only — never propagate
      console.error('[activityLog] Failed to write log entry:', err?.message ?? err);
    });
}
