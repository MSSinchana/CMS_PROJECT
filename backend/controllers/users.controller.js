import bcrypt from 'bcryptjs';
import pool from '../db/connection.js';
import { getCurrentUserSocial, getPeopleForUser } from '../lib/social.js';
import { logActivity } from '../lib/activityLog.js';

const userColumns = 'user_id, username, email, role, created_at';

export async function getUsers(req, res, next) {
  try {
    const [rows] = await pool.query(`SELECT ${userColumns} FROM users ORDER BY created_at DESC`);

    return res.json({ success: true, data: rows.map(mapUser), message: 'Users loaded' });
  } catch (error) {
    return next(error);
  }
}

export async function getPeople(req, res, next) {
  try {
    const people = await getPeopleForUser(req.user.id, req.user.role);

    return res.json({ success: true, data: people, message: 'People loaded' });
  } catch (error) {
    return next(error);
  }
}

export async function followUser(req, res, next) {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const [targetRows] = await pool.query('SELECT user_id FROM users WHERE user_id = ? LIMIT 1', [targetUserId]);

    if (targetRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [req.user.id, targetUserId]
    );

    const social = await getCurrentUserSocial(req.user.id);

    return res.json({
      success: true,
      data: social,
      message: 'Followed user'
    });
  } catch (error) {
    return next(error);
  }
}

export async function unfollowUser(req, res, next) {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user' });
    }

    await pool.query('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?', [req.user.id, targetUserId]);

    const social = await getCurrentUserSocial(req.user.id);

    return res.json({
      success: true,
      data: social,
      message: 'Unfollowed user'
    });
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { username, email, password, role } = req.body;

    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email || null]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email || null, hashedPassword, role]
    );

    const [rows] = await pool.query(`SELECT ${userColumns} FROM users WHERE user_id = ? LIMIT 1`, [result.insertId]);

    if (rows.length === 0) {
      return res.status(500).json({ success: false, message: 'User created but failed to load details' });
    }

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'user.created',
      entityType: 'user',
      entityId: result.insertId,
      details: `Created user "${username}" with role "${role}"`
    });

    return res.status(201).json({ success: true, data: mapUser(rows[0]), message: 'User created' });
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { username, email, password, role } = req.body;

    const [rows] = await pool.query('SELECT user_id FROM users WHERE user_id = ? LIMIT 1', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (username !== undefined || email !== undefined) {
      const [duplicates] = await pool.query(
        'SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id <> ? LIMIT 1',
        [username ?? null, email ?? null, userId]
      );

      if (duplicates.length > 0) {
        return res.status(400).json({ success: false, message: 'Username or email already exists' });
      }
    }

    const fields = [];
    const values = [];

    if (username !== undefined) {
      fields.push('username = ?');
      values.push(username);
    }

    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email || null);
    }

    if (password) {
      fields.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }

    if (role !== undefined) {
      fields.push('role = ?');
      values.push(role);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }

    values.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, values);

    const [updated] = await pool.query(`SELECT ${userColumns} FROM users WHERE user_id = ? LIMIT 1`, [userId]);

    if (updated.length === 0) {
      return res.status(500).json({ success: false, message: 'User updated but failed to load details' });
    }

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'user.updated',
      entityType: 'user',
      entityId: userId,
      details: `Updated user "${updated[0].username}"`
    });

    return res.json({ success: true, data: mapUser(updated[0]), message: 'User updated' });
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (req.user.id === userId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    logActivity({
      userId: req.user.id,
      username: req.user.username,
      action: 'user.deleted',
      entityType: 'user',
      entityId: userId,
      details: `Deleted user ID ${userId}`
    });

    return res.json({ success: true, data: null, message: 'User deleted' });
  } catch (error) {
    return next(error);
  }
}

function mapUser(user) {
  return {
    id: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}
