# 🔴 AUDIT: SKEMA DATABASE vs KODE BACKEND

**Status:** ❌ INKONSISTENSI KRITIS DITEMUKAN

**Tanggal Audit:** 2026-05-15

---

## RINGKASAN EKSEKUTIF

Schema database di `db/schema.sql` **TIDAK SEPENUHNYA SESUAI** dengan kode backend di folder `api/`. Ada **6 file** yang masih menggunakan tabel dan kolom lama yang tidak ada di schema baru.

| Metrik | Status |
|--------|--------|
| Struktur Schema | ✅ OK (11 tabel) |
| Kode Backend Baru | ✅ OK (src/Cache/DbCacheService.php) |
| Kode Backend Lama | ❌ BROKEN (6 file) |
| Consistency | ❌ NO |

---

## FILE-FILE YANG PERLU DIPERBAHARUI

### 🔴 CRITICAL PRIORITY

#### 1. `api/DbCacheService.php`
**Status:** Legacy file - Duplikasi dengan src version
- Line 27: `SELECT ... FROM sdg_cache` ❌
- Line 51, 55: `DELETE FROM sdg_cache` ❌
- Line 64: `SELECT ... FROM orcid_profiles` ❌ (kolom: orcid_id, profile_json, expires_at)
- Line 87: `SELECT ... FROM doi_results` ❌ (kolom: result_json)

**Action:** HAPUS (duplikasi) atau UPDATE ke schema baru

#### 2. `api/wrapper/leaderboard.php`
**Status:** Menggunakan tabel lama
- Line 50: `SELECT orcid_id, profile_json FROM orcid_profiles WHERE expires_at > NOW()`
- **Perubahan:**
  - `orcid_profiles` → `researchers`
  - `orcid_id` → `orcid`
  - `profile_json` → `profile_cache_json`
  - `expires_at` → `cache_expires_at`

#### 3. `api/wrapper/cache_handler.php`
**Status:** Menggunakan tabel lama
- Line 124: `SELECT profile_json FROM orcid_profiles` ❌
- Line 131: `SELECT result_json FROM doi_results` ❌
- **Perubahan sama dengan leaderboard.php**

#### 4. `api/wrapper/platform_stats.php`
**Status:** Menggunakan 5 tabel lama
- Line 44: `classified_works` → `publications`
- Line 45: `orcid_profiles` → `researchers`
- Line 46: `sdg_cache` → `ecosystem_cache`
- Line 47: `sdg_trends` → ??? (TIDAK JELAS)
- Line 48: `doi_results` → `publications`

#### 5. `api/wrapper/analytics.php`
**Status:** Menggunakan tabel lama
- Line 44: `classified_works` → `publications`
- Line 45: `orcid_profiles` → `researchers`

#### 6. `api/cache_to_db.php`
**Status:** Menggunakan tabel `api_cache` yang tidak ada di schema
- Line 96-98: `INSERT INTO api_cache` ❌
- **Action:** Tentukan strategy - pindah ke `ecosystem_cache`? Atau hapus?

---

## PEMETAAN TABEL LAMA → TABEL BARU

| Tabel Lama | Tabel Baru | Status | Kolom |
|-----------|-----------|--------|--------|
| `orcid_profiles` | `researchers` | ✅ Jelas | orcid_id→orcid, profile_json→profile_cache_json, expires_at→cache_expires_at |
| `doi_results` | `publications` | ✅ Jelas | result_json→raw_data_json |
| `sdg_cache` | `ecosystem_cache` | ✅ Jelas | cache_key, payload, expires_at |
| `classified_works` | `publications` | ⚠️ Unclear | Mapping perlu dikonfirmasi |
| `sdg_trends` | analytics_snapshots? work_sdgs? | ❌ TBD | Perlu ditentukan |
| `api_cache` | ??? | ❌ TBD | Tidak ada di schema |
| `platform_stats` | analytics_snapshots? | ❌ TBD | Tidak ada di schema |

---

## FILE YANG SUDAH BENAR ✅

### `src/Cache/DbCacheService.php`
- ✅ Menggunakan tabel baru: `ecosystem_cache`, `researchers`, `publications`
- ✅ Kolom benar: `profile_cache_json`, `cache_expires_at`, `raw_data_json`, `sdg_cache_json`
- ✅ Tidak perlu diubah

### `api/wrapper/researcher_profile.php`
- ✅ Menggunakan `src/Cache/DbCacheService.php` (yang benar)
- ✅ Tidak perlu diubah

---

## PERUBAHAN YANG DIPERLUKAN

