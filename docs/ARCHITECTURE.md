# Architecture Overview

## High-level diagram

```
Browser
  │
  ├─► React SPA (HashRouter)          frontend-src/src/
  │     └─► fetch() / axios            ↓
  │                                    api/*.php  (PHP 8.0+)
  │                                      │
  │                              ┌───────┼────────────┐
  │                              ▼       ▼            ▼
  │                          ORCID    CrossRef    OpenAlex
  │                          API      API         API
  │                              └───────┬────────────┘
  │                                      ▼
  │                              DbCacheService
  │                              (MariaDB / PgSQL)
  │
  └─► /api/*.php  (direct AJAX)
```

## Frontend architecture

**Entry**: `frontend-src/index.html` → `frontend-src/src/main.jsx`

**Router**: `HashRouter` in `App.jsx`. All navigation is hash-based (`/#/route`), which avoids Apache rewrite rules.

**Key pages** (`frontend-src/src/pages/`):

| Page | Route | Purpose |
|---|---|---|
| `HomePage` | `/` | SDG dashboard: charts, stats, chatbot |
| `ResearcherProfile` | `/orcid/:orcid` | 5-tab researcher view |
| `ArticleProfile` | `/doi/:doi` | 5-tab article view |
| `JournalProfile` | `/journals/:slug` | 6-tab journal view |
| `InsightsPage` | `/insights` | AI-generated SDG insights |

**Shared components** (`frontend-src/src/components/`):
- `layout/` — Navbar, Footer, Hero, CallToAction, Chatbot
- `sdg/` — Charts, TopSdgsCard, LatestArticles, InsightsAI
- `shared/` — PageHeader, ScrollToTop, LoadingSpinner, ErrorBoundary

**i18n**: `react-i18next` with Indonesian (ID) and English (EN) locales in `frontend-src/src/i18n/`.

**State**: Component-level `useState`/`useEffect`. No global state manager.

## Backend architecture

**Entry points**: Each file in `api/` is a standalone endpoint callable via HTTP.

**Config loading** (`config/config.php`):
1. Parses `.env` file (built-in, no Composer)
2. Calls `putenv()` + `$_ENV` for each key
3. Defines typed PHP constants (DB_HOST, SMTP_PORT as int, etc.)

**PSR-4 classes** (`src/`):
- `Sciecola\Database\Connection` — PDO singleton, supports mysql + pgsql
- `Sciecola\Cache\DbCacheService` — DB-backed key-value + ORCID + DOI cache
- `Sciecola\Mail\MailService` — Email dispatcher (log / smtp / mail() drivers)
- `Sciecola\Auth\TwoFactorAuth` — TOTP (RFC 6238) + email OTP, no external deps

**Autoloading** (`includes/autoload.php`): `spl_autoload_register` maps `Sciecola\Foo\Bar` → `src/Foo/Bar.php`. No Composer required, though `composer.json` is included for future use.

**Legacy classes** (`api/`): Still used directly. PSR-4 classes in `src/` are additive.

## Data flow — ORCID profile fetch

```
1. React: fetch('/api/ORCID/profile.php?orcid=0000-...')
2. PHP:   check DbCacheService::getOrcidProfile(orcid)
3a. HIT:  return cached JSON
3b. MISS: fetch https://pub.orcid.org/v3.0/{orcid}/record
          → parse → DbCacheService::saveOrcidProfile()
          → return JSON
4. React: render ResearcherProfile tabs
```

## Database tables

| Table | Purpose | Key columns |
|---|---|---|
| `sdg_cache` | Generic API response cache | `cache_key`, `payload`, `expires_at` |
| `orcid_profiles` | ORCID researcher profiles | `orcid_id`, `profile_json`, `expires_at` |
| `doi_results` | CrossRef/OpenAlex results | `doi`, `result_json`, `expires_at` |
| `api_cache` | Legacy gzip cache migrated via cache_to_db.php | `cache_key`, `response_body`, `expires_at` |

## External services

| Service | URL | Purpose |
|---|---|---|
| ORCID Public API | `https://pub.orcid.org/v3.0` | Researcher profiles |
| CrossRef | `https://api.crossref.org/works` | DOI metadata |
| OpenAlex | `https://api.openalex.org/works` | Open access metadata |
| Wizdam/Sangia API | `https://api.sangia.org` | SDG classification ML model |

## Security boundaries
- `api/proxy.php` injects `WIZDAM_API_KEY` server-side — the key is never sent to the browser.
- SMTP credentials only used when `SMTP_AUTH=true` (i.e., when `SMTP_USER` is non-empty).
- `.env` is in `.gitignore`; only `.env.example` is committed.
