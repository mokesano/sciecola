-- ═══════════════════════════════════════════════════════════════
-- Additional Schema Tables for Collaboration, Projects, Matching & Innovation
-- File: db/schema_additions.sql
-- Add these tables to wizdam_ecosystem database
-- ═══════════════════════════════════════════════════════════════

USE wizdam_ecosystem;

-- ── EXTEND RESEARCHERS TABLE WITH COLLABORATION FIELDS ──────────────────────

ALTER TABLE researchers ADD COLUMN IF NOT EXISTS (
  collaboration_status ENUM('open', 'busy', 'limited') DEFAULT 'open' COMMENT 'Availability for collaboration',
  collaboration_count INT UNSIGNED DEFAULT 0 COMMENT 'Total active collaborations',
  bio TEXT NULL COMMENT 'Researcher bio/summary',
  profile_photo_url VARCHAR(500) NULL COMMENT 'Profile photo URL',
  research_keywords TEXT NULL COMMENT 'JSON: ["AI", "Climate", "Sustainability"]'
);

-- ── LAYER 6.5: Researcher Expertise & SDG Focus ────────────────────────────

CREATE TABLE IF NOT EXISTS researcher_expertise (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orcid VARCHAR(20) NOT NULL,
  field_name VARCHAR(100) NOT NULL COMMENT 'Expertise field: AI, Climate Science, etc',
  experience_years INT UNSIGNED,
  certification_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_orcid (orcid),
  INDEX idx_field (field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS researcher_sdg_expertise (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orcid VARCHAR(20) NOT NULL,
  sdg_number TINYINT UNSIGNED NOT NULL CHECK (sdg_number BETWEEN 1 AND 17),
  expertise_level ENUM('beginner', 'intermediate', 'expert') DEFAULT 'intermediate',
  publications_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  UNIQUE KEY unique_researcher_sdg (orcid, sdg_number),
  INDEX idx_sdg (sdg_number),
  INDEX idx_expertise_level (expertise_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 7.5: Enhanced Project Budget Tracking ──────────────────────────────

CREATE TABLE IF NOT EXISTS project_budget_log (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  category VARCHAR(100) NOT NULL COMMENT 'salary, equipment, travel, other',
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NULL,
  transaction_date DATE NOT NULL,
  receipt_url VARCHAR(500) NULL,
  created_by VARCHAR(20) NULL COMMENT 'ORCID of person who logged',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_project (project_id),
  INDEX idx_category (category),
  INDEX idx_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_sdg_focus (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  sdg_number TINYINT UNSIGNED NOT NULL CHECK (sdg_number BETWEEN 1 AND 17),
  alignment_score INT UNSIGNED COMMENT '0-100 alignment percentage',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_sdg (project_id, sdg_number),
  INDEX idx_sdg (sdg_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 9.5: Innovation Opportunities - Organizations & Applications ──────

CREATE TABLE IF NOT EXISTS organizations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type ENUM('industry', 'government', 'foundation', 'nonprofit') NOT NULL DEFAULT 'industry',
  description LONGTEXT NULL,
  logo_url VARCHAR(500) NULL,
  website VARCHAR(500) NULL,
  country VARCHAR(100) NULL,
  contact_email VARCHAR(255) NULL,
  contact_phone VARCHAR(20) NULL,
  is_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_country (country),
  FULLTEXT INDEX ft_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update innovation_opportunities to use organization_id
ALTER TABLE innovation_opportunities ADD COLUMN IF NOT EXISTS organization_id INT UNSIGNED AFTER category_id;
ALTER TABLE innovation_opportunities ADD CONSTRAINT FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE innovation_opportunities ADD INDEX IF NOT EXISTS idx_organization (organization_id);

CREATE TABLE IF NOT EXISTS opportunity_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT UNSIGNED NOT NULL,
  applicant_orcid VARCHAR(20) NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_institution_id INT UNSIGNED NULL,
  application_text LONGTEXT NOT NULL COMMENT 'Proposal/motivation text',
  attachment_url VARCHAR(500) NULL COMMENT 'PDF proposal',
  status ENUM('pending', 'under_review', 'shortlisted', 'accepted', 'rejected') DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  review_notes TEXT NULL,
  reviewed_by_orcid VARCHAR(20) NULL,
  FOREIGN KEY (opportunity_id) REFERENCES innovation_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  FOREIGN KEY (applicant_institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_opportunity (opportunity_id),
  INDEX idx_status (status),
  INDEX idx_applicant (applicant_orcid),
  INDEX idx_email (applicant_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS opportunity_matches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT UNSIGNED NOT NULL,
  researcher_orcid VARCHAR(20) NOT NULL,
  match_score INT UNSIGNED COMMENT '0-100 match percentage',
  match_reasons JSON NULL COMMENT '["SDG alignment", "Expertise fit", "Geographic match"]',
  interaction_status ENUM('not_viewed', 'viewed', 'applied', 'rejected') DEFAULT 'not_viewed',
  recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  interacted_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES innovation_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (researcher_orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  UNIQUE KEY unique_match (opportunity_id, researcher_orcid),
  INDEX idx_score (match_score DESC),
  INDEX idx_status (interaction_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 6.5: Enhanced Collaboration Interactions ──────────────────────────

CREATE TABLE IF NOT EXISTS collaboration_interactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id INT UNSIGNED NOT NULL,
  action ENUM('viewed', 'contacted', 'accepted', 'rejected', 'cancelled') NOT NULL,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  FOREIGN KEY (request_id) REFERENCES collaboration_requests(id) ON DELETE CASCADE,
  INDEX idx_request (request_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── AUDIT: Data Input Logs ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_data_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_orcid VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE',
  table_name VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_admin (admin_orcid),
  INDEX idx_table (table_name),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ═══════════════════════════════════════════════════════════════
-- Seed Data for Organizations (Optional)
-- ═══════════════════════════════════════════════════════════════

INSERT IGNORE INTO organizations (name, type, logo_url, website) VALUES
('Tesla Energy', 'industry', 'https://logo.clearbit.com/tesla.com', 'https://tesla.com'),
('Pfizer Research', 'industry', 'https://logo.clearbit.com/pfizer.com', 'https://pfizer.com'),
('Bill & Melinda Gates Foundation', 'foundation', 'https://logo.clearbit.com/gatesfoundation.org', 'https://gatesfoundation.org'),
('Singapore Government', 'government', 'https://logo.clearbit.com/gov.sg', 'https://gov.sg'),
('The Ocean Cleanup', 'nonprofit', 'https://logo.clearbit.com/theoceancleanup.com', 'https://theoceancleanup.com'),
('Siemens Energy', 'industry', 'https://logo.clearbit.com/siemens-energy.com', 'https://siemens-energy.com');
