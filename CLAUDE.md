# Sciecola / SDGs Mapper — Claude Code Reference

## What this project is
Research analytics platform that classifies ORCID publications and DOI articles by UN Sustainable Development Goals (SDGs 1–17). Frontend is React 18; backend is PHP 8.0+.

## Tech stack
| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS, React Router v6 (HashRouter) |
| UI libs | Recharts, react-leaflet, react-hot-toast, react-i18next |
| Backend | PHP 8.0+, PDO (MariaDB / PostgreSQL) |
| Config | `.env` file, no Composer dotenv (built-in parser) |
| Namespace | `Sciecola\` → `src/` (PSR-4) |

## Key commands
```bash
# Frontend dev server
cd frontend-src && npm install && npm run dev   # http://localhost:5173

# Production build (output → public/assets/sicola-ui/)
cd frontend-src && npm run build

# PHP built-in server (for api/ testing)
php -S localhost:8000 -t public
```

## Directory map
```
/
├── api/              PHP API endpoints (accessed via /api/*.php)
├── config/           config.php — loads .env then defines constants
├── includes/         bootstrap.php, legacy config.php, autoload.php
├── src/              PSR-4 namespaced PHP classes (Sciecola\*)
│   ├── Auth/         TwoFactorAuth
│   ├── Cache/        DbCacheService
│   ├── Database/     Connection (PDO wrapper)
│   └── Mail/         MailService
├── frontend-src/     React + Vite source
│   └── src/
│       ├── App.jsx   Routes (HashRouter)
│       ├── pages/    Full-page views
│       └── components/
├── templates/email/  HTML email templates ({{placeholder}} syntax)
├── public/           Web root; assets at public/assets/
└── .env.example      Copy to .env and fill in values
```

## Environment setup
```bash
cp .env.example .env
# Edit .env — at minimum set DB_HOST, DB_NAME, DB_USER, DB_PASS
```
`.env` is auto-loaded by `config/config.php` and `includes/config.php` using a built-in parser (no Composer needed).

## Routing (React)
All routes defined in `frontend-src/src/App.jsx` using `HashRouter`. Routes:
- `/` — Home (SDG dashboard)
- `/researchers` — Researcher list
- `/orcid/:orcid` — ResearcherProfile
- `/articles` — Article list
- `/doi/:doi` — ArticleProfile
- `/journals` — Journal list
- `/journals/:slug` — JournalProfile
- `/sdgs` — SDG overview
- `/trends-analysis` — Trend charts
- `/insights` — AI insights page

## Branch
`claude/fix-orcid-profile-display-YpCNu`

## Important gotchas
- `config/config.php` no longer has the ROOT_PATH guard — it self-defines `ROOT_PATH` if absent.
- `SMTP_AUTH` constant is only `true` when `SMTP_USER` is non-empty. This prevents blank credential SMTP failures.
- Legacy `pages/*.php` and `components/*.php` files have been renamed `*_BAK.php` — they are no longer active.
- Platform-specific esbuild/rollup devDeps removed from `frontend-src/package.json`; Vite resolves them at runtime.
- Email templates live in `templates/email/*.html` and use `{{key}}` placeholders.
- Default SVG fallback images at `public/assets/img/{researcher,article,journal,institution}-default.svg`.
