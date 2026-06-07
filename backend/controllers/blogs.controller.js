import pool from '../db/connection.js';
import { loadMediaMap, loadPreviewMediaMap } from '../lib/media.js';

const allowedReactions = new Set(['like', 'love', 'insightful', 'celebrate']);

const baseSelect = `
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
  u.username AS created_by_username,
  COUNT(DISTINCT cm.comment_id) AS comment_count,
  COUNT(DISTINCT cr.reaction_id) AS reaction_count
`;

export async function getBlogs(req, res, next) {
  try {
    const page = clampPositiveInteger(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = clampPositiveInteger(req.query.limit, 6, 1, 24);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const featured = (req.query.featured || '').trim();

    const where = ['c.status = ?'];
    const params = ['published'];

    if (search) {
      where.push('(c.title LIKE ? OR c.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      where.push('c.category = ?');
      params.push(category);
    }

    if (featured === 'true') {
      where.push('c.is_featured = 1');
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM content c
       ${whereClause}`,
      params
    );

    const total = Number(countRows[0]?.total || 0);

    const [rows] = await pool.query(
      `SELECT ${baseSelect}
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       LEFT JOIN content_comments cm ON cm.content_id = c.content_id
       LEFT JOIN content_reactions cr ON cr.content_id = c.content_id
       ${whereClause}
       GROUP BY c.content_id
       ORDER BY c.date_created DESC, c.content_id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const mediaMap = await loadPreviewMediaMap(rows.map((row) => row.content_id));

    return res.json({
      success: true,
      data: {
        items: rows.map((row) => mapBlog(row, mediaMap.get(row.content_id) || [])),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1)
        }
      },
      message: 'Blogs loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function getBlogById(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT ${baseSelect}
       FROM content c
       LEFT JOIN users u ON u.user_id = c.created_by
       LEFT JOIN content_comments cm ON cm.content_id = c.content_id
       LEFT JOIN content_reactions cr ON cr.content_id = c.content_id
       WHERE c.content_id = ? AND c.status = 'published'
       GROUP BY c.content_id
       LIMIT 1`,
      [contentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const mediaMap = await loadMediaMap([contentId]);

    const [comments] = await pool.query(
      `SELECT
         cm.comment_id,
         cm.body,
         cm.created_at,
         cm.parent_comment_id,
         u.username AS author_username,
         pu.username AS parent_author_username,
         pc.body AS parent_comment_body
       FROM content_comments cm
       INNER JOIN users u ON u.user_id = cm.user_id
       LEFT JOIN content_comments pc ON pc.comment_id = cm.parent_comment_id
       LEFT JOIN users pu ON pu.user_id = pc.user_id
       WHERE cm.content_id = ?
       ORDER BY cm.created_at ASC`,
      [contentId]
    );

    const [reactionRows] = await pool.query(
      `SELECT reaction_type, COUNT(*) AS count
       FROM content_reactions
       WHERE content_id = ?
       GROUP BY reaction_type`,
      [contentId]
    );

    return res.json({
      success: true,
      data: {
        blog: mapBlog(rows[0], mediaMap.get(contentId) || []),
        comments: comments.map(mapComment),
        reactions: reactionRows.reduce((acc, row) => {
          acc[row.reaction_type] = Number(row.count || 0);
          return acc;
        }, {})
      },
      message: 'Blog loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function getBlogComments(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const [comments] = await pool.query(
      `SELECT
         cm.comment_id,
         cm.body,
         cm.created_at,
         cm.parent_comment_id,
         u.username AS author_username,
         pu.username AS parent_author_username,
         pc.body AS parent_comment_body
       FROM content_comments cm
       INNER JOIN users u ON u.user_id = cm.user_id
       LEFT JOIN content_comments pc ON pc.comment_id = cm.parent_comment_id
       LEFT JOIN users pu ON pu.user_id = pc.user_id
       WHERE cm.content_id = ?
       ORDER BY cm.created_at DESC`,
      [contentId]
    );

    return res.json({
      success: true,
      data: comments.map(mapComment),
      message: 'Comments loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const { body, parentCommentId = null } = req.body;

    const [contentRows] = await pool.query(
      'SELECT content_id FROM content WHERE content_id = ? AND status = ? LIMIT 1',
      [contentId, 'published']
    );

    if (contentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    let validatedParentCommentId = null;

    if (parentCommentId !== null && parentCommentId !== undefined && parentCommentId !== '') {
      validatedParentCommentId = Number(parentCommentId);

      if (!Number.isInteger(validatedParentCommentId) || validatedParentCommentId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment' });
      }

      const [parentRows] = await pool.query(
        'SELECT comment_id FROM content_comments WHERE comment_id = ? AND content_id = ? LIMIT 1',
        [validatedParentCommentId, contentId]
      );

      if (parentRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO content_comments (content_id, user_id, parent_comment_id, body) VALUES (?, ?, ?, ?)',
      [contentId, req.user.id, validatedParentCommentId, body]
    );

    const [rows] = await pool.query(
      `SELECT
         cm.comment_id,
         cm.body,
         cm.created_at,
         cm.parent_comment_id,
         u.username AS author_username,
         pu.username AS parent_author_username,
         pc.body AS parent_comment_body
       FROM content_comments cm
       INNER JOIN users u ON u.user_id = cm.user_id
       LEFT JOIN content_comments pc ON pc.comment_id = cm.parent_comment_id
       LEFT JOIN users pu ON pu.user_id = pc.user_id
       WHERE cm.comment_id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      data: rows.length > 0 ? mapComment(rows[0]) : null,
      message: 'Comment added'
    });
  } catch (error) {
    return next(error);
  }
}

export async function addReaction(req, res, next) {
  try {
    const contentId = Number(req.params.id);
    const { reactionType } = req.body;

    if (!allowedReactions.has(reactionType)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction type' });
    }

    const [contentRows] = await pool.query(
      'SELECT content_id FROM content WHERE content_id = ? AND status = ? LIMIT 1',
      [contentId, 'published']
    );

    if (contentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    await pool.query(
      `INSERT INTO content_reactions (content_id, user_id, reaction_type)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type)`,
      [contentId, req.user.id, reactionType]
    );

    const [reactionRows] = await pool.query(
      `SELECT reaction_type, COUNT(*) AS count
       FROM content_reactions
       WHERE content_id = ?
       GROUP BY reaction_type`,
      [contentId]
    );

    return res.json({
      success: true,
      data: reactionRows.reduce((acc, row) => {
        acc[row.reaction_type] = Number(row.count || 0);
        return acc;
      }, {}),
      message: 'Reaction saved'
    });
  } catch (error) {
    return next(error);
  }
}

function mapBlog(blog, mediaItems = []) {
  return {
    id: blog.content_id,
    title: blog.title,
    description: blog.description,
    dateCreated: blog.date_created,
    updatedAt: blog.updated_at,
    status: blog.status,
    category: blog.category,
    slug: blog.slug,
    tags: normalizeTags(blog.tags),
    isFeatured: Boolean(blog.is_featured),
    createdBy: blog.created_by,
    createdByUsername: blog.created_by_username,
    commentCount: Number(blog.comment_count || 0),
    reactionCount: Number(blog.reaction_count || 0),
    mediaCount: mediaItems.length,
    media: mediaItems
  };
}

function mapComment(comment) {
  return {
    id: comment.comment_id,
    body: comment.body,
    createdAt: comment.created_at,
    authorUsername: comment.author_username,
    parentCommentId: comment.parent_comment_id ? Number(comment.parent_comment_id) : null,
    parentAuthorUsername: comment.parent_author_username || null,
    parentCommentBody: comment.parent_comment_body || null
  };
}

function normalizeTags(tags) {
  return [...new Set(String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  )];
}

function clampPositiveInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, minimum), maximum);
}
