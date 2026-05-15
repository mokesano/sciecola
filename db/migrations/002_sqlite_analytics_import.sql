-- =============================================================
-- Migration 002: SDGs-analytics (SQLite) → Unified MySQL Schema
-- =============================================================
-- Untuk dijalankan SETELAH data SQLite diekspor ke format CSV/SQL.
--
-- Langkah manual sebelum menjalankan ini:
--   1. Export dari SQLite di repo SDGs-analytics:
--      sqlite3 database.sqlite ".mode csv" ".output works.csv" "SELECT * FROM works;"
--      sqlite3 database.sqlite ".mode csv" ".output work_sdgs.csv" "SELECT * FROM work_sdgs;"
--
--   2. Import CSV ke tabel staging (jalankan dari MySQL client):
--      LOAD DATA INFILE '/path/works.csv' INTO TABLE staging_works ...
--
-- Script ini mengasumsikan tabel staging sudah diisi.
-- =============================================================

START TRANSACTION;

-- Tabel staging (sementara, dari data SQLite SDGs-analytics)
CREATE TEMPORARY TABLE IF NOT EXISTS staging_works (
    put_code        VARCHAR(50),
    researcher_id   VARCHAR(50),   -- ORCID ID di SDGs-analytics
    title           TEXT,
    abstract        TEXT,
    doi             VARCHAR(512),
    publication_year SMALLINT,
    journal_title   VARCHAR(512)
);

CREATE TEMPORARY TABLE IF NOT EXISTS staging_work_sdgs (
    put_code        VARCHAR(50),
    sdg_code        VARCHAR(10),
    confidence_score REAL,
    contributor_type VARCHAR(100)
);

-- STEP A: Masukkan works baru yang belum ada di publications
INSERT IGNORE INTO publications (
    doi,
    put_code,
    title,
    abstract,
    publication_year,
    journal_title,
    document_type
)
SELECT
    NULLIF(sw.doi, ''),
    sw.put_code,
    sw.title,
    sw.abstract,
    sw.publication_year,
    sw.journal_title,
    'article'
FROM staging_works sw
WHERE sw.title IS NOT NULL AND sw.title != '';

-- STEP B: Link researcher via put_code → publication_authors
INSERT IGNORE INTO publication_authors (
    publication_id,
    researcher_id,
    author_name,
    author_order,
    orcid_id
)
SELECT
    p.id,
    r.id,
    r.full_name,
    1,
    sw.researcher_id
FROM staging_works sw
INNER JOIN publications p ON (
    (sw.put_code IS NOT NULL AND p.put_code = sw.put_code)
    OR (sw.doi IS NOT NULL AND p.doi = sw.doi)
)
LEFT JOIN researchers r ON r.orcid_id = sw.researcher_id
WHERE sw.researcher_id IS NOT NULL;

-- STEP C: Import work_sdgs granular dari SDGs-analytics
INSERT IGNORE INTO work_sdgs (
    publication_id,
    sdg_code,
    confidence_score,
    contributor_type,
    mapped_by
)
SELECT
    p.id,
    sws.sdg_code,
    sws.confidence_score,
    CASE sws.contributor_type
        WHEN 'Active Contributor'   THEN 'Active Contributor'
        WHEN 'Relevant Contributor' THEN 'Relevant Contributor'
        WHEN 'Discutor'             THEN 'Discutor'
        ELSE 'Not Relevant'
    END,
    'ai_model'
FROM staging_work_sdgs sws
INNER JOIN publications p ON p.put_code = sws.put_code
WHERE sws.sdg_code REGEXP '^SDG(1[0-7]|[1-9])$';

-- STEP D: Update publications.sdgs_goals (JSON summary) dari work_sdgs
UPDATE publications p
SET sdgs_goals = (
    SELECT JSON_ARRAYAGG(ws.sdg_code)
    FROM work_sdgs ws
    WHERE ws.publication_id = p.id
      AND ws.contributor_type IN ('Active Contributor', 'Relevant Contributor')
)
WHERE p.sdgs_goals IS NULL;

COMMIT;

SELECT
    'Migration 002 complete' AS status,
    (SELECT COUNT(*) FROM staging_works)    AS staging_works_count,
    (SELECT COUNT(*) FROM staging_work_sdgs) AS staging_sdgs_count;
