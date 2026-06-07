import pool from '../db/connection.js';

/**
 * GET /api/activity
 * Admin only. Returns paginated activity log entries, newest first.
 * Supports optional query params: page, limit, action, userId
 */
export async function getActivityLogs(req, res, next) {
  try {
    const page = clamp(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = clamp(req.query.limit, 20, 1, 100);
    const offset = (page - 1) * limit;
    const action = (req.query.action || '').trim();
    const userId = req.query.userId ? Number(req.query.userId) : null;

    const where = [];
    const params = [];

    if (action) {
      where.push('action = ?');
      params.push(action);
    }

    if (userId && Number.isFinite(userId)) {
      where.push('user_id = ?');
      params.push(userId);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM activity_logs ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT log_id, user_id, username, action, entity_type, entity_id, details, created_at
       FROM activity_logs
       ${whereClause}
       ORDER BY created_at DESC, log_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: {
        items: rows.map(mapLog),
        pagination: {
          page,
          limit,
          total: Number(total),
          totalPages: Math.max(Math.ceil(Number(total) / limit), 1)
        }
      },
      message: 'Activity logs loaded'
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/activity/recent
 * Admin only. Returns the most recent N log entries for the dashboard widget.
 */
export async function getRecentActivityLogs(req, res, next) {
  try {
    const limit = clamp(req.query.limit, 10, 1, 50);

    const [rows] = await pool.query(
      `SELECT log_id, user_id, username, action, entity_type, entity_id, details, created_at
       FROM activity_logs
       ORDER BY created_at DESC, log_id DESC
       LIMIT ?`,
      [limit]
    );

    return res.json({
      success: true,
      data: rows.map(mapLog),
      message: 'Recent activity loaded'
    });
  } catch (error) {
    return next(error);
  }
}

function mapLog(row) {
  return {
    id: row.log_id,
    userId: row.user_id,
    username: row.username,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at
  };
}

function clamp(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(Math.max(n, min), max);
}
