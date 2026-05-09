-- =============================================================
-- Sicola / SDGs Mapper — Database Schema
-- Compatible with MariaDB 10.6+ and PostgreSQL 14+
--
-- Run once:
--   mysql  -u root -p sicola_db < db/schema.sql
--   psql   -U sicola sicola_db  < db/schema.sql
-- =============================================================

-- 1. Generic key-value cache (replaces gzip file cache)
CREATE TABLE IF NOT EXISTS sdg_cache (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, -- use BIGSERIAL for PostgreSQL
    cache_key   VARCHAR(512)    NOT NULL,
    payload     MEDIUMTEXT      NOT NULL,                   -- use TEXT for PostgreSQL
    expires_at  DATETIME        NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cache_key (cache_key(191)),
    INDEX  idx_expires (expires_at)
);

-- 2. ORCID researcher profiles
CREATE TABLE IF NOT EXISTS orcid_profiles (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    orcid_id     CHAR(19)        NOT NULL,
    profile_json MEDIUMTEXT      NOT NULL,
    expires_at   DATETIME        NOT NULL,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orcid (orcid_id),
    INDEX  idx_expires (expires_at)
);

-- 3. DOI classification results
CREATE TABLE IF NOT EXISTS doi_results (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doi         VARCHAR(512)    NOT NULL,
    result_json MEDIUMTEXT      NOT NULL,
    expires_at  DATETIME        NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doi (doi(191)),
    INDEX  idx_expires (expires_at)
);

-- 4. Classified works (persisted SDG tags per article)
CREATE TABLE IF NOT EXISTS classified_works (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doi             VARCHAR(512)    DEFAULT NULL,
    orcid_id        CHAR(19)        DEFAULT NULL,
    title           TEXT            NOT NULL,
    abstract_text   TEXT            DEFAULT NULL,
    journal_title   VARCHAR(512)    DEFAULT NULL,
    publication_year SMALLINT       DEFAULT NULL,
    sdgs_json       TEXT            NOT NULL,               -- JSON array e.g. ["SDG3","SDG13"]
    scores_json     TEXT            DEFAULT NULL,           -- full score breakdown JSON
    classified_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doi     (doi(191)),
    INDEX idx_orcid   (orcid_id),
    INDEX idx_year    (publication_year)
);

-- 5. Platform-level statistics snapshot (updated by cron / on-demand)
CREATE TABLE IF NOT EXISTS platform_stats (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    stat_key        VARCHAR(100)    NOT NULL,
    stat_value      BIGINT          NOT NULL DEFAULT 0,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_stat_key (stat_key)
);

INSERT IGNORE INTO platform_stats (stat_key, stat_value) VALUES
  ('total_articles',    0),
  ('total_researchers', 0),
  ('total_journals',    0),
  ('total_sdg_tags',    0),
  ('total_citations',   0);

-- 6. SDG trend snapshots (year + SDG → article count)
CREATE TABLE IF NOT EXISTS sdg_trends (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    year        SMALLINT        NOT NULL,
    sdg_code    VARCHAR(10)     NOT NULL,
    count       INT UNSIGNED    NOT NULL DEFAULT 0,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_year_sdg (year, sdg_code),
    INDEX idx_year (year)
);

-- PostgreSQL-compatible equivalents (uncomment if using PostgreSQL):
-- ALTER TABLE sdg_cache       ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
-- (replace BIGINT UNSIGNED AUTO_INCREMENT with BIGSERIAL, MEDIUMTEXT with TEXT, DATETIME with TIMESTAMPTZ)
