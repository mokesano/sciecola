# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview
**Sciecola / SDGs Mapper**: AI-powered research analytics platform that classifies ORCID researcher profiles and DOI articles by UN Sustainable Development Goals (SDGs 1–17). React 18 + Vite 5 frontend; PHP 8.0+ backend with PDO (MariaDB/PostgreSQL).

## Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS, HashRouter v6, Recharts, react-leaflet, react-i18next, react-hot-toast
- **Backend**: PHP 8.0+, PDO, PSR-4 namespaced classes in `src/Sciecola\*`
- **Config**: `.env` file with built-in parser (no Composer required); env vars override defaults
- **External APIs**: ORCID (profiles), CrossRef (DOI), OpenAlex, Wizdam/Sangia (SDG classification)

## Key commands

**Frontend**
```bash
cd frontend-src
npm install
npm run dev        # dev server on http://localhost:5173
npm run build      # build to ../public/assets/sicola-ui/
npm run lint       # eslint check (if configured)
```

**Backend** (quick test)
```bash
php -S localhost:8000 -t public  # Built-in server; routes to /index.php
```

**Environment**
```bash
cp .env.example .env
# Edit: DB_HOST, DB_NAME, DB_USER, DB_PASS, WIZDAM_API_KEY, SMTP_* (if needed)
# No Composer required — config/config.php parses .env directly
```

## Architecture

### Frontend (React + Vite)
**Entry**: `frontend-src/src/main.jsx` → `frontend-src/src/App.jsx`

**Router**: HashRouter in App.jsx (all navigation is `/#/route` to avoid server rewrite rules).

**Key pages** (`frontend-src/src/pages/`):
- `HomePage.jsx` — SDG dashboard, charts, mock data, hero, CTA, chatbot
- `ResearcherProfile.jsx` → `/orcid/:orcid` — 5 tabs (ringkasan, publikasi, kolaborasi, dampak, tentang)
- `ArticleProfile.jsx` → `/doi/:doi` — 5 tabs (ringkasan, sitasi, metrik, versi, terkait)
- `JournalProfile.jsx` → `/journals/:slug` — 6 tabs (ringkasan, artikel, statistik, sdgs, editorial, indeksasi)
- `InsightsPage.jsx` → `/insights` — AI-generated SDG insights with filter bar
- Plus: ResearcherDistribution, ArticleList, JournalList, Analytics, Trends, etc.

**Components** (`frontend-src/src/components/`):
- `layout/` — Navbar, Footer, Hero (with nav buttons), CallToAction, Chatbot
- `sdg/` — Charts (SdgDistribution, SdgTrend, PieChart), TopSdgsCard, LatestArticles, InsightsAI
- `shared/` — PageHeader, ScrollToTop (on all route changes), LoadingSpinner, ErrorBoundary
- All "Lihat Semuanya" buttons → real pages (no dead links)

**State & Data**:
- Mock databases in each page (articlesDatabase, researchersDatabase, etc.) — 100+ objects with realistic fields
- Component-level useState/useEffect (no Redux; localStorage for optional persistence)
- SVG fallback images: `/assets/img/{researcher,article,journal,institution}-default.svg`

**i18n**: react-i18next with Indonesian (id) and English (en) locale files in `frontend-src/src/i18n/`

### Backend (PHP + PSR-4)
**Entry**: `public/index.php` → `includes/bootstrap.php` → routes to either API or frontend HTML.

**Config loading** (`config/config.php`):
1. Parses `.env` file (built-in parser; no Composer dotenv)
2. Calls putenv() + $_ENV for each key
3. Defines typed PHP constants (ENVIRONMENT, DB_HOST, SMTP_PORT as int, etc.)
4. Self-defines ROOT_PATH if absent (no guard)

**PSR-4 Autoloading** (`includes/autoload.php`):
- `spl_autoload_register` maps `Sciecola\Foo\Bar` → `src/Foo/Bar.php`
- Defers to `vendor/autoload.php` if Composer is installed
- Wired into `includes/bootstrap.php` (step 3)

