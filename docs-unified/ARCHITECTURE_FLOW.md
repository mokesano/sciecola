# ARCHITECTURE FLOW: index.php → UI dengan Data Real

## 1. REQUEST FLOW (index.php → Bootstrap → UI)

```
Browser Request
    ↓
/public/index.php
    ↓
defines ROOT_PATH
    ↓
/includes/bootstrap.php
    ├─ Loads /includes/autoload.php (PSR-4)
    ├─ Loads /includes/config.php (Database config, env vars)
    ├─ Loads /includes/functions.php (Helper functions)
    ├─ is_api_request() ? 
    │   ├─ YES → Router ke /api/SDG_Classification_API.php
    │   │        (dengan handle_api_proxy_request)
    │   └─ NO  → Tampilkan /includes/sicolaUI.php
    │
    └─ /includes/sicolaUI.php
        └─ <div id="root"></div>
           + <script src="/assets/sicola-ui/sicola-app.js"></script>
           + React App (Vite build output)
```

## 2. DATA PERSISTENCE LAYER

### Database Tables (MariaDB/PostgreSQL)
```sql
1. sdg_cache              - Generic key-value cache (replaces gzip files)
2. orcid_profiles         - ORCID researcher profiles (JSON)
3. doi_results            - DOI article results (JSON)
4. classified_works       - Persisted SDG tags per article
5. platform_stats         - Platform-level statistics
6. sdg_trends             - Year + SDG → article count
```

### Cache Strategy
- **Primary**: Database (orcid_profiles, doi_results, sdg_cache)
- **TTL**: Configured in config.php (default 7 days)
- **Expiry Check**: Queries check expires_at field
- **Fallback**: File-based queue at /cache/crawl_queue.json

### Queue System (crawl_queue.php)
- **Type**: File-based JSON queue (fallback to DB when available)
- **Location**: /cache/crawl_queue.json
- **Jobs**: orcid, doi, journal, institution
- **Status**: pending, running, completed, failed
- **Endpoint**: 
  - `GET  /api/crawl_queue.php?action=status`
  - `POST /api/crawl_queue.php { action: "enqueue", type: "orcid", identifier: "..." }`
  - `POST /api/crawl_queue.php { action: "process", limit: 10 }`

## 3. REACT COMPONENTS DATA FLOW

### ✅ ALREADY USING REAL DATA

**Profile Pages:**
- ✅ ResearcherProfile.jsx
  - Fetches: `/api/researcher_profile.php?orcid={orcidCode}`
  - Source: ORCID API + Wizdam APIs + SDG Classification
  - Stored in: orcid_profiles table

- ✅ ArticleProfile.jsx
  - Fetches: `/api/article_profile.php?doi={doi}`
  - Source: SDG Classification API + Crossref
  - Stored in: doi_results table

- ✅ JournalProfile.jsx
  - Fetches: `/api/journal_profile.php?issn={issn}`
  - Source: Scopus API
  - Stored in: (sdg_cache for metrics)

### ⚠️ STILL USING MOCK DATA

**List Pages:**
1. **ArticleList.jsx**
   - Uses hardcoded `articlesDatabase` array
   - ~100+ articles with mock data
   - **Should fetch from**: `/api/articles?page=1&limit=20` (needs backend endpoint)

2. **ResearchersList.jsx**
   - Uses hardcoded `researchersDatabase` array
   - ~80+ researchers with mock data
   - **Should fetch from**: `/api/researchers?page=1&limit=20` (needs backend endpoint)

3. **JournalList.jsx**
   - Uses hardcoded `journalsDatabase` array
   - ~50+ journals with mock data
   - **Should fetch from**: `/api/journals?page=1&limit=20` (needs backend endpoint)

**Dashboard/Analytics Pages:**
4. **Admin.jsx**
   - Uses mock stats data
   - **Should fetch from**: `/api/admin/stats` (platform_stats table)

5. **Faq.jsx**
   - Uses mock FAQ data
   - No database needed (can use static JSON file)

### Components Status
- StatCards.jsx - Uses props (can display real or mock)
- TopSdgsCard.jsx - Uses props (can display real or mock)
- LatestArticles.jsx - Uses hardcoded data (needs API)
- InsightsAI.jsx - Uses mock insights (needs API)
- ResearchExplorer.jsx - Unknown (needs audit)

## 4. API ENDPOINTS IMPLEMENTED

### ✅ Implemented
- `GET /api/researcher_profile.php?orcid=XXXX-XXXX-XXXX-XXXX`
- `GET /api/article_profile.php?doi=10.xxxx/xxxxx`
- `GET /api/journal_profile.php?issn=XXXX-XXXX`
- `GET /api/SDG_Classification_API.php?orcid=... or ?doi=...`
- `GET /api/crawl_queue.php?action=status|list`
- `POST /api/crawl_queue.php { action: "enqueue"|"process" }`

### ❌ Need to be Implemented
- `GET /api/articles?page=1&limit=20&sort=...` (ArticleList data)
- `GET /api/researchers?page=1&limit=20&sort=...` (ResearchersList data)
- `GET /api/journals?page=1&limit=20&sort=...` (JournalList data)
- `GET /api/admin/stats` (Admin dashboard)
- `GET /api/platform/trends` (TrendsAnalysis data)
- `GET /api/leaderboard?type=researchers|articles|journals` (Leaderboard data)

