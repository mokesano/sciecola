-- ═══════════════════════════════════════════════════════════════
-- wizdam_ecosystem — Canonical Schema
-- Owner     : sdgs-mapper / db/schema.sql
-- Digunakan : wizdam-apis · wizdam-sikola · sdgs-analytics · sdg-mono · sdgs-mapper
-- Engine    : MariaDB 10.6+ / MySQL 8.0+
--
-- Setup:
--   mysql -u root -p < db/schema.sql
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS wizdam_ecosystem
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE wizdam_ecosystem;

SET FOREIGN_KEY_CHECKS = 0;

-- ── LAYER 1: Identity ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS institutions (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255)    NOT NULL,
  acronym           VARCHAR(50)     NULL,
  country           VARCHAR(100)    NULL,
  city              VARCHAR(100)    NULL,
  website_url       VARCHAR(512)    NULL,
  ror_id            VARCHAR(100)    NULL UNIQUE  COMMENT 'Research Organization Registry',
  scopus_affil_id   VARCHAR(50)     NULL UNIQUE,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_country (country),
  INDEX idx_name    (name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS researchers (
  orcid               VARCHAR(20)     NOT NULL PRIMARY KEY  COMMENT 'Format: 0000-0000-0000-000X',
  name                VARCHAR(255)    NOT NULL,
  given_names         VARCHAR(150)    NULL,
  family_name         VARCHAR(150)    NULL,
  email               VARCHAR(255)    NULL,
  institution_id      INT UNSIGNED    NULL,
  scopus_id           VARCHAR(50)     NULL  COMMENT 'Scopus Author ID',
  researcher_id       VARCHAR(50)     NULL  COMMENT 'ResearcherID / Web of Science',
  h_index             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  citation_count      INT UNSIGNED    NOT NULL DEFAULT 0,
  sinta_id            VARCHAR(50)     NULL,
  country             VARCHAR(100)    NULL,
  profile_cache_json  LONGTEXT        NULL  COMMENT 'Raw profile data dari wizdam-apis ORCID endpoint',
  cache_expires_at    TIMESTAMP       NULL,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY fk_researchers_institution (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
  INDEX idx_name        (name(100)),
  INDEX idx_scopus      (scopus_id),
  INDEX idx_institution (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 2: Knowledge ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS journals (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(512)    NOT NULL,
  issn              VARCHAR(10)     NULL,
  e_issn            VARCHAR(10)     NULL,
  publisher         VARCHAR(255)    NULL,
  country           VARCHAR(100)    NULL,
  sjr_score         DECIMAL(10,4)   NULL,
  snip_score        DECIMAL(10,4)   NULL,
  cite_score        DECIMAL(10,4)   NULL,
  h_index           SMALLINT UNSIGNED NULL,
  quartile          TINYINT UNSIGNED  NULL  COMMENT '1–4',
  sinta_score       DECIMAL(10,4)   NULL,
  sinta_grade       VARCHAR(5)      NULL    COMMENT 'S1–S6',
  scopus_source_id  VARCHAR(50)     NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_issn   (issn),
  INDEX idx_title      (title(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publications (
  doi               VARCHAR(512)    NOT NULL PRIMARY KEY  COMMENT 'Lowercase DOI as PK',
  title             VARCHAR(1024)   NOT NULL,
  abstract          LONGTEXT        NULL,
  publication_year  SMALLINT UNSIGNED NULL,
  type              VARCHAR(50)     NULL  COMMENT 'journal-article | conference-paper | book | etc.',
  journal_id        INT UNSIGNED    NULL,
  volume            VARCHAR(20)     NULL,
  issue             VARCHAR(20)     NULL,
  pages             VARCHAR(50)     NULL,
  publisher         VARCHAR(255)    NULL,
  citation_count    INT UNSIGNED    NOT NULL DEFAULT 0  COMMENT 'Best count dari multi-source',
  citation_sources  JSON            NULL  COMMENT '{"crossref":12,"openalex":14}',
  sdg_cache_json    LONGTEXT        NULL  COMMENT 'Cached SDG classification result',
  raw_data_json     LONGTEXT        NULL  COMMENT 'Raw data dari wizdam-apis',
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY fk_publications_journal (journal_id) REFERENCES journals(id) ON DELETE SET NULL,
  INDEX idx_year    (publication_year),
  INDEX idx_journal (journal_id),
  FULLTEXT INDEX ft_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publication_authors (
  id                INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  doi               VARCHAR(512)    NOT NULL,
  orcid             VARCHAR(20)     NULL,
  name              VARCHAR(255)    NOT NULL,
  given_names       VARCHAR(150)    NULL,
  family_name       VARCHAR(150)    NULL,
  sequence          TINYINT UNSIGNED NOT NULL DEFAULT 1  COMMENT '1 = first author',
  is_corresponding  TINYINT(1)      NOT NULL DEFAULT 0,
  FOREIGN KEY fk_pa_doi   (doi)   REFERENCES publications(doi)  ON DELETE CASCADE,
  FOREIGN KEY fk_pa_orcid (orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_doi   (doi(191)),
  INDEX idx_orcid (orcid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 3: Intelligence ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_sdgs (
  id                    INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  doi                   VARCHAR(512)    NOT NULL,
  sdg_number            TINYINT UNSIGNED NOT NULL  COMMENT '1–17',
  sdg_version           VARCHAR(10)     NOT NULL DEFAULT 'v5'  COMMENT 'SDG classifier version',
  confidence            DECIMAL(5,4)    NULL  COMMENT '0.0000–1.0000',
  classification_detail JSON            NULL  COMMENT 'Full result dari wizdam-apis SDG classifier',
  classified_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_doi_sdg_ver (doi(191), sdg_number, sdg_version),
  FOREIGN KEY fk_work_sdgs_doi (doi) REFERENCES publications(doi) ON DELETE CASCADE,
  INDEX idx_sdg (sdg_number),
  INDEX idx_doi (doi(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ecosystem_cache (
  cache_key   VARCHAR(512)    NOT NULL PRIMARY KEY,
  payload     LONGTEXT        NOT NULL  COMMENT 'JSON',
  expires_at  TIMESTAMP       NOT NULL,
  created_by  VARCHAR(50)     NULL  COMMENT 'mapper | sikola | apis | analytics',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  snapshot_type VARCHAR(50)     NOT NULL  COMMENT 'institution_impact | researcher_trend | sdg_distribution',
  entity_type   VARCHAR(30)     NOT NULL  COMMENT 'institution | researcher | journal | global',
  entity_id     VARCHAR(255)    NOT NULL  COMMENT 'ORCID / institution_id / issn / global',
  period        VARCHAR(20)     NULL      COMMENT '2024 | 2024-Q1 | all-time',
  data_json     LONGTEXT        NOT NULL  COMMENT 'Computed result',
  computed_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type_entity (snapshot_type, entity_type, entity_id(100)),
  INDEX idx_period      (period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 4: Platform ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  key_hash        VARCHAR(64)     NOT NULL UNIQUE  COMMENT 'sha256(raw_key)',
  user_id         VARCHAR(255)    NOT NULL          COMMENT 'App-level user ID or app name',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  permissions_json JSON           NULL  COMMENT 'Reserved for endpoint-scoping',
  last_used_at    TIMESTAMP       NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user   (user_id(100)),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id            INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id       VARCHAR(255)    NOT NULL,
  window_start  INT UNSIGNED    NOT NULL  COMMENT 'Unix timestamp of window start',
  hit_count     INT UNSIGNED    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_user_window (user_id(100), window_start),
  INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  queue         VARCHAR(100)    NOT NULL DEFAULT 'default',
  payload       LONGTEXT        NOT NULL,
  attempts      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  reserved_at   TIMESTAMP       NULL,
  available_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_queue_available (queue, available_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 5: Users ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_accounts (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  orcid           VARCHAR(20)     NULL UNIQUE,
  email           VARCHAR(255)    NOT NULL UNIQUE,
  password_hash   VARCHAR(255)    NULL  COMMENT 'bcrypt hash; NULL = ORCID-only auth',
  name            VARCHAR(255)    NOT NULL DEFAULT '',
  role            VARCHAR(20)     NOT NULL DEFAULT 'user'  COMMENT 'user | admin',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  email_verified  TINYINT(1)      NOT NULL DEFAULT 0,
  last_login_at   TIMESTAMP       NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY fk_ua_orcid (orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_role  (role),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_external_ids (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  orcid           VARCHAR(20)     NOT NULL,
  id_type         VARCHAR(30)     NOT NULL  COMMENT 'scopus | researcher_id | sinta | google_scholar | loop',
  external_id     VARCHAR(100)    NOT NULL,
  sync_status     VARCHAR(20)     NOT NULL DEFAULT 'pending'  COMMENT 'synced | pending | failed | not_set',
  last_sync_at    TIMESTAMP       NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orcid_type (orcid, id_type),
  FOREIGN KEY fk_uei_orcid (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_orcid (orcid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_collections (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  orcid           VARCHAR(20)     NOT NULL,
  name            VARCHAR(100)    NOT NULL,
  description     TEXT            NULL,
  privacy         ENUM('public','private') NOT NULL DEFAULT 'private',
  tags            JSON            NULL,
  item_count      INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY fk_uc_orcid (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_orcid   (orcid),
  INDEX idx_privacy (privacy)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collection_items (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  collection_id   INT UNSIGNED    NOT NULL,
  doi             VARCHAR(512)    NOT NULL,
  item_type       VARCHAR(30)     NOT NULL DEFAULT 'article',
  added_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_collection_doi (collection_id, doi(191)),
  FOREIGN KEY fk_ci_collection (collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,
  FOREIGN KEY fk_ci_doi        (doi)           REFERENCES publications(doi)    ON DELETE CASCADE,
  INDEX idx_collection (collection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_activity_log (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  orcid           VARCHAR(20)     NOT NULL,
  activity_type   VARCHAR(30)     NOT NULL  COMMENT 'viewed | saved | downloaded | searched | analyzed | shared | exported',
  category        VARCHAR(30)     NOT NULL DEFAULT 'article'  COMMENT 'article | researcher | journal | search | system',
  target_id       VARCHAR(512)    NULL  COMMENT 'DOI, ORCID, ISSN, or search query',
  title           VARCHAR(300)    NULL,
  metadata_json   JSON            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY fk_ual_orcid (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_orcid      (orcid),
  INDEX idx_type       (activity_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 6: Collaboration & Networking ─────────────────────────────────

CREATE TABLE IF NOT EXISTS collaboration_requests (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  from_orcid      VARCHAR(20)     NOT NULL,
  to_orcid        VARCHAR(20)     NOT NULL,
  message         TEXT            NULL,
  status          ENUM('pending','accepted','rejected','cancelled') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_collab_req (from_orcid, to_orcid),
  FOREIGN KEY (from_orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  FOREIGN KEY (to_orcid)   REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS researcher_connections (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  orcid1          VARCHAR(20)     NOT NULL,
  orcid2          VARCHAR(20)     NOT NULL,
  connection_type VARCHAR(30)     NOT NULL  COMMENT 'collaborator | mentor | mentee | colleague',
  strength        TINYINT UNSIGNED NOT NULL DEFAULT 1  COMMENT '1-5 strength score',
  shared_projects INT UNSIGNED    NOT NULL DEFAULT 0,
  shared_publications INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_connection (orcid1, orcid2),
  FOREIGN KEY (orcid1) REFERENCES researchers(orcid) ON DELETE CASCADE,
  FOREIGN KEY (orcid2) REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_type (connection_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 7: Research Projects ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS research_projects (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)    NOT NULL,
  description     LONGTEXT        NULL,
  status          ENUM('planning','active','completed','cancelled','paused') NOT NULL DEFAULT 'planning',
  lead_orcid      VARCHAR(20)     NOT NULL,
  institution_id  INT UNSIGNED    NULL,
  sdg_focus       JSON            NULL  COMMENT '[3, 13, 7]',
  budget          DECIMAL(15,2)   NULL,
  spent           DECIMAL(15,2)   NULL DEFAULT 0,
  progress        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  start_date      DATE            NULL,
  end_date        DATE            NULL,
  visibility      ENUM('public','private','restricted') NOT NULL DEFAULT 'private',
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_orcid)      REFERENCES researchers(orcid) ON DELETE CASCADE,
  FOREIGN KEY (institution_id)  REFERENCES institutions(id)   ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_lead   (lead_orcid),
  FULLTEXT INDEX ft_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_members (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  project_id      INT UNSIGNED    NOT NULL,
  orcid           VARCHAR(20)     NOT NULL,
  role            VARCHAR(100)    NOT NULL DEFAULT 'Member',
  contribution    TEXT            NULL,
  joined_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proj_member (project_id, orcid),
  FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (orcid)      REFERENCES researchers(orcid)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_milestones (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  project_id      INT UNSIGNED    NOT NULL,
  title           VARCHAR(255)    NOT NULL,
  description     TEXT            NULL,
  target_date     DATE            NOT NULL,
  completion_date DATE            NULL,
  status          ENUM('planned','in-progress','completed','overdue') NOT NULL DEFAULT 'planned',
  deliverables    JSON            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_date   (target_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_publications (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  project_id      INT UNSIGNED    NOT NULL,
  doi             VARCHAR(512)    NOT NULL,
  contribution    TEXT            NULL,
  added_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_proj_pub (project_id, doi(191)),
  FOREIGN KEY (project_id) REFERENCES research_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (doi)        REFERENCES publications(doi)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 8: Research Matching ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS researcher_match_criteria (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  orcid           VARCHAR(20)     NOT NULL UNIQUE,
  research_interests JSON          NULL  COMMENT '["climate", "SDG3", "AI"]',
  sdg_preferences JSON            NULL  COMMENT '[3, 13, 7]',
  expertise_areas JSON            NULL,
  availability    VARCHAR(50)     NULL  COMMENT 'available | selective | unavailable',
  collaboration_goals TEXT         NULL,
  preferred_team_size TINYINT UNSIGNED NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orcid) REFERENCES researchers(orcid) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS research_matches (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  requester_orcid VARCHAR(20)     NOT NULL,
  matched_orcid   VARCHAR(20)     NOT NULL,
  match_score     DECIMAL(5,2)    NOT NULL  COMMENT '0.00-1.00',
  match_reasons   JSON            NULL,
  status          ENUM('pending','viewed','contacted','rejected') NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_match (requester_orcid, matched_orcid),
  FOREIGN KEY (requester_orcid) REFERENCES researchers(orcid) ON DELETE CASCADE,
  FOREIGN KEY (matched_orcid)   REFERENCES researchers(orcid) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_score  (match_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 9: Innovation & Marketplace ────────────────────────────────────

CREATE TABLE IF NOT EXISTS innovation_categories (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL UNIQUE,
  description     TEXT            NULL,
  icon_color      VARCHAR(7)      NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS innovation_opportunities (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)    NOT NULL,
  description     LONGTEXT        NOT NULL,
  category_id     INT UNSIGNED    NOT NULL,
  status          ENUM('open','in-progress','completed','closed') NOT NULL DEFAULT 'open',
  posted_by_orcid VARCHAR(20)     NULL,
  deadline        DATE            NULL,
  sdg_alignment   JSON            NULL  COMMENT '[3, 13]',
  budget_range    VARCHAR(50)     NULL,
  required_skills JSON            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id)     REFERENCES innovation_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (posted_by_orcid) REFERENCES researchers(orcid)        ON DELETE SET NULL,
  INDEX idx_status   (status),
  INDEX idx_category (category_id),
  FULLTEXT INDEX ft_title (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS innovation_reviews (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  opportunity_id  INT UNSIGNED    NOT NULL,
  reviewer_orcid  VARCHAR(20)     NOT NULL,
  rating          TINYINT UNSIGNED NOT NULL  COMMENT '1-5',
  comment         TEXT            NULL,
  relevance_score TINYINT UNSIGNED NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (opportunity_id) REFERENCES innovation_opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_orcid) REFERENCES researchers(orcid)           ON DELETE CASCADE,
  INDEX idx_opportunity (opportunity_id),
  INDEX idx_rating      (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 10: Sponsorships & Partnerships ────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsor_categories (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL UNIQUE,
  description     TEXT            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsors (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  organization    VARCHAR(255)    NOT NULL UNIQUE,
  category_id     INT UNSIGNED    NULL,
  tier            ENUM('platinum','gold','silver','bronze') NOT NULL DEFAULT 'bronze',
  logo_url        VARCHAR(512)    NULL,
  website         VARCHAR(512)    NULL,
  description     TEXT            NULL,
  focus_areas     JSON            NULL,
  since_date      DATE            NOT NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES sponsor_categories(id) ON DELETE SET NULL,
  INDEX idx_tier     (tier),
  INDEX idx_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsorship_applications (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  organization    VARCHAR(255)    NOT NULL,
  contact_name    VARCHAR(255)    NOT NULL,
  contact_email   VARCHAR(255)    NOT NULL,
  contact_phone   VARCHAR(20)     NULL,
  tier            ENUM('platinum','gold','silver','bronze') NOT NULL,
  website         VARCHAR(512)    NULL,
  description     TEXT            NULL,
  motivation      LONGTEXT        NULL,
  status          ENUM('pending','reviewing','approved','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT            NULL,
  submitted_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at     TIMESTAMP       NULL,
  reviewed_by_orcid VARCHAR(20)    NULL,
  INDEX idx_status (status),
  INDEX idx_email  (contact_email),
  INDEX idx_tier   (tier),
  FOREIGN KEY (reviewed_by_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sponsor_impact_reports (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  sponsor_id      INT UNSIGNED    NOT NULL,
  report_period   VARCHAR(20)     NOT NULL  COMMENT '2024-Q1, 2024',
  metrics_json    LONGTEXT        NOT NULL  COMMENT 'impressions, clicks, engagement',
  publications_supported INT UNSIGNED NULL,
  researchers_reached INT UNSIGNED NULL,
  sdg_contribution TEXT            NULL,
  report_url      VARCHAR(512)    NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE,
  INDEX idx_period   (report_period),
  INDEX idx_sponsor  (sponsor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partner_categories (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL UNIQUE  COMMENT 'data | research | government | technology',
  description     TEXT            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS partners (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  organization    VARCHAR(255)    NOT NULL UNIQUE,
  category_id     INT UNSIGNED    NOT NULL,
  logo_url        VARCHAR(512)    NULL,
  website         VARCHAR(512)    NULL,
  description     LONGTEXT        NULL,
  type            VARCHAR(50)     NOT NULL  COMMENT 'academic | nonprofit | industry | government',
  since_date      DATE            NOT NULL,
  contact_email   VARCHAR(255)    NULL,
  cooperation_areas JSON           NULL,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES partner_categories(id) ON DELETE RESTRICT,
  INDEX idx_active   (is_active),
  INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 11: Communication ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_orcid      VARCHAR(20)     NULL  COMMENT 'NULL for anonymous users',
  session_token   VARCHAR(255)    NOT NULL UNIQUE,
  topic           VARCHAR(100)    NULL,
  message_count   INT UNSIGNED    NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP       NULL,
  ended_at        TIMESTAMP       NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_user     (user_orcid),
  INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id      BIGINT UNSIGNED NOT NULL,
  sender          ENUM('user','bot') NOT NULL,
  message_text    TEXT            NOT NULL,
  message_type    VARCHAR(20)     NOT NULL DEFAULT 'text'  COMMENT 'text | suggestion | faq',
  faq_reference   INT UNSIGNED    NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id)    REFERENCES chat_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (faq_reference) REFERENCES chatbot_faq(id)   ON DELETE SET NULL,
  INDEX idx_session  (session_id),
  INDEX idx_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chatbot_faq (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  category        VARCHAR(50)     NOT NULL,
  question        VARCHAR(255)    NOT NULL,
  answer          LONGTEXT        NOT NULL,
  keywords        JSON            NULL,
  usage_count     INT UNSIGNED    NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  FULLTEXT INDEX ft_question (question)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 12: Analytics & Monitoring ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS page_analytics (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  page_path       VARCHAR(512)    NOT NULL,
  page_title      VARCHAR(255)    NULL,
  views           INT UNSIGNED    NOT NULL DEFAULT 0,
  unique_visitors INT UNSIGNED    NOT NULL DEFAULT 0,
  avg_duration    DECIMAL(10,2)   NULL  COMMENT 'seconds',
  bounce_rate     DECIMAL(5,2)    NULL  COMMENT '0-100',
  exit_rate       DECIMAL(5,2)    NULL,
  date            DATE            NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_page_date (page_path(191), date),
  INDEX idx_date     (date),
  INDEX idx_path     (page_path(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS access_logs (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_orcid      VARCHAR(20)     NULL,
  ip_address      VARCHAR(45)     NOT NULL,
  page_path       VARCHAR(512)    NOT NULL,
  http_method     VARCHAR(10)     NOT NULL,
  http_status     SMALLINT UNSIGNED NOT NULL,
  device_type     VARCHAR(50)     NULL  COMMENT 'desktop | mobile | tablet',
  browser         VARCHAR(100)    NULL,
  city            VARCHAR(100)    NULL,
  country         VARCHAR(100)    NULL,
  session_duration INT UNSIGNED    NULL  COMMENT 'seconds',
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL,
  INDEX idx_user     (user_orcid),
  INDEX idx_date     (created_at),
  INDEX idx_page     (page_path(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LAYER 13: Teams & Editorial ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_departments (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)    NOT NULL UNIQUE,
  description     TEXT            NULL,
  lead_orcid      VARCHAR(20)     NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_orcid) REFERENCES researchers(orcid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS team_members (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  orcid           VARCHAR(20)     NOT NULL,
  department_id   INT UNSIGNED    NOT NULL,
  position        VARCHAR(100)    NOT NULL,
  bio             TEXT            NULL,
  photo_url       VARCHAR(512)    NULL,
  expertise       JSON            NULL,
  social_links    JSON            NULL  COMMENT '{"twitter": "...", "linkedin": "..."}',
  display_order   INT UNSIGNED    NOT NULL DEFAULT 0,
  is_visible      TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_team_member (orcid, department_id),
  FOREIGN KEY (orcid)          REFERENCES researchers(orcid)     ON DELETE CASCADE,
  FOREIGN KEY (department_id)  REFERENCES team_departments(id)   ON DELETE CASCADE,
  INDEX idx_order    (display_order),
  INDEX idx_visible  (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
