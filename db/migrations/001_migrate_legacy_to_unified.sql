-- =============================================================
-- Migration 001: Legacy sdgs-mapper tables → Unified Schema
-- =============================================================
-- Jalankan SETELAH schema.sql sudah dieksekusi.
-- Script ini memindahkan data lama ke tabel unified tanpa
-- menghapus tabel lama (backward compatible).
--
--   mysql -u root -p wizdam_ecosystem < db/migrations/001_migrate_legacy_to_unified.sql
-- =============================================================

START TRANSACTION;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Populate researchers dari orcid_profiles cache
-- Ambil data profil ORCID yang sudah ada di cache,
-- masukkan ke tabel researchers sebagai unclaimed profiles.
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO researchers (
    orcid_id,
    full_name,
    is_claimed,
    last_sync_at,
    created_at,
    updated_at
)
SELECT
    op.orcid_id,
    COALESCE(
        JSON_UNQUOTE(JSON_EXTRACT(op.profile_json, '$.name.credit-name.value')),
        CONCAT(
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(op.profile_json, '$.name.given-names.value')), ''),
            ' ',
            COALESCE(JSON_UNQUOTE(JSON_EXTRACT(op.profile_json, '$.name.family-name.value')), '')
        )
    ),
    0,
    op.updated_at,
    op.updated_at,
    NOW()
FROM orcid_profiles op
WHERE op.orcid_id IS NOT NULL
  AND op.expires_at > NOW();

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Populate publications dari classified_works
-- Setiap classified_work yang punya DOI jadi satu publications row.
-- ─────────────────────────────────────────────────────────────

INSERT IGNORE INTO publications (
    doi,
    title,
    abstract,
    publication_year,
    journal_title,
    sdgs_goals,
    created_at,
    updated_at
)
SELECT
    cw.doi,
    cw.title,
    cw.abstract_text,
    cw.publication_year,
    cw.journal_title,
    cw.sdgs_json,
    cw.classified_at,
    NOW()
FROM classified_works cw
WHERE cw.doi IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Link classified_works.publication_id ke publications
-- ─────────────────────────────────────────────────────────────

UPDATE classified_works cw
INNER JOIN publications p ON p.doi = cw.doi
SET cw.publication_id = p.id
WHERE cw.doi IS NOT NULL AND cw.publication_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- STEP 4: Populate work_sdgs dari classified_works.sdgs_json
-- Expand JSON array ["SDG3","SDG13"] → satu baris per SDG.
-- Menggunakan stored procedure sementara untuk parsing JSON array.
-- ─────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS migrate_work_sdgs;

DELIMITER $$
CREATE PROCEDURE migrate_work_sdgs()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_pub_id BIGINT UNSIGNED;
    DECLARE v_sdgs_json TEXT;
    DECLARE v_idx INT;
    DECLARE v_sdg VARCHAR(10);
    DECLARE v_count INT;

    DECLARE cur CURSOR FOR
        SELECT p.id, cw.sdgs_json
        FROM classified_works cw
        INNER JOIN publications p ON p.doi = cw.doi
        WHERE cw.sdgs_json IS NOT NULL AND cw.doi IS NOT NULL;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO v_pub_id, v_sdgs_json;
        IF done THEN LEAVE read_loop; END IF;

        SET v_count = JSON_LENGTH(v_sdgs_json);
        SET v_idx = 0;

        WHILE v_idx < v_count DO
            SET v_sdg = JSON_UNQUOTE(JSON_EXTRACT(v_sdgs_json, CONCAT('$[', v_idx, ']')));

            INSERT IGNORE INTO work_sdgs (publication_id, sdg_code, mapped_by)
            VALUES (v_pub_id, v_sdg, 'keyword_match');

            SET v_idx = v_idx + 1;
        END WHILE;
    END LOOP;

    CLOSE cur;
END$$
DELIMITER ;

CALL migrate_work_sdgs();
DROP PROCEDURE IF EXISTS migrate_work_sdgs;

-- ─────────────────────────────────────────────────────────────
-- STEP 5: Rebuild sdg_trends dari work_sdgs (granular)
-- ─────────────────────────────────────────────────────────────

INSERT INTO sdg_trends (year, sdg_code, count)
SELECT
    p.publication_year,
    ws.sdg_code,
    COUNT(*) AS count
FROM work_sdgs ws
INNER JOIN publications p ON p.id = ws.publication_id
WHERE p.publication_year IS NOT NULL
GROUP BY p.publication_year, ws.sdg_code
ON DUPLICATE KEY UPDATE
    count = VALUES(count),
    updated_at = NOW();

-- ─────────────────────────────────────────────────────────────
-- STEP 6: Update platform_stats
-- ─────────────────────────────────────────────────────────────

INSERT INTO platform_stats (stat_key, stat_value)
VALUES
    ('total_articles',     (SELECT COUNT(*) FROM publications)),
    ('total_researchers',  (SELECT COUNT(*) FROM researchers)),
    ('total_sdg_tags',     (SELECT COUNT(*) FROM work_sdgs))
ON DUPLICATE KEY UPDATE
    stat_value = VALUES(stat_value),
    updated_at = NOW();

COMMIT;

SELECT
    'Migration 001 complete' AS status,
    (SELECT COUNT(*) FROM researchers)  AS researchers_migrated,
    (SELECT COUNT(*) FROM publications) AS publications_migrated,
    (SELECT COUNT(*) FROM work_sdgs)    AS work_sdgs_created;