## 5. WIZDAM-APIS INTEGRATION

### Expected from api.sangia.org
```
POST /api/v1/impact/calculate
{
  "orcid": "XXXX-XXXX-XXXX-XXXX",
  "identifiers": ["doi1", "doi2", ...]
}
```

**Returns:**
```json
{
  "h_index": 24,
  "citations": 652,
  "citation_trend": [...],
  "impact_score": 2.48,
  ...
}
```

### Current Integration
- researcher_profile.php calls Wizdam API for impact metrics
- Results cached in sdg_cache table
- TTL: 7 days (configurable)

## 6. DATA CACHING STRATEGY

### Flow for ORCID Profile
```
User visits /researcher/0000-0002-5152-9727
    ↓
ResearcherProfile.jsx calls:
  GET /api/researcher_profile.php?orcid=0000-0002-5152-9727
    ↓
researcher_profile.php:
  1. Check orcid_profiles table (SELECT WHERE orcid_id = X AND expires_at > NOW)
  2. If found AND not expired → Return cached JSON
  3. If NOT found OR expired:
     a. Call ORCID API (init + batch)
     b. Call Wizdam API for impact metrics
     c. Call SDG Classification API
     d. INSERT/UPDATE orcid_profiles table
     e. Return aggregated JSON
```

### Flow for DOI Article
```
User visits /article/doi/10.1234/...
    ↓
ArticleProfile.jsx calls:
  GET /api/article_profile.php?doi=10.1234/...
    ↓
article_profile.php:
  1. Check doi_results table (SELECT WHERE doi = X AND expires_at > NOW)
  2. If found AND not expired → Return cached JSON
  3. If NOT found OR expired:
     a. Call SDG Classification API (with Crossref data)
     b. Extract ISSN from Crossref response
     c. Call Scopus API via journal-checker.php
     d. INSERT/UPDATE doi_results table
     e. Return aggregated JSON
```

## 7. QUEUE SYSTEM FOR BATCH PROCESSING

When user searches or bulk-loads data:

```
Frontend sends:
  POST /api/crawl_queue.php
  {
    "action": "enqueue",
    "type": "orcid",
    "identifier": "0000-0002-5152-9727",
    "priority": 5
  }

Backend:
  1. Checks for duplicates in /cache/crawl_queue.json
  2. Creates job with status: "pending"
  3. Returns job_id

Cron or manual trigger:
  POST /api/crawl_queue.php
  {
    "action": "process",
    "limit": 10
  }

Processing:
  1. Reads next 10 pending jobs
  2. Changes status to "running"
  3. Executes fetch (ORCID, Crossref, Scopus, Wizdam)
  4. Stores results in database
  5. Changes status to "completed" or "failed"
  6. Logs errors for failed jobs
```

## 8. SUMMARY: WHAT'S REAL vs MOCK

| Component | Data Source | Status |
|-----------|-------------|--------|
| ResearcherProfile | ORCID + Wizdam | ✅ REAL |
| ArticleProfile | Crossref + Scopus | ✅ REAL |
| JournalProfile | Scopus API | ✅ REAL |
| ResearchersList | articlesDatabase | ⚠️ MOCK |
| ArticleList | articlesDatabase | ⚠️ MOCK |
| JournalList | journalsDatabase | ⚠️ MOCK |
| Admin Dashboard | Mock stats | ⚠️ MOCK |
| Trends/Analytics | Mock data | ⚠️ MOCK |
| Leaderboard | Mock data | ⚠️ MOCK |

## 9. NEXT STEPS TO ELIMINATE MOCK DATA

1. **Create List Endpoints** (/api/articles, /api/researchers, /api/journals)
   - Read from classified_works + platform stats tables
   - Support pagination, sorting, filtering
   - Cache results in sdg_cache table

2. **Create Dashboard Endpoints** (/api/admin/stats)
   - Read from platform_stats table
   - Return aggregated metrics

3. **Create Trends Endpoint** (/api/platform/trends)
   - Read from sdg_trends table
   - Return year-over-year data

4. **Update React Components**
   - Replace hardcoded database arrays with API calls
   - Use useEffect + useState pattern (like ProfilePages)
   - Add loading/error states

5. **Populate Database**
   - Run batch crawling for seed data (top researchers, journals)
   - Use crawl_queue.php to enqueue bulk jobs
   - Let scheduler process jobs and populate tables

## 10. ENVIRONMENT & CONFIG

**Key Config Variables** (in /includes/config.php):
```php
define('ENVIRONMENT', 'production|development');
define('DB_HOST', getenv('DB_HOST'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
define('WIZDAM_API_KEY', getenv('WIZDAM_API_KEY'));
define('CACHE_TTL', 604800);  // 7 days
```

**Database Initialization:**
```bash
# MariaDB
mysql -u root -p sicola_db < db/schema.sql

# PostgreSQL
psql -U sicola -d sicola_db -f db/schema.sql
```

---

**Last Updated**: 2026-05-10
**Architecture**: Opsi A (React Frontend + PHP Backend with Data Caching & Queue System)
