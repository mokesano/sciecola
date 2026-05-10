# Database Schema

## Supported drivers
- **MySQL / MariaDB** (`DB_DRIVER=mysql`) — recommended, tested on MariaDB 10.5+
- **PostgreSQL** (`DB_DRIVER=pgsql`) — supported via PDO; `upsert()` uses `ON CONFLICT DO UPDATE`

---

## Tables

### `sdg_cache`
Generic key-value cache replacing the old gzip file-cache.

```sql
CREATE TABLE IF NOT EXISTS sdg_cache (
    cache_key   VARCHAR(255)    NOT NULL,
    payload     LONGTEXT        NOT NULL,
    expires_at  DATETIME        NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cache_key),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `orcid_profiles`
Cached ORCID researcher profiles.

```sql
CREATE TABLE IF NOT EXISTS orcid_profiles (
    orcid_id     VARCHAR(20)     NOT NULL,
    profile_json LONGTEXT        NOT NULL,
    expires_at   DATETIME        NOT NULL,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (orcid_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `doi_results`
Cached CrossRef / OpenAlex article metadata.

```sql
CREATE TABLE IF NOT EXISTS doi_results (
    doi          VARCHAR(512)    NOT NULL,
    result_json  LONGTEXT        NOT NULL,
    expires_at   DATETIME        NOT NULL,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (doi),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `api_cache`
Legacy cache table populated by `cache_to_db.php` migration endpoint.

```sql
CREATE TABLE IF NOT EXISTS api_cache (
    cache_key     VARCHAR(255)   NOT NULL,
    response_body LONGTEXT       NOT NULL,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME       NOT NULL,
    PRIMARY KEY (cache_key),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## PostgreSQL equivalents

Replace `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` with nothing (PgSQL default), and use `TIMESTAMP` instead of `DATETIME`:

```sql
CREATE TABLE IF NOT EXISTS sdg_cache (
    cache_key   VARCHAR(255)    NOT NULL PRIMARY KEY,
    payload     TEXT            NOT NULL,
    expires_at  TIMESTAMP       NOT NULL,
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sdg_cache_expires ON sdg_cache (expires_at);
```

Apply the same pattern to the other tables.

---

## Maintenance

**Flush expired cache entries:**
```
GET /api/cache_to_db.php?action=clear_cache
```

**Or directly:**
```sql
DELETE FROM sdg_cache     WHERE expires_at < NOW();
DELETE FROM orcid_profiles WHERE expires_at < NOW();
DELETE FROM doi_results   WHERE expires_at < NOW();
DELETE FROM api_cache     WHERE expires_at < NOW();
```

**Check cache hit ratio:**
```sql
SELECT
    COUNT(*) AS total,
    SUM(expires_at > NOW()) AS live,
    SUM(expires_at <= NOW()) AS expired
FROM sdg_cache;
```

---

## Migration files

SQL migration scripts (if any) are stored in `db/`. Run them in order against the target database.
