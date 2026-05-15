-- =============================================================
-- Wizdam Ecosystem — Unified Database Schema
-- Database: wizdam_ecosystem
--
-- Digunakan bersama oleh:
--   - sdgs-mapper     (SDG classification & researcher mapping)
--   - SDGs-analytics  (analytics & trends)
--   - wizdam-apis     (API gateway & key management)
--   - wizdam-sikola   (core academic platform)
--
-- Engine:  MariaDB 10.6+ / MySQL 8.0+
-- Charset: utf8mb4_unicode_ci
--
-- Cara menjalankan:
--   mysql -u root -p wizdam_ecosystem < db/schema.sql
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- =============================================================
-- LAYER 1: IDENTITY — Pengguna & Institusi
-- =============================================================

CREATE TABLE IF NOT EXISTS institutions (
    id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    short_name      VARCHAR(100)    NULL,
    type            ENUM('university','research_center','government','private','international') NOT NULL DEFAULT 'university',
    country         VARCHAR(100)    NOT NULL DEFAULT 'Indonesia',
    province        VARCHAR(100)    NULL,
    city            VARCHAR(100)    NULL,
    address         TEXT            NULL,
    website         VARCHAR(255)    NULL,
    logo_url        VARCHAR(500)    NULL,
    latitude        DECIMAL(10,8)   NULL,
    longitude       DECIMAL(11,8)   NULL,
    orcid_id        VARCHAR(50)     NULL COMMENT 'Institutional ORCID',
    ror_id          VARCHAR(50)     NULL COMMENT 'Research Organization Registry',
    grid_id         VARCHAR(50)     NULL,
    total_researchers INT UNSIGNED  NOT NULL DEFAULT 0,
    total_publications INT UNSIGNED NOT NULL DEFAULT 0,
    wizdam_score    DECIMAL(10,2)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name    (name(100)),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id                  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    email               VARCHAR(255)    NOT NULL,
    username            VARCHAR(100)    NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    full_name           VARCHAR(255)    NULL,
    avatar_url          VARCHAR(500)    NULL,
    bio                 TEXT            NULL,
    institution_id      INT UNSIGNED    NULL,
    role                ENUM('user','admin','super_admin') NOT NULL DEFAULT 'user',
    subscription_tier   ENUM('free','pro','enterprise')   NOT NULL DEFAULT 'free',
    is_verified         TINYINT(1)      NOT NULL DEFAULT 0,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    last_login_at       DATETIME        NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email    (email),
    UNIQUE KEY uq_username (username),
    FOREIGN KEY fk_users_institution (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED    NOT NULL,
    token_hash  VARCHAR(255)    NOT NULL,
    ip_address  VARCHAR(45)     NULL,
    user_agent  TEXT            NULL,
    expires_at  DATETIME        NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_token  (token_hash),
    FOREIGN KEY fk_sessions_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_2fa (
    user_id     INT UNSIGNED    NOT NULL PRIMARY KEY,
    secret      VARCHAR(64)     NOT NULL,
    method      ENUM('totp','email') NOT NULL DEFAULT 'totp',
    is_enabled  TINYINT(1)      NOT NULL DEFAULT 0,
    backup_codes JSON            NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY fk_2fa_user (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- LAYER 2: KNOWLEDGE — Peneliti & Publikasi
-- =============================================================

CREATE TABLE IF NOT EXISTS researchers (
    id                  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED    NULL COMMENT 'Link ke akun login',
    institution_id      INT UNSIGNED    NULL,
    full_name           VARCHAR(255)    NOT NULL,
    preferred_name      VARCHAR(255)    NULL,
    email               VARCHAR(255)    NULL,
    orcid_id            VARCHAR(50)     NULL,
    scopus_id           VARCHAR(50)     NULL,
    sinta_id            VARCHAR(50)     NULL,
    google_scholar_id   VARCHAR(100)    NULL,
    researchgate_url    VARCHAR(255)    NULL,
    position_title      VARCHAR(255)    NULL,
    department          VARCHAR(255)    NULL,
    field_of_study      JSON            NULL,
    expertise_tags      JSON            NULL,
    latitude            DECIMAL(10,8)   NULL,
    longitude           DECIMAL(11,8)   NULL,
    total_publications  INT UNSIGNED    NOT NULL DEFAULT 0,
    total_citations     INT UNSIGNED    NOT NULL DEFAULT 0,
    h_index             INT UNSIGNED    NOT NULL DEFAULT 0,
    wizdam_score        DECIMAL(10,2)   NOT NULL DEFAULT 0,
    sdgs_primary_goals  JSON            NULL COMMENT 'Top SDG goals dari publikasi peneliti',
    is_claimed          TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Apakah profil sudah diklaim pemiliknya',
    last_sync_at        DATETIME        NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orcid  (orcid_id),
    FOREIGN KEY fk_researchers_user        (user_id)        REFERENCES users(id)        ON DELETE SET NULL,
    FOREIGN KEY fk_researchers_institution (institution_id) REFERENCES institutions(id) ON DELETE SET NULL,
    INDEX idx_full_name (full_name(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publications (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doi                 VARCHAR(512)    NULL,
    put_code            VARCHAR(50)     NULL COMMENT 'ORCID put-code untuk kompatibilitas SDGs-analytics',
    title               TEXT            NOT NULL,
    abstract            TEXT            NULL,
    publication_date    DATE            NULL,
    publication_year    SMALLINT UNSIGNED NULL,
    journal_title       VARCHAR(512)    NULL,
    publisher           VARCHAR(255)    NULL,
    volume              VARCHAR(50)     NULL,
    issue               VARCHAR(50)     NULL,
    pages               VARCHAR(50)     NULL,
    issn                VARCHAR(20)     NULL,
    document_type       ENUM('article','conference','book','chapter','thesis','report','preprint','other') NOT NULL DEFAULT 'article',
    access_type         ENUM('open_access','subscription','hybrid') NOT NULL DEFAULT 'subscription',
    pdf_url             VARCHAR(500)    NULL,
    fulltext_url        VARCHAR(500)    NULL,
    cited_by_count      INT UNSIGNED    NOT NULL DEFAULT 0,
    wizdam_score        DECIMAL(10,2)   NOT NULL DEFAULT 0,
    sdgs_goals          JSON            NULL COMMENT 'Cache ringkas hasil mapping SDG',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doi      (doi(191)),
    UNIQUE KEY uq_put_code (put_code),
    INDEX idx_year         (publication_year),
    FULLTEXT idx_fts_title_abstract (title, abstract)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publication_authors (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    publication_id      BIGINT UNSIGNED NOT NULL,
    researcher_id       INT UNSIGNED    NULL COMMENT 'NULL jika peneliti belum terdaftar',
    author_name         VARCHAR(255)    NOT NULL COMMENT 'Nama mentah dari metadata sumber',
    author_order        TINYINT UNSIGNED NOT NULL DEFAULT 1,
    is_corresponding    TINYINT(1)      NOT NULL DEFAULT 0,
    affiliation         VARCHAR(500)    NULL,
    orcid_id            VARCHAR(50)     NULL,
    FOREIGN KEY fk_pub_authors_pub  (publication_id) REFERENCES publications(id)  ON DELETE CASCADE,
    FOREIGN KEY fk_pub_authors_res  (researcher_id)  REFERENCES researchers(id)   ON DELETE SET NULL,
    INDEX idx_publication (publication_id),
    INDEX idx_researcher  (researcher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- LAYER 3: INTELLIGENCE — SDG Mapping & Citations
-- =============================================================

CREATE TABLE IF NOT EXISTS work_sdgs (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    publication_id      BIGINT UNSIGNED NOT NULL,
    sdg_code            VARCHAR(10)     NOT NULL COMMENT 'SDG1 s/d SDG17',
    confidence_score    DECIMAL(5,4)    NULL COMMENT 'Skor kepercayaan 0.0000-1.0000',
    contributor_type    ENUM('Active Contributor','Relevant Contributor','Discutor','Not Relevant') NULL,
    keyword_score       DECIMAL(5,4)    NULL,
    similarity_score    DECIMAL(5,4)    NULL,
    causal_score        DECIMAL(5,4)    NULL,
    impact_score        DECIMAL(5,4)    NULL,
    mapped_by           ENUM('ai_model','manual','keyword_match') NOT NULL DEFAULT 'ai_model',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_pub_sdg      (publication_id, sdg_code),
    FOREIGN KEY fk_work_sdgs_pub (publication_id) REFERENCES publications(id) ON DELETE CASCADE,
    INDEX idx_sdg_code          (sdg_code),
    INDEX idx_contributor_type  (contributor_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS citations (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    citing_publication_id   BIGINT UNSIGNED NULL,
    cited_publication_id    BIGINT UNSIGNED NOT NULL,
    citation_source         ENUM('openalex','opencitations','crossref','scopus','manual') NOT NULL,
    external_id             VARCHAR(100)    NULL,
    citation_year           SMALLINT UNSIGNED NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_citation (citing_publication_id, cited_publication_id, citation_source),
    FOREIGN KEY fk_citations_citing (citing_publication_id) REFERENCES publications(id) ON DELETE SET NULL,
    FOREIGN KEY fk_citations_cited  (cited_publication_id)  REFERENCES publications(id) ON DELETE CASCADE,
    INDEX idx_cited    (cited_publication_id),
    INDEX idx_cit_year (citation_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- LAYER 4: PLATFORM — Statistik & Cache Operasional
-- Tabel ini dipertahankan untuk backward compatibility dan performa
-- (sdgs-mapper saat ini menggunakan tabel-tabel ini secara langsung)
-- =============================================================

CREATE TABLE IF NOT EXISTS sdg_cache (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cache_key   VARCHAR(512)    NOT NULL,
    payload     MEDIUMTEXT      NOT NULL,
    expires_at  DATETIME        NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cache_key (cache_key(191)),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orcid_profiles (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    orcid_id     CHAR(19)        NOT NULL,
    profile_json MEDIUMTEXT      NOT NULL,
    expires_at   DATETIME        NOT NULL,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orcid (orcid_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doi_results (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doi         VARCHAR(512)    NOT NULL,
    result_json MEDIUMTEXT      NOT NULL,
    expires_at  DATETIME        NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doi (doi(191)),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classified_works (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doi              VARCHAR(512)    NULL,
    orcid_id         CHAR(19)        NULL,
    publication_id   BIGINT UNSIGNED NULL COMMENT 'FK ke publications setelah migrasi',
    title            TEXT            NOT NULL,
    abstract_text    TEXT            NULL,
    journal_title    VARCHAR(512)    NULL,
    publication_year SMALLINT        NULL,
    sdgs_json        TEXT            NOT NULL COMMENT 'JSON array ["SDG3","SDG13"]',
    scores_json      TEXT            NULL     COMMENT 'Score breakdown JSON lengkap',
    classified_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY fk_cw_publication (publication_id) REFERENCES publications(id) ON DELETE SET NULL,
    INDEX idx_doi    (doi(191)),
    INDEX idx_orcid  (orcid_id),
    INDEX idx_year   (publication_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_stats (
    id          INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    stat_key    VARCHAR(100)    NOT NULL,
    stat_value  BIGINT          NOT NULL DEFAULT 0,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_stat_key (stat_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO platform_stats (stat_key, stat_value) VALUES
    ('total_articles',    0),
    ('total_researchers', 0),
    ('total_journals',    0),
    ('total_sdg_tags',    0),
    ('total_citations',   0),
    ('total_institutions',0);

CREATE TABLE IF NOT EXISTS sdg_trends (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    year        SMALLINT        NOT NULL,
    sdg_code    VARCHAR(10)     NOT NULL,
    count       INT UNSIGNED    NOT NULL DEFAULT 0,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_year_sdg (year, sdg_code),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- LAYER 5: INFRASTRUCTURE — API Keys & Jobs
-- (digunakan oleh wizdam-apis)
-- =============================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED    NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    api_key_hash    VARCHAR(255)    NOT NULL,
    permissions     JSON            NULL,
    rate_limit      INT UNSIGNED    NOT NULL DEFAULT 1000 COMMENT 'Request per hari',
    expires_at      DATETIME        NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    last_used_at    DATETIME        NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_api_key_hash (api_key_hash),
    FOREIGN KEY fk_api_keys_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id          VARCHAR(100)    NOT NULL,
    class           VARCHAR(255)    NOT NULL,
    payload         TEXT            NOT NULL,
    status          ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
    priority        TINYINT UNSIGNED NOT NULL DEFAULT 5,
    attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    result          TEXT            NULL,
    error           TEXT            NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at    DATETIME        NULL,
    UNIQUE KEY uq_job_id (job_id),
    INDEX idx_status   (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
