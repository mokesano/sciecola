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

SET FOREIGN_KEY_CHECKS = 1;
