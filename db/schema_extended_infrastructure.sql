-- ═══════════════════════════════════════════════════════════════
-- Extended Infrastructure: Core Tables & Columns Enhancement
-- File: db/schema_extended_infrastructure.sql
-- Extends institutions, researchers, team_members tables
-- Creates notification, preference, and statistics tracking tables
-- ═══════════════════════════════════════════════════════════════

USE wizdam_ecosystem;

-- ── EXTEND INSTITUTIONS TABLE ──────────────────────────────────────────────

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS (
  logo_url VARCHAR(512) NULL COMMENT 'Institution logo URL',
  type VARCHAR(100) NULL COMMENT 'university, research_center, hospital, corporate_lab, etc',
  established_year YEAR NULL COMMENT 'Year institution was founded',
  motto TEXT NULL COMMENT 'Institution motto or tagline',
  rector_name VARCHAR(255) NULL COMMENT 'Name of rector/president',
  faculties_count INT UNSIGNED NULL COMMENT 'Number of faculties/colleges',
  students_count INT UNSIGNED NULL COMMENT 'Total student population',
  lecturers_count INT UNSIGNED NULL COMMENT 'Total teaching staff',
  INDEX idx_type (type),
  INDEX idx_established (established_year)
);

-- ── EXTEND RESEARCHERS TABLE ──────────────────────────────────────────────

ALTER TABLE researchers ADD COLUMN IF NOT EXISTS (
  i10_index SMALLINT UNSIGNED DEFAULT 0 COMMENT 'h-index variant: 10 citations',
  province VARCHAR(100) NULL COMMENT 'Province/state for geographic filtering',
  INDEX idx_province (province),
  INDEX idx_i10_index (i10_index)
);

-- ── EXTEND TEAM_MEMBERS TABLE ──────────────────────────────────────────────

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS (
  slug VARCHAR(100) NULL UNIQUE COMMENT 'URL-friendly identifier',
  code VARCHAR(20) NULL COMMENT 'Internal code: TM-L001, TM-A001, etc',
  long_bio LONGTEXT NULL COMMENT 'Extended biography',
  joined_year YEAR NULL COMMENT 'Year joined the team',
  location VARCHAR(255) NULL COMMENT 'Current location/office',
  sdg_focus JSON NULL COMMENT 'Array of SDG numbers: [1,5,13,14]',
  INDEX idx_slug (slug),
  INDEX idx_code (code),
  INDEX idx_location (location)
);

