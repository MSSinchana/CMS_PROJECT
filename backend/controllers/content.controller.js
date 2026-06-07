import pool from '../db/connection.js';
import { loadMediaMap, loadPreviewMediaMap, replaceContentMedia } from '../lib/media.js';
import { logActivity } from '../lib/activityLog.js';

const contentColumns = `
  c.content_id,
  c.title,
  c.description,
  c.date_created,
  c.updated_at,
  c.status,
  c.category,
  c.slug,
  c.tags,
  c.is_featured,
  c.created_by,
  u.username AS created_by_username
`;

const allowedStatuses = new Set(['draft', 'published', 'archived']);

export async function getStats(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      const [contentResult, userResult] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) AS totalContent,
             SUM(status = 'published') AS publishedContent,
             SUM(status = 'draft') AS draftContent,
             SUM(status = 'archived') AS archivedContent
           FROM content`
        ),
        pool.query('SELECT COUNT(*) AS totalUsers FROM users')
      ]);

      const counts = contentResult[0]?.[0] || {};
      const usersCount = userResult[0]?.[0] || {};

      return res.json({
        success: true,
        data: {
          totalContent: Number(counts.totalContent || 0),
          publishedContent: Number(counts.publishedContent || 0),
          draftContent: Number(counts.draftContent || 0),
          archivedContent: Number(counts.archivedContent || 0),
          totalUsers: Number(usersCount.totalUsers || 0)
        },
        message: 'Dashboard stats loaded'
      });
    }

    const [contentResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS totalContent,
           SUM(status = 'published') AS publishedContent
         FROM content
         WHERE created_by = ?`,
        [req.user.id]
      )
    ]);
    const counts = contentResult[0]?.[0] || {};

    return res.json({
      success: true,
      data: {
        totalContent: Number(counts.totalContent || 0),
        publishedContent: Number(counts.publishedContent || 0)
      },
      message: 'Dashboard stats loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function getContent(req, res, next) {
  try {
    const page = clampPositiveInteger(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = clampPositiveInteger(req.query.limit, 10, 1, 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const status = (req.query.status || '').trim();

    const where = [];
    const params = [];

    if (req.user.role !== 'admin') {
      where.push('c.created_by = ?');
      params.push(req.user.id);
    }

    if (search) {
      where.push('c.title LIKE ?');
      params.push(`%${search}%`);
    }

    if (category) {
      where.push('c.category = ?');
      params.push(category);
    }

    if (status) {
      where.push('c.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       ${whereClause}`,
      params
    );

    const total = Number(countRows[0]?.total || 0);

    const [rows] = await pool.query(
      `SELECT ${contentColumns}
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       ${whereClause}
       ORDER BY c.date_created DESC, c.content_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const mediaMap = await loadPreviewMediaMap(rows.map((row) => row.content_id));

    return res.json({
      success: true,
      data: {
        items: rows.map((row) => mapContent(row, mediaMap.get(row.content_id) || [], true)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1)
        }
      },
      message: 'Content loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function getContentById(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const currentUserId = Number(req.user.id);
    const [rows] = await pool.query(
      `SELECT ${contentColumns}
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       WHERE c.content_id = ?
       LIMIT 1`,
      [contentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    if (req.user.role !== 'admin' && Number(rows[0].created_by) !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const mediaMap = await loadMediaMap([rows[0].content_id]);
    return res.json({
      success: true,
      data: mapContent(rows[0], mediaMap.get(rows[0].content_id) || [], false),
      message: 'Content loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function createContent(req, res, next) {
  try {
    const {
      title,
      description,
      category = 'General',
      status = 'published',
      tags = [],
      isFeatured = false,
      mediaItems = []
    } = req.body;

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const contentId = await getNextAvailableContentId();
    const normalizedTags = normalizeTags(tags);
    const slug = buildContentSlug(title, contentId);

    const [result] = await pool.query(
      `INSERT INTO content (content_id, title, description, date_created, status, category, slug, tags, is_featured, created_by)
       VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
      [contentId, title, description, status, category, slug, normalizedTags.join(', '), isTruthy(isFeatured) ? 1 : 0, req.user.id]
    );

    await replaceContentMedia(result.insertId, mediaItems);

    const [rows] = await pool.query(
      `SELECT ${contentColumns}
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       WHERE c.content_id = ?
       LIMIT 1`,
      [result.insertId]
    );

    if (rows.length === 0) {
      return res.status(500).json({ success: false, message: 'Content created but failed to load details' });
    }

    const mediaMap = await loadMediaMap([rows[0].content_id]);

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'content.created',
      entityType: 'content',
      entityId: result.insertId,
      details: `Created content: "${title}"`
    });

    return res.status(201).json({
      success: true,
      data: mapContent(rows[0], mediaMap.get(rows[0].content_id) || [], false),
      message: 'Content created'
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateContent(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const currentUserId = Number(req.user.id);
    const { title, description, category, status, tags, isFeatured, mediaItems } = req.body;

    const [rows] = await pool.query('SELECT content_id, created_by FROM content WHERE content_id = ? LIMIT 1', [contentId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const content = rows[0];
    const isAdmin = req.user.role === 'admin';
    const isOwner = Number(content.created_by) === currentUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }

    if (category !== undefined) {
      fields.push('category = ?');
      values.push(category);
    }

    if (tags !== undefined) {
      fields.push('tags = ?');
      values.push(normalizeTags(tags).join(', '));
    }

    if (isFeatured !== undefined) {
      fields.push('is_featured = ?');
      values.push(isTruthy(isFeatured) ? 1 : 0);
    }

    if (title !== undefined) {
      fields.push('slug = ?');
      values.push(buildContentSlug(title, contentId));
    }

    if (status !== undefined && isAdmin) {
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      fields.push('status = ?');
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    values.push(contentId);

    await pool.query(`UPDATE content SET ${fields.join(', ')} WHERE content_id = ?`, values);
    if (Array.isArray(mediaItems)) {
      await replaceContentMedia(contentId, mediaItems);
    }

    const [updated] = await pool.query(
      `SELECT ${contentColumns}
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       WHERE c.content_id = ?
       LIMIT 1`,
      [contentId]
    );

    if (updated.length === 0) {
      return res.status(500).json({ success: false, message: 'Content updated but failed to load details' });
    }

    const mediaMap = await loadMediaMap([updated[0].content_id]);

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'content.updated',
      entityType: 'content',
      entityId: contentId,
      details: `Updated content: "${updated[0].title}"`
    });

    return res.json({
      success: true,
      data: mapContent(updated[0], mediaMap.get(updated[0].content_id) || [], false),
      message: 'Content updated'
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteContent(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const currentUserId = Number(req.user.id);
    const [rows] = await pool.query('SELECT content_id, created_by FROM content WHERE content_id = ? LIMIT 1', [contentId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    const content = rows[0];
    const isAdmin = req.user.role === 'admin';
    const isOwner = Number(content.created_by) === currentUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [result] = await pool.query('DELETE FROM content WHERE content_id = ?', [contentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'content.deleted',
      entityType: 'content',
      entityId: contentId,
      details: `Deleted content ID ${contentId}`
    });

    return res.json({ success: true, data: null, message: 'Content deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const { status } = req.body;

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [result] = await pool.query('UPDATE content SET status = ? WHERE content_id = ?', [status, contentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'content.status_changed',
      entityType: 'content',
      entityId: contentId,
      details: `Changed content ID ${contentId} status to "${status}"`
    });

    return res.json({ success: true, data: null, message: 'Status updated' });
  } catch (error) {
    return next(error);
  }
}

function mapContent(content, mediaItems = [], previewOnly = false) {
  const normalizedMedia = Array.isArray(mediaItems) ? mediaItems : [];
  return {
    id: content.content_id,
    title: content.title,
    description: content.description,
    dateCreated: content.date_created,
    updatedAt: content.updated_at,
    status: content.status,
    category: content.category,
    slug: content.slug,
    tags: normalizeTags(content.tags),
    isFeatured: Boolean(content.is_featured),
    createdBy: content.created_by,
    createdByUsername: content.created_by_username,
    mediaCount: normalizedMedia.length,
    media: previewOnly ? normalizedMedia.slice(0, 1) : normalizedMedia
  };
}

function clampPositiveInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, minimum), maximum);
}

async function getNextAvailableContentId() {
  const [rows] = await pool.query('SELECT content_id FROM content ORDER BY content_id ASC');
  const usedIds = new Set(rows.map((row) => Number(row.content_id)).filter((value) => Number.isFinite(value)));
  let nextId = 1;

  while (usedIds.has(nextId)) {
    nextId += 1;
  }

  return nextId;
}

function buildContentSlug(title, contentId) {
  const slugBase = String(title || 'content')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'content';

  return `${slugBase}-${contentId}`;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 12);
  }

  return [...new Set(String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  )].slice(0, 12);
}

function isTruthy(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'yes' || value === 'on';
}
