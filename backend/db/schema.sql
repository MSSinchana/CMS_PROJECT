CREATE DATABASE IF NOT EXISTS cms_database;
USE cms_database;

DROP TABLE IF EXISTS content_comments;
DROP TABLE IF EXISTS content_reactions;
DROP TABLE IF EXISTS content_media;
DROP TABLE IF EXISTS content;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content (
    content_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_created DATE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    category VARCHAR(100) DEFAULT 'General',
    slug VARCHAR(255) NOT NULL UNIQUE,
    tags VARCHAR(255) NOT NULL DEFAULT '',
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT NOT NULL,
    CONSTRAINT fk_content_user
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    user_id INT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_content
        FOREIGN KEY (content_id)
        REFERENCES content(content_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS content_reactions (
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
);

CREATE TABLE IF NOT EXISTS user_follows (
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
);

CREATE TABLE IF NOT EXISTS content_media (
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
);

CREATE INDEX idx_content_created_by ON content(created_by);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_category ON content(category);
CREATE INDEX idx_content_slug ON content(slug);
CREATE INDEX idx_content_featured ON content(is_featured);
CREATE INDEX idx_comment_content_id ON content_comments(content_id);
CREATE INDEX idx_comment_created_at ON content_comments(created_at);
CREATE INDEX idx_reaction_content_id ON content_reactions(content_id);
CREATE INDEX idx_media_content_id ON content_media(content_id);
CREATE INDEX idx_follow_follower_id ON user_follows(follower_id);
CREATE INDEX idx_follow_following_id ON user_follows(following_id);
