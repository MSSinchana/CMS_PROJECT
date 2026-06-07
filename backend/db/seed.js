import bcrypt from 'bcryptjs';
import { ensureSchema } from './ensureSchema.js';
import pool from './connection.js';

await ensureSchema();

const [contentRows] = await pool.query('SELECT COUNT(*) AS total FROM content');

if (contentRows[0].total === 0) {
  const [adminRows] = await pool.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', ['admin']);

  if (adminRows.length === 0) {
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@example.com', adminPassword, 'admin']
    );
  }

  const [seedAdminRows] = await pool.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', ['admin']);
  const adminId = seedAdminRows[0]?.user_id;

  if (adminId) {
    const sampleContent = [
      ['Welcome to the CMS', 'This is the first published content item.', 'published', 'General'],
      ['Technology Trends', 'A short article about current web platform trends.', 'published', 'Technology'],
      ['Draft Editorial', 'This draft can be edited before publishing.', 'draft', 'News'],
      ['Tutorial: Getting Started', 'A beginner friendly tutorial content item.', 'published', 'Tutorial']
    ];

    for (const [title, description, status, category] of sampleContent) {
      await pool.query(
        'INSERT INTO content (title, description, date_created, status, category, created_by, slug) VALUES (?, ?, CURDATE(), ?, ?, ?, ?)',
        [title, description, status, category, adminId, `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${Date.now()}`]
      );
    }
  }
}

console.log('Database schema checked and seed data ensured without deleting existing records.');
