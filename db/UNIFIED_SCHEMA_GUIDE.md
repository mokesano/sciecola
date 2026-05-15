# Wizdam Ecosystem — Unified Database Guide

Panduan ini berlaku untuk semua repository Wizdam:

| Repository | Domain | Fungsi |
|---|---|---|
| `sdgs-mapper` | sangia.org | SDG classification & researcher mapping |
| `SDGs-analytics` | sangia.org | Analytics, trends, dashboard |
| `wizdam-apis` | sangia.org | API gateway & key management |
| `wizdam-sikola` | stipwunaraha.ac.id | Core academic platform (OJS-based) |

Semua aplikasi menggunakan **satu database terpusat** di server yang sama.

---

## Setup Database (Jalankan Sekali di Server)

```bash
# 1. Buat database & user
mysql -u root -p <<SQL
CREATE DATABASE IF NOT EXISTS wizdam_ecosystem
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'wizdam_app'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_INI';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON wizdam_ecosystem.*
  TO 'wizdam_app'@'localhost';

FLUSH PRIVILEGES;
SQL

# 2. Jalankan schema
mysql -u root -p wizdam_ecosystem < db/schema.sql

# Selesai. Tidak perlu migration — aplikasi belum ada data.
```

---

## Konfigurasi `.env` (Sama untuk Semua Repo)

Salin nilai DB berikut ke file `.env` di masing-masing repository:

```env
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wizdam_ecosystem
DB_USER=wizdam_app
DB_PASS=GANTI_PASSWORD_INI
DB_CHARSET=utf8mb4
```

> **Catatan**: Karena semua aplikasi berada di server yang sama, gunakan `DB_HOST=localhost`.  
> Domain `sangia.org` dan `stipwunaraha.ac.id` keduanya mengarah ke server yang sama.

---

## Struktur Tabel

### Layer 1 — Identity (Pengguna & Institusi)

| Tabel | Dipakai oleh | Keterangan |
|---|---|---|
| `institutions` | sikola, mapper | Data institusi/universitas |
| `users` | semua | Akun login terpusat |
| `user_sessions` | semua | Token sesi (gantikan file session) |
| `user_2fa` | sikola, apis | Two-factor authentication |

### Layer 2 — Knowledge (Peneliti & Publikasi)

| Tabel | Dipakai oleh | Keterangan |
|---|---|---|
| `researchers` | mapper, sikola | Profil peneliti dari ORCID |
| `publications` | semua | Artikel & karya ilmiah |
| `publication_authors` | mapper, analytics | Relasi publikasi ↔ peneliti |

### Layer 3 — Intelligence (SDG Mapping)

| Tabel | Dipakai oleh | Keterangan |
|---|---|---|
| `work_sdgs` | mapper, analytics | Hasil mapping SDG per publikasi (granular) |
| `citations` | analytics, mapper | Jejak sitasi antar publikasi |

### Layer 4 — Platform Cache (Operasional)

> Tabel ini dipertahankan untuk backward compatibility dan performa.
> Kode lama yang menggunakan tabel ini tidak perlu diubah.

| Tabel | Keterangan |
|---|---|
| `sdg_cache` | Generic key-value cache |
| `orcid_profiles` | Cache profil ORCID (TTL-based) |
| `doi_results` | Cache hasil klasifikasi DOI |
| `classified_works` | Hasil SDG classification tersimpan |
| `platform_stats` | Statistik platform (total artikel, dll) |
| `sdg_trends` | Snapshot tren SDG per tahun |

### Layer 5 — Infrastructure

| Tabel | Dipakai oleh | Keterangan |
|---|---|---|
| `api_keys` | apis | API key eksternal |
| `jobs` | semua | Antrian proses background |

---

## Cara Menghubungkan Repo Lain ke Database Ini

### PHP (PDO — semua repo kecuali OJS)

```php
// Pastikan .env sudah diisi, lalu:
$pdo = new PDO(
    "mysql:host=localhost;dbname=wizdam_ecosystem;charset=utf8mb4",
    'wizdam_app',
    'GANTI_PASSWORD_INI',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
```

Atau gunakan class `Sciecola\Database\Connection` dari repo `sdgs-mapper`
(copy `src/Database/Connection.php` ke repo lain, sesuaikan namespace).

### OJS/wizdam-sikola (Framework OJS)

Di OJS, konfigurasi database ada di `config.inc.php`:

```ini
[database]
driver   = mysqli
host     = localhost
username = wizdam_app
password = GANTI_PASSWORD_INI
name     = wizdam_ecosystem
```

> **Penting**: OJS akan membuat tabelnya sendiri (prefix `wizdam_sikola_*`).
> Tabel unified di atas hidup berdampingan — tidak konflik karena nama berbeda.

### Python/SDGs-analytics (jika ada script Python)

```python
import mysql.connector

conn = mysql.connector.connect(
    host     = "localhost",
    database = "wizdam_ecosystem",
    user     = "wizdam_app",
    password = "GANTI_PASSWORD_INI",
    charset  = "utf8mb4"
)
```

---

## Migrasi Cache File → Database (sdgs-mapper saja)

Jika aplikasi sdgs-mapper sebelumnya menyimpan cache sebagai file JSON
di folder `/cache/`, gunakan tool bawaan:

```
https://yourdomain.com/tools/cache-migrator.php
```

Tool ini memindahkan file cache ke tabel `orcid_profiles`, `doi_results`,
dan `user_sessions` secara bertahap (50 file per request) tanpa timeout.

---

## Hak Akses per Repo (Prinsip Least Privilege)

Untuk keamanan tambahan, buat user terpisah per aplikasi:

```sql
-- sdgs-mapper & SDGs-analytics: hanya baca/tulis tabel tertentu
CREATE USER 'wizdam_mapper'@'localhost' IDENTIFIED BY 'pass1';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.orcid_profiles  TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.doi_results      TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.classified_works TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.work_sdgs        TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.researchers      TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.publications     TO 'wizdam_mapper'@'localhost';
GRANT SELECT, UPDATE         ON wizdam_ecosystem.platform_stats   TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.sdg_trends       TO 'wizdam_mapper'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.sdg_cache        TO 'wizdam_mapper'@'localhost';

-- wizdam-apis: akses api_keys + jobs
CREATE USER 'wizdam_apis'@'localhost' IDENTIFIED BY 'pass2';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.api_keys TO 'wizdam_apis'@'localhost';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.jobs     TO 'wizdam_apis'@'localhost';
GRANT SELECT                 ON wizdam_ecosystem.users    TO 'wizdam_apis'@'localhost';

-- wizdam-sikola: akses penuh identity layer
CREATE USER 'wizdam_sikola'@'localhost' IDENTIFIED BY 'pass3';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.institutions  TO 'wizdam_sikola'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.users         TO 'wizdam_sikola'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.user_sessions TO 'wizdam_sikola'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON wizdam_ecosystem.user_2fa      TO 'wizdam_sikola'@'localhost';
GRANT SELECT, INSERT, UPDATE         ON wizdam_ecosystem.researchers   TO 'wizdam_sikola'@'localhost';

FLUSH PRIVILEGES;
```

---

## File Schema

- `db/schema.sql` — schema lengkap, jalankan sekali saat setup
- `tools/cache-migrator.php` — tool AJAX migrasi cache file → DB (sdgs-mapper)
