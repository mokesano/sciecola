# API Reference

All endpoints live under `/api/`. Responses are JSON unless noted.

## `GET /api/insights.php`

Returns AI-generated SDG insights for the dashboard.

**Response:**
```json
{
  "status": "ok",
  "data": [
    {
      "id": 1,
      "type": "trend",
      "sdg": 4,
      "title": "Lonjakan penelitian SDG 4",
      "description": "...",
      "value": "+23%",
      "trend": "up",
      "color": "#C5192D"
    }
  ]
}
```

**Types**: `trend` | `comparison` | `recommendation` | `warning`

---

## `GET|POST /api/proxy.php`

Reverse proxy to the Wizdam/Sangia SDG classification API. Injects `WIZDAM_API_KEY` server-side.

**Query params**: forwarded as-is to `https://api.sangia.org`

**Auth**: None (key injected server-side from `WIZDAM_API_KEY` env var)

---

## `GET /api/cache_to_db.php`

Manages migration of legacy gzip file-cache to the database.

| `action` | Description |
|---|---|
| `status` | Returns count of file-cache entries and DB cache entries |
| `migrate` | Migrates all `.gz` / `.json` cache files to `api_cache` table |
| `clear_cache` | Deletes expired rows from `sdg_cache` table |

**Example:**
```
GET /api/cache_to_db.php?action=status
```
```json
{"status":"ok","file_cache_count":42,"db_cache_count":100}
```

---

## `GET /api/crawl_queue.php`

File-based crawling queue stored as JSON in `storage/queue/`.

| `action` | Params | Description |
|---|---|---|
| `status` | — | Queue depth and last-run timestamp |
| `enqueue` | `type`, `id` | Add an item to the queue |
| `process` | — | Process next N items via internal cURL |
| `list` | — | List all queued items |

**Example:**
```
GET /api/crawl_queue.php?action=enqueue&type=orcid&id=0000-0002-1234-5678
```

---

## `GET /api/ORCID/`

ORCID profile fetching endpoints. Wraps `https://pub.orcid.org/v3.0`.

Files in `api/ORCID/` directory — check individual files for endpoint details.
Results are cached in the `orcid_profiles` table via `DbCacheService`.

---

## `GET /api/sdgs_v1.0.0/` and `GET /api/sdgs_v1.1.0/`

SDG classification endpoints. Accept article title/abstract, return SDG scores.

See `api/SDG_Classification_API.php` for request/response schema.

---

## `GET /api/scopus/`

Scopus integration endpoints. See files in `api/scopus/`.

---

## Common response envelope

```json
{
  "status": "ok" | "error",
  "message": "...",
  "data": { ... }
}
```

Error responses use HTTP status codes (400, 404, 500) alongside the JSON envelope.

---

## CORS

All `api/*.php` endpoints send:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
