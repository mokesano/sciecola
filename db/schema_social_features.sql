-- ============================================================================
-- Priority 3: Tabel untuk Fitur Sosial (Messages, Feeds, Platform Timeline)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MESSAGING TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_type ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  name VARCHAR(255),
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP NULL,
  FOREIGN KEY (created_by) REFERENCES user_accounts(id) ON DELETE CASCADE,
  KEY idx_type (conversation_type),
  KEY idx_created_by (created_by),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_message_id INT,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMP NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_conversation_user (conversation_id, user_id),
  KEY idx_user_id (user_id),
  KEY idx_joined_at (joined_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message_text LONGTEXT NOT NULL,
  message_type ENUM('text', 'file', 'image', 'link') DEFAULT 'text',
  file_url VARCHAR(512),
  file_name VARCHAR(255),
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  KEY idx_conversation_id (conversation_id),
  KEY idx_sender_id (sender_id),
  KEY idx_created_at (created_at),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_message_user (message_id, user_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FEED TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feed_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author_id INT NOT NULL,
  post_type ENUM('text', 'article', 'research', 'announcement') DEFAULT 'text',
  title VARCHAR(255),
  content LONGTEXT NOT NULL,
  image_url VARCHAR(512),
  article_link VARCHAR(512),
  research_doi VARCHAR(255),
  visibility ENUM('public', 'internal', 'private') DEFAULT 'public',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (author_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  KEY idx_author_id (author_id),
  KEY idx_post_type (post_type),
  KEY idx_visibility (visibility),
  KEY idx_created_at (created_at),
  KEY idx_is_deleted (is_deleted),
  KEY idx_is_pinned (is_pinned),
  FULLTEXT idx_fulltext (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feed_post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_post_user (post_id, user_id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feed_post_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  parent_comment_id INT,
  comment_text LONGTEXT NOT NULL,
  likes_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES feed_post_comments(id) ON DELETE CASCADE,
  KEY idx_post_id (post_id),
  KEY idx_author_id (author_id),
  KEY idx_parent_comment_id (parent_comment_id),
  KEY idx_created_at (created_at),
  KEY idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feed_post_comment_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comment_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES feed_post_comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_comment_user (comment_id, user_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PLATFORM TIMELINE (Platform History & Milestones)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_timeline (
  id INT PRIMARY KEY AUTO_INCREMENT,
  timeline_date DATE NOT NULL,
  event_type ENUM('milestone', 'feature', 'partnership', 'award', 'research') DEFAULT 'milestone',
  event_title VARCHAR(255) NOT NULL,
  event_description LONGTEXT,
  event_image_url VARCHAR(512),
  event_link VARCHAR(512),
  impact_area VARCHAR(100),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_timeline_date (timeline_date),
  KEY idx_event_type (event_type),
  KEY idx_is_featured (is_featured),
  KEY idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes untuk performa query yang sering
-- ─────────────────────────────────────────────────────────────────────────────

-- Messages: query untuk mendapatkan message baru dalam conversation
CREATE INDEX idx_messages_conv_created ON messages(conversation_id, created_at DESC);

-- Feed posts: query untuk timeline (public posts, sorted by created_at)
CREATE INDEX idx_feed_posts_visibility_created ON feed_posts(visibility, created_at DESC) WHERE is_deleted = FALSE;

-- Conversation participants: query untuk mendapatkan daftar user dalam conversation
CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id, joined_at);
