# Development Guide

## Prerequisites

| Requirement | Version |
|---|---|
| PHP | 8.0+ |
| Node.js | 18+ |
| npm | 9+ |
| MariaDB / PostgreSQL | 10.5+ / 14+ |
| Apache / Nginx | Any (or PHP built-in server) |

## Setup

### 1. Clone
```bash
git clone https://github.com/mokesano/sdgs-mapper.git
cd sdgs-mapper
```

### 2. Environment variables
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

| Key | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | `development` or `production` |
| `APP_URL` | `http://localhost:5173` | Frontend base URL |
| `SITE_URL` | `http://localhost/workspace` | PHP backend base URL |
| `DB_DRIVER` | `mysql` | `mysql` or `pgsql` |
| `DB_HOST` | `localhost` | Database host |
| `DB_PORT` | `3306` | Database port |
| `DB_NAME` | `sicola_db` | Database name |
| `DB_USER` | `sicola` | Database username |
| `DB_PASS` | _(empty)_ | Database password |
| `WIZDAM_API_BASE` | `https://api.sangia.org` | Wizdam API base URL |
| `WIZDAM_API_KEY` | _(empty)_ | Wizdam API key |
| `MAIL_DRIVER` | `log` | `log`, `smtp`, or `mail` |
| `MAIL_FROM` | `noreply@sciecola.id` | Sender address |
| `SMTP_HOST` | `smtp.mailtrap.io` | SMTP hostname |
| `SMTP_PORT` | `2525` | SMTP port |
| `SMTP_USER` | _(empty)_ | SMTP username (leave empty to disable auth) |
| `SMTP_PASS` | _(empty)_ | SMTP password |
| `SMTP_SECURE` | `tls` | `tls` or `ssl` |
| `CACHE_TTL` | `86400` | Cache lifetime in seconds |
| `ORCID_API_URL` | `https://pub.orcid.org/v3.0` | ORCID API base |
| `CROSSREF_API_URL` | `https://api.crossref.org/works` | CrossRef API base |
| `OPENALEX_API_URL` | `https://api.openalex.org/works` | OpenAlex API base |

### 3. Database
```sql
CREATE DATABASE sicola_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sicola'@'localhost' IDENTIFIED BY 'yourpassword';
GRANT ALL PRIVILEGES ON sicola_db.* TO 'sicola'@'localhost';
FLUSH PRIVILEGES;
```

Then run migrations (see `docs/DATABASE.md` for CREATE TABLE statements).

### 4. Frontend
```bash
cd frontend-src
npm install
npm run dev        # Dev server → http://localhost:5173
npm run build      # Production build → ../public/assets/sicola-ui/
```

### 5. Backend

**Option A — Apache vhost:**
```apache
<VirtualHost *:80>
    DocumentRoot /path/to/sdgs-mapper/public
    ServerName sciecola.local
    <Directory /path/to/sdgs-mapper/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**Option B — PHP built-in server (quick test):**
```bash
php -S localhost:8000 -t public
```

## Running the full stack

```bash
# Terminal 1 — Frontend
cd frontend-src && npm run dev

# Terminal 2 — PHP backend
php -S localhost:8000 -t public
```

Frontend at `http://localhost:5173`, API calls proxy to `http://localhost:8000/api/`.

## PSR-4 autoloader

Classes in `src/` (namespace `Sciecola\`) are loaded via `includes/autoload.php`. No Composer required. To use a PSR-4 class:

```php
require_once '/path/to/includes/autoload.php';

use Sciecola\Database\Connection;
$db = Connection::getInstance();
```

If Composer is available: `composer install` then `require_once 'vendor/autoload.php'`.

## Common issues

**`ROOT_PATH` not defined when loading `config/config.php` directly**
`config/config.php` self-defines `ROOT_PATH` if not already defined. Safe to include from any context.

**SMTP email not sending**
Leave `SMTP_USER` empty to use `MAIL_DRIVER=log` (writes to `/tmp/sciecola_mail.log`). Set `SMTP_USER` only when you have real credentials — `SMTP_AUTH` is only enabled when `SMTP_USER` is non-empty.

**Vite build fails on non-Linux host**
Platform-specific esbuild/rollup devDeps were removed from `package.json`. Vite resolves them automatically at runtime.

**Cache files from old version**
Run `GET /api/cache_to_db.php?action=migrate` to migrate legacy file-cache to the database.
