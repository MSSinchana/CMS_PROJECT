import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection.js';
import { getCurrentUserSocial } from '../lib/social.js';
import { logActivity } from '../lib/activityLog.js';

function signToken(user) {
  return jwt.sign(
    { id: user.user_id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
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

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query(
      'SELECT user_id, username, email, password, role, created_at FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user);

    logActivity({ userId: user.user_id, username: user.username, action: 'user.login', details: 'Logged in' });

    return res.json({
      success: true,
      data: {
        token,
        user: mapUser(user)
      },
      message: 'Login successful'
    });
  } catch (error) {
    return next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

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
      [username, email || null, hashedPassword, 'user']
    );

    const [rows] = await pool.query(
      'SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ? LIMIT 1',
      [result.insertId]
    );

    if (rows.length === 0) {
      return res.status(500).json({ success: false, message: 'User created but failed to load details' });
    }

    const user = rows[0];
    const token = signToken(user);

    logActivity({ userId: user.user_id, username: user.username, action: 'user.register', details: 'Registered a new account' });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: mapUser(user)
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res) {
  logActivity({ userId: req.user.id, username: req.user.username, action: 'user.logout', details: 'Logged out' });
  return res.json({ success: true, data: null, message: 'Logout successful' });
}

export async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, role, created_at FROM users WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    const social = await getCurrentUserSocial(user.user_id);

    return res.json({
      success: true,
      data: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        ...social
      },
      message: 'Current user loaded'
    });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const [rows] = await pool.query(
      'SELECT user_id, password FROM users WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, req.user.id]);

    logActivity({ userId: req.user.id, username: req.user.username, action: 'user.password_changed', details: 'Changed account password' });

    return res.json({ success: true, data: null, message: 'Password updated' });
  } catch (error) {
    return next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    logActivity({ userId: req.user.id, username: req.user.username, action: 'user.account_deleted', details: 'Deleted own account' });

    return res.json({ success: true, data: null, message: 'Account deleted' });
  } catch (error) {
    return next(error);
  }
}
