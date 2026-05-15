# Wizdam Ecosystem — Unified Database Guide

**Canonical schema owner**: `sdgs-mapper / db/schema.sql`

Semua perubahan skema harus dilakukan di file tersebut, lalu disalin ke repo lain.

| Repository | Domain | Role DB |
|---|---|---|
| `sdgs-mapper` | sangia.org | **Writer utama** Layer 1 & 2 |
| `SDGs-analytics` | sangia.org | Reader + analytics snapshots |
| `wizdam-apis` | api.sangia.org | API gateway, writer `api_keys` & `jobs` |
| `wizdam-sikola` | stipwunaraha.ac.id | Identity management |
| `sdg-mono` | - | Legacy reader |

Semua aplikasi di **server yang sama** → `DB_HOST=127.0.0.1`.

---

## Setup Database (Jalankan Sekali di Server)

```bash
# Jalankan dari repo sdgs-mapper
mysql -u root -p < db/schema.sql

# User per aplikasi (least-privilege)
mysql -u root -p < db/setup-users.sql   # lihat bagian bawah panduan ini
```

---

## Konfigurasi `.env` (Identik untuk Semua Repo)

```env
# SHARED — nilai berikut HARUS sama di semua repo
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wizdam_ecosystem
DB_USERNAME=wizdam_mapper        # ganti per app (lihat tabel user di bawah)
DB_PASSWORD=your_password
DB_CHARSET=utf8mb4

# SHARED SECRET — generate sekali: openssl rand -hex 32
WIZDAM_SHARED_SECRET=same_value_as_in_all_other_apps

# API endpoint wizdam-apis
WIZDAM_API_URL=https://api.sangia.org
WIZDAM_API_KEY=wz_generated_key_here
```

---

## Struktur Tabel (10 Tabel)

### Layer 1 — Identity

| Tabel | Writer | Keterangan |
|---|---|---|
| `institutions` | sdgs-mapper, sikola | Data institusi/universitas |
| `researchers` | sdgs-mapper | Profil peneliti + cache ORCID JSON |

### Layer 2 — Knowledge

| Tabel | Writer | Keterangan |
|---|---|---|
| `journals` | sdgs-mapper | Metadata jurnal + Scopus metrics |
| `publications` | sdgs-mapper | Artikel ilmiah + cache DOI/SDG JSON |
| `publication_authors` | sdgs-mapper | Relasi publikasi ↔ peneliti |

### Layer 3 — Intelligence

| Tabel | Writer | Keterangan |
|---|---|---|
| `work_sdgs` | sdgs-mapper, apis | Hasil SDG classification granular |
| `ecosystem_cache` | semua | Generic K/V cache (gantikan sdg_cache) |
| `analytics_snapshots` | analytics, mapper | Hasil komputasi impact/trend |

### Layer 4 — Platform

| Tabel | Writer | Keterangan |
|---|---|---|
| `api_keys` | wizdam-apis | API key dengan hash sha256 |
| `api_rate_limits` | wizdam-apis | Rate limiting per user/window |
| `jobs` | semua | Antrian proses background |

---

## Catatan Migrasi dari Schema Lama

Jika sebelumnya menggunakan tabel lama, mapping ke schema baru:

| Tabel Lama | Tabel Baru | Kolom |
|---|---|---|
| `sdg_cache` | `ecosystem_cache` | `cache_key`, `payload`, `expires_at` |
| `orcid_profiles` | `researchers` | `profile_cache_json`, `cache_expires_at` |
| `doi_results` | `publications` | `raw_data_json` |
| `classified_works.sdgs_json` | `publications.sdg_cache_json` + `work_sdgs` | — |
| `platform_stats` | `analytics_snapshots` | `entity_type='global'` |
| `sdg_trends` | `analytics_snapshots` | `snapshot_type='sdg_distribution'` |

Tool AJAX untuk migrasi file cache → DB: `tools/cache-migrator.php`

---

## Generate API Key untuk sdgs-mapper

```bash
php tools/generate-api-key.php
```

Atau via browser: `https://www.sangia.org/tools/generate-api-key.php`

Key menggunakan formula:
```
wz_{userId}_{timestamp}_{HMAC-SHA256(userId:timestamp, SHARED_SECRET)[0..15]}
```

---

## Hak Akses DB per Aplikasi

```sql
-- sdgs-mapper (writer utama Layer 1 & 2)
CREATE USER 'wizdam_mapper'@'localhost' IDENTIFIED BY 'pass';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.institutions       TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.researchers        TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.journals           TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.publications       TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.publication_authors TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.work_sdgs          TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.ecosystem_cache    TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT         ON wizdam_ecosystem.api_keys           TO 'wizdam_mapper'@'localhost';
GRANT SELECT                 ON wizdam_ecosystem.analytics_snapshots TO 'wizdam_mapper'@'localhost';

-- wizdam-apis (gateway + infrastructure)
CREATE USER 'wizdam_apis'@'localhost' IDENTIFIED BY 'pass';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.api_keys        TO 'wizdam_apis'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.api_rate_limits TO 'wizdam_apis'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.jobs            TO 'wizdam_apis'@'localhost';
GRANT SELECT                         ON wizdam_ecosystem.researchers     TO 'wizdam_apis'@'localhost';
GRANT SELECT                         ON wizdam_ecosystem.publications    TO 'wizdam_apis'@'localhost';

-- wizdam-sikola (identity layer)
CREATE USER 'wizdam_sikola'@'localhost' IDENTIFIED BY 'pass';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.institutions TO 'wizdam_sikola'@'localhost';
GRANT SELECT, INSERT, UPDATE         ON wizdam_ecosystem.researchers  TO 'wizdam_sikola'@'localhost';

-- sdgs-analytics (reader + snapshots)
CREATE USER 'wizdam_analytics'@'localhost' IDENTIFIED BY 'pass';
GRANT SELECT                         ON wizdam_ecosystem.*                    TO 'wizdam_analytics'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.analytics_snapshots  TO 'wizdam_analytics'@'localhost';

FLUSH PRIVILEGES;
```

---

## Integrasi sdgs-mapper → wizdam-apis

sdgs-mapper memanggil endpoint berikut dan menyimpan hasilnya ke DB sendiri:

| Kebutuhan | Endpoint | Disimpan ke |
|---|---|---|
| Profil ORCID | `GET /api/v1/orcid/profile?orcid=...` | `researchers.profile_cache_json` |
| Klasifikasi SDG | `POST /api/v1/sdg/classify` | `work_sdgs` + `publications.sdg_cache_json` |
| Data sitasi DOI | `GET /api/v1/citation/doi?doi=...` | `publications.citation_count`, `citation_sources` |
| Impact score | `POST /api/v1/impact/calculate` | `analytics_snapshots` |
| Tren riset | `POST /api/v1/trend/analyze` | `analytics_snapshots` |

**Prinsip**: wizdam-apis **tidak menyimpan** hasil analisis — sdgs-mapper yang bertanggung jawab penuh untuk persistensi ke `wizdam_ecosystem`.
