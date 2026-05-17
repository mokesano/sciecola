-- =====================================================================
-- Landing page narrative content (per-language)
--
-- Sumber utama teks naratif untuk PublicHomePage.jsx (halaman publik
-- untuk pengunjung yang belum login). Dikelola oleh admin via:
--   - POST /api/admin/landing_content.php
-- Dibaca publik via:
--   - GET  /api/landing_content.php?lang=<id|en>
--
-- Jika tabel ini kosong / row untuk bahasa tertentu belum ada, frontend
-- akan jatuh ke locale file (id.json / en.json) sebagai fallback.
-- =====================================================================

CREATE TABLE IF NOT EXISTS landing_content (
  lang        VARCHAR(8)  NOT NULL PRIMARY KEY,
  content     JSON        NOT NULL,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by  VARCHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