### Priority 1 - CRITICAL

**Tabel orcid_profiles → researchers:**
```php
// LAMA
"SELECT orcid_id, profile_json FROM orcid_profiles WHERE expires_at > NOW()"

// BARU
"SELECT orcid, profile_cache_json FROM researchers WHERE cache_expires_at > NOW()"
```

**Tabel doi_results → publications:**
```php
// LAMA
"SELECT result_json FROM doi_results WHERE doi = ?"

// BARU
"SELECT raw_data_json FROM publications WHERE doi = ?"
```

**Tabel sdg_cache → ecosystem_cache:**
```php
// LAMA
"SELECT payload FROM sdg_cache WHERE cache_key = ?"

// BARU
"SELECT payload FROM ecosystem_cache WHERE cache_key = ?"
```

### Priority 2 - STRATEGY DECISION

**Tentukan mapping untuk:**

1. **classified_works** → publications?
   - Apakah tabel ini sama fungsinya dengan publications?
   - Atau perlu tabel terpisah?

2. **sdg_trends** → analytics_snapshots atau work_sdgs?
   - Keduanya bisa menyimpan trend SDG data
   - Perlu dikonfirmasi mana yang tepat

3. **api_cache** → ecosystem_cache atau dihapus?
   - Apakah cache ini perlu di-migrate?
   - Atau bisa dihapus karena sudah ada ecosystem_cache?

4. **platform_stats** → analytics_snapshots?
   - Tabel ini bisa di-drop dan data diambil dari analytics_snapshots

---

## REKOMENDASI NEXT STEPS

### IMMEDIATE (PERLU DILAKUKAN SEKARANG)

1. **Tentukan Strategy:**
   - Clarify mapping untuk classified_works, sdg_trends, api_cache, platform_stats
   - Dokumentasikan keputusan di UNIFIED_SCHEMA_GUIDE.md

2. **Update Files:**
   - `api/wrapper/leaderboard.php` - Update kolom dan tabel
   - `api/wrapper/cache_handler.php` - Update kolom dan tabel
   - `api/wrapper/platform_stats.php` - Update kolom dan tabel + tentukan sdg_trends mapping
   - `api/wrapper/analytics.php` - Update kolom dan tabel
   - `api/cache_to_db.php` - Update atau hapus
   - `api/DbCacheService.php` - Hapus (duplikasi) atau update

### VERIFICATION

1. Jalankan semua API endpoints untuk test
2. Verifikasi bahwa data dapat dibaca dari tabel baru dengan benar
3. Cek jika ada data di tabel lama yang perlu di-migrate

---

## DETAIL PERUBAHAN PER FILE

### api/wrapper/leaderboard.php

**Current (Line 50):**
```php
$stmt = $pdo->prepare(
    "SELECT orcid_id, profile_json FROM orcid_profiles WHERE expires_at > NOW() ORDER BY updated_at DESC LIMIT ?"
);
```

**Required:**
```php
$stmt = $pdo->prepare(
    "SELECT orcid, profile_cache_json FROM researchers WHERE cache_expires_at > NOW() ORDER BY updated_at DESC LIMIT ?"
);
```

**Also change:**
- `$row['orcid_id']` → `$row['orcid']`
- `$row['profile_json']` → `$row['profile_cache_json']`

### api/wrapper/cache_handler.php

**Current (Line 124):**
```php
"SELECT profile_json FROM orcid_profiles WHERE orcid_id = ? AND expires_at > NOW()"
```

**Required:**
```php
"SELECT profile_cache_json FROM researchers WHERE orcid = ? AND cache_expires_at > NOW()"
```

**Current (Line 131):**
```php
"SELECT result_json FROM doi_results WHERE doi = ? AND expires_at > NOW()"
```

**Required:**
```php
"SELECT raw_data_json FROM publications WHERE doi = ? AND updated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)"
```

### api/wrapper/platform_stats.php

Multiple changes needed for lines 44-48. Lihat detail di audit file.

---

## KESIMPULAN

Schema database sudah dirancang dengan baik, tetapi **ada gap besar antara schema dan implementasi kode backend**.

**Status Final:**
- ❌ Schema vs Code: NOT IN SYNC
- ✅ Schema Structure: CORRECT
- ❌ Backend Implementation: PARTIALLY WRONG

**Action Required:** Update 6 file backend untuk fully comply dengan schema baru.

---

**Audit Dilakukan:** 2026-05-15
**Severity:** CRITICAL
**ETA Fix:** 1-2 hari kerja