-- ── CREATE TEAM_MEMBER_EDUCATION TABLE ────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_member_education (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_member_id INT UNSIGNED NOT NULL,
  degree_level VARCHAR(100) NOT NULL COMMENT 'S1, S2, S3, etc',
  field_of_study VARCHAR(255) NOT NULL,
  institution VARCHAR(255) NOT NULL,
  graduation_year YEAR NOT NULL,
  gpa DECIMAL(3,2) NULL,
  honors TEXT NULL COMMENT 'cum laude, with distinction, etc',
  certificate_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
  INDEX idx_team_member (team_member_id),
  INDEX idx_year (graduation_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CREATE TEAM_MEMBER_ACHIEVEMENTS TABLE ────────────────────────────────

CREATE TABLE IF NOT EXISTS team_member_achievements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_member_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  achievement_year YEAR NOT NULL,
  category VARCHAR(100) COMMENT 'award, publication, patent, project, etc',
  issuer VARCHAR(255) NULL COMMENT 'Organization that issued/recognized the achievement',
  proof_url VARCHAR(500) NULL COMMENT 'Certificate, news link, proof URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
  INDEX idx_team_member (team_member_id),
  INDEX idx_category (category),
  INDEX idx_year (achievement_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CREATE NOTIFICATIONS TABLE ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient_orcid VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL COMMENT 'collaboration_request, opportunity_match, message, system, achievement',
  category VARCHAR(100) NULL COMMENT 'Grouping for filtering',
  title VARCHAR(255) NOT NULL,
  message LONGTEXT NOT NULL,
  link VARCHAR(500) NULL COMMENT 'URL to related resource',
  data JSON NULL COMMENT 'Additional structured data',
  is_read TINYINT(1) DEFAULT 0,
  read_at TIMESTAMP NULL,
  action_required TINYINT(1) DEFAULT 0 COMMENT 'Needs user action',
  action_deadline DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_recipient (recipient_orcid),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created (created_at),
  INDEX idx_action_required (action_required)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CREATE USER_PREFERENCES TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orcid VARCHAR(20) NOT NULL UNIQUE,
  language VARCHAR(10) DEFAULT 'en' COMMENT 'en, id, etc',
  timezone VARCHAR(50) DEFAULT 'UTC' COMMENT 'Asia/Jakarta, etc',
  theme VARCHAR(20) DEFAULT 'light' COMMENT 'light, dark, auto',
  notification_email_digest VARCHAR(20) DEFAULT 'daily' COMMENT 'daily, weekly, monthly, never',
  notification_push_enabled TINYINT(1) DEFAULT 1,
  notification_email_enabled TINYINT(1) DEFAULT 1,
  notification_in_app_enabled TINYINT(1) DEFAULT 1,
  privacy_profile_visibility VARCHAR(20) DEFAULT 'public' COMMENT 'public, registered, private',
  privacy_show_affiliations TINYINT(1) DEFAULT 1,
  privacy_show_publications TINYINT(1) DEFAULT 1,
  privacy_show_collaborations TINYINT(1) DEFAULT 0,
  newsletter_subscribed TINYINT(1) DEFAULT 1,
  research_area_notifications TINYINT(1) DEFAULT 1,
  collaboration_notifications TINYINT(1) DEFAULT 1,
  opportunity_notifications TINYINT(1) DEFAULT 1,
  system_notifications TINYINT(1) DEFAULT 1,
  custom_preferences JSON NULL COMMENT 'Flexible key-value for future preferences',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_orcid (orcid),
  INDEX idx_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CREATE INSTITUTION_NEWS TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS institution_news (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  category VARCHAR(100) NULL COMMENT 'achievement, announcement, research, partnership, event',
  news_date DATE NOT NULL,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_featured TINYINT(1) DEFAULT 0,
  created_by_orcid VARCHAR(20) NULL COMMENT 'Who posted this news',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_institution (institution_id),
  INDEX idx_date (news_date),
  INDEX idx_featured (is_featured),
  INDEX idx_published (published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CREATE INSTITUTION_STATS TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS institution_stats (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL UNIQUE,
  publications_count INT UNSIGNED DEFAULT 0,
  researchers_count INT UNSIGNED DEFAULT 0,
  citations_count INT UNSIGNED DEFAULT 0,
  h_index SMALLINT UNSIGNED DEFAULT 0,
  i10_index SMALLINT UNSIGNED DEFAULT 0,
  journals_count INT UNSIGNED DEFAULT 0,
  collaborations_count INT UNSIGNED DEFAULT 0,
  sdg_focus JSON NULL COMMENT 'Most active SDG numbers',
  last_publication_year YEAR NULL,
  average_citations_per_article DECIMAL(10,2) DEFAULT 0,
  total_research_grants DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  INDEX idx_h_index (h_index),
  INDEX idx_citations (citations_count),
  INDEX idx_publications (publications_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CREATE INSTITUTION_PUBLICATION_TREND TABLE ────────────────────────────

CREATE TABLE IF NOT EXISTS institution_publication_trend (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institution_id INT UNSIGNED NOT NULL,
  publication_year YEAR NOT NULL,
  publications_count INT UNSIGNED DEFAULT 0,
  citations_count INT UNSIGNED DEFAULT 0,
  average_citation INT UNSIGNED DEFAULT 0,
  top_journal VARCHAR(255) NULL,
  top_sdg TINYINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_inst_year (institution_id, publication_year),
  INDEX idx_institution (institution_id),
  INDEX idx_year (publication_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════
-- Seed Data (Optional)
-- ═══════════════════════════════════════════════════════════════

-- Uncomment to add sample notification preferences for existing researchers
-- INSERT INTO user_preferences (orcid, language, timezone, notification_email_digest)
-- SELECT orcid, 'en', 'UTC', 'daily' FROM researchers LIMIT 100
-- ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
