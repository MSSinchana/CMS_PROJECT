import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import pool from './connection.js';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'cms_database';

async function hasColumn(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [DB_NAME, tableName, columnName]
  );

  return rows.length > 0;
}

async function hasIndex(tableName, indexName) {
  const [rows] = await pool.query(
    `SELECT 1
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [DB_NAME, tableName, indexName]
  );

  return rows.length > 0;
}

export async function ensureSchema() {
  const bootstrap = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true
  });

  try {
    await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  } finally {
    await bootstrap.end();
  }

  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS content (
      content_id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      date_created DATE NOT NULL,
      created_by INT NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      tags VARCHAR(255) NOT NULL DEFAULT '',
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      CONSTRAINT fk_content_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS content_comments (
      comment_id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT NOT NULL,
      user_id INT NOT NULL,
      parent_comment_id INT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_comment_content
        FOREIGN KEY (content_id)
        REFERENCES content(content_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_comment_parent
        FOREIGN KEY (parent_comment_id)
        REFERENCES content_comments(comment_id)
        ON DELETE CASCADE
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS content_reactions (
      reaction_id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT NOT NULL,
      user_id INT NOT NULL,
      reaction_type ENUM('like', 'love', 'insightful', 'celebrate') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_reaction_per_user (content_id, user_id),
      CONSTRAINT fk_reaction_content
        FOREIGN KEY (content_id)
        REFERENCES content(content_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_reaction_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
      ON DELETE CASCADE
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS user_follows (
      follow_id INT AUTO_INCREMENT PRIMARY KEY,
      follower_id INT NOT NULL,
      following_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_follow (follower_id, following_id),
      CONSTRAINT fk_follow_follower
        FOREIGN KEY (follower_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
      CONSTRAINT fk_follow_following
        FOREIGN KEY (following_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS content_media (
      media_id INT AUTO_INCREMENT PRIMARY KEY,
      content_id INT NOT NULL,
      media_name VARCHAR(255) NOT NULL,
      media_type VARCHAR(100) NOT NULL,
      media_data LONGTEXT NOT NULL,
      media_kind ENUM('image', 'video') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_media_content
        FOREIGN KEY (content_id)
        REFERENCES content(content_id)
        ON DELETE CASCADE
    )`
  );

  if (!(await hasColumn('users', 'email'))) {
    await pool.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE');
  }

  if (!(await hasColumn('users', 'created_at'))) {
    await pool.query('ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  }

  if (!(await hasColumn('content', 'updated_at'))) {
    await pool.query(
      'ALTER TABLE content ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
    );
  }

  if (!(await hasColumn('content', 'status'))) {
    await pool.query("ALTER TABLE content ADD COLUMN status ENUM('draft', 'published', 'archived') DEFAULT 'published'");
  }

  if (!(await hasColumn('content', 'category'))) {
    await pool.query("ALTER TABLE content ADD COLUMN category VARCHAR(100) DEFAULT 'General'");
  }

  if (!(await hasColumn('content', 'slug'))) {
    await pool.query("ALTER TABLE content ADD COLUMN slug VARCHAR(255) NOT NULL DEFAULT ''");
  }

  if (!(await hasColumn('content', 'tags'))) {
    await pool.query("ALTER TABLE content ADD COLUMN tags VARCHAR(255) NOT NULL DEFAULT ''");
  }

  if (!(await hasColumn('content', 'is_featured'))) {
    await pool.query("ALTER TABLE content ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0");
  }

  const [contentRows] = await pool.query('SELECT content_id, title FROM content WHERE slug = \'\' OR slug IS NULL');
  for (const row of contentRows) {
    const slug = buildContentSlug(row.title, row.content_id);
    await pool.query('UPDATE content SET slug = ? WHERE content_id = ?', [slug, row.content_id]);
  }

  if (!(await hasIndex('content', 'idx_content_created_by'))) {
    await pool.query('CREATE INDEX idx_content_created_by ON content(created_by)');
  }

  if (!(await hasIndex('content', 'idx_content_status'))) {
    await pool.query('CREATE INDEX idx_content_status ON content(status)');
  }

  if (!(await hasIndex('content', 'idx_content_category'))) {
    await pool.query('CREATE INDEX idx_content_category ON content(category)');
  }

  if (!(await hasIndex('content', 'idx_content_slug'))) {
    await pool.query('CREATE INDEX idx_content_slug ON content(slug)');
  }

  if (!(await hasIndex('content', 'idx_content_featured'))) {
    await pool.query('CREATE INDEX idx_content_featured ON content(is_featured)');
  }

  if (!(await hasIndex('content_comments', 'idx_comment_content_id'))) {
    await pool.query('CREATE INDEX idx_comment_content_id ON content_comments(content_id)');
  }

  if (!(await hasColumn('content_comments', 'parent_comment_id'))) {
    await pool.query('ALTER TABLE content_comments ADD COLUMN parent_comment_id INT NULL AFTER user_id');
    await pool.query(
      `ALTER TABLE content_comments
       ADD CONSTRAINT fk_comment_parent
       FOREIGN KEY (parent_comment_id)
       REFERENCES content_comments(comment_id)
       ON DELETE CASCADE`
    );
  }

  if (!(await hasIndex('content_comments', 'idx_comment_parent_id'))) {
    await pool.query('CREATE INDEX idx_comment_parent_id ON content_comments(parent_comment_id)');
  }

  if (!(await hasIndex('content_comments', 'idx_comment_created_at'))) {
    await pool.query('CREATE INDEX idx_comment_created_at ON content_comments(created_at)');
  }

  if (!(await hasIndex('content_reactions', 'idx_reaction_content_id'))) {
    await pool.query('CREATE INDEX idx_reaction_content_id ON content_reactions(content_id)');
  }

  if (!(await hasIndex('content_media', 'idx_media_content_id'))) {
    await pool.query('CREATE INDEX idx_media_content_id ON content_media(content_id)');
  }

  if (!(await hasIndex('user_follows', 'idx_follow_follower_id'))) {
    await pool.query('CREATE INDEX idx_follow_follower_id ON user_follows(follower_id)');
  }

  if (!(await hasIndex('user_follows', 'idx_follow_following_id'))) {
    await pool.query('CREATE INDEX idx_follow_following_id ON user_follows(following_id)');
  }

  // Activity log table
  await pool.query(
    `CREATE TABLE IF NOT EXISTS activity_logs (
      log_id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NULL,
      username    VARCHAR(100) NOT NULL DEFAULT 'system',
      action      VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50)  NULL,
      entity_id   INT          NULL,
      details     VARCHAR(500) NULL,
      created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_log_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
    )`
  );

  if (!(await hasIndex('activity_logs', 'idx_log_user_id'))) {
    await pool.query('CREATE INDEX idx_log_user_id ON activity_logs(user_id)');
  }

  if (!(await hasIndex('activity_logs', 'idx_log_created_at'))) {
    await pool.query('CREATE INDEX idx_log_created_at ON activity_logs(created_at)');
  }

  if (!(await hasIndex('activity_logs', 'idx_log_action'))) {
    await pool.query('CREATE INDEX idx_log_action ON activity_logs(action)');
  }

  // Keep the documented default admin account available on startup.
  // This helps fresh installs and partially initialized databases stay usable.
  const defaultAdminPassword = await bcrypt.hash('admin123', 10);
  const [adminRows] = await pool.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', ['admin']);

  if (adminRows.length > 0) {
    await pool.query('UPDATE users SET password = ?, role = ? WHERE username = ?', [defaultAdminPassword, 'admin', 'admin']);
  } else {
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', null, defaultAdminPassword, 'admin']
    );
  }
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