**PSR-4 Classes** (`src/Sciecola\*` — all PSR-12 strict_types=1):
- `Database\Connection` — PDO singleton, mysql + pgsql support, `query()`, `fetchOne()`, `fetchAll()`, `insert()`, `upsert()`
- `Cache\DbCacheService` — DB-backed cache (replaces old gzip files), `get()`, `set()`, `getOrcidProfile()`, `getDoiResult()`
- `Mail\MailService` — email dispatcher, drivers: log/smtp/mail, `sendWelcome()`, `sendPasswordReset()`, `renderTemplate()`
- `Auth\TwoFactorAuth` — TOTP (RFC 6238), no external deps, `generateSecret()`, `verifyCode()`, `generateEmailOtp()`

**API Endpoints** (`api/`):
- `/api/insights.php` — returns 12 SDG insight JSON objects (mock)
- `/api/cache_to_db.php?action=status|migrate|clear_cache` — cache migration
- `/api/crawl_queue.php?action=status|enqueue|process|list` — file-based queue (JSON in storage/)
- `/api/ORCID/` — ORCID profile fetching, cached via DbCacheService
- `/api/proxy.php` — reverse proxy to Wizdam API (injects WIZDAM_API_KEY server-side)
- `/api/sdgs_v1.0.0/`, `/api/sdgs_v1.1.0/` — SDG classification endpoints

**Email Templates** (`templates/email/*.html`):
- Use `{{key}}` placeholders (replaced by MailService::renderTemplate)
- Files: welcome.html, reset-password.html, verify-email.html, notification.html, etc.

**Database Tables** (via DbCacheService):
- `sdg_cache` — generic cache (cache_key, payload, expires_at, updated_at)
- `orcid_profiles` — ORCID profiles (orcid_id, profile_json, expires_at)
- `doi_results` — CrossRef/OpenAlex results (doi, result_json, expires_at)
- `api_cache` — legacy migrated cache (cache_key, response_body, expires_at)

## Critical implementation notes

**Environment precedence** (important for production):
- `getenv()` reads: (1) real server env vars, (2) putenv() calls from .env parse
- **Issue**: If .env exists locally, it will override production env vars. Fix: Check `getenv($key) === false` before parsing .env to skip already-set vars.

**SMTP_AUTH logic**:
- Only true when `SMTP_USER !== ''` (prevents blank credential SMTP errors)
- Set in `config/config.php`: `define('SMTP_AUTH', (SMTP_USER !== ''))`

**Frontend scroll on route change**:
- ScrollToTop component on all HashRouter navigation (placed in App.jsx after Router)
- Scroll to top: `window.scrollTo({ top: 0, behavior: 'instant' })`

**Legacy PHP files**:
- Old `pages/*.php` and `components/*.php` renamed to `*_BAK.php` — no longer active, safe to ignore

**React Router (HashRouter)**:
- All routes hash-based (`/#/route`) — avoids Apache rewrite rules
- All profile links use encoded DOI/ORCID: `<Link to={/doi/${encodeURIComponent(doi)}}>`

**SVG fallbacks**:
- All img tags: `onError={(e) => { e.target.src = '/assets/img/...default.svg'; }}`
- Icons for SDGs: `/assets/sdgs/icons/sdg-X.svg`

## Important gotchas
- `config/config.php` parses `.env` inline — no file exists guard needed, but check for race conditions in multi-threaded production
- `.env` is in `.gitignore`; only `.env.example` is committed
- Email templates call `renderTemplate()` which does `str_replace()` — vulnerable to user input in placeholder values (always htmlspecialchars)
- Recharts PieChart needs responsive container for mobile rendering
- React i18n keys must exist in both locale files or fallback occurs
- HashRouter paths don't include leading slash: `navigate('/orcid/...')` works fine — HashRouter handles it
- Mock databases are static — no real DB calls for demo pages
- ArticleProfile and ResearcherProfile use mock data for demo; replace with real API calls when backend is ready
