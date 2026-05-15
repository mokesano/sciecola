# Wizdam Ecosystem — Unified Database & API Architecture

Panduan unified database dan API untuk keempat repository yang terintegrasi dalam ekosistem Wizdam.

| Repository | Domain | Fungsi | Tech Stack |
|---|---|---|---|
| `sdgs-mapper` | sangia.org | Research knowledge base + SDG mapping UI | React + PHP backend |
| `wizdam-apis` | api.sangia.org | Stateless analysis API (multi-source citations, impact scoring, trends, recommendations) | PHP REST |
| `SDGs-analytics` | sangia.org/analytics | Analytics dashboard & reporting | React / Chart library |
| `wizdam-sikola` | stipwunaraha.ac.id | Academic profile platform (OJS-based) | OJS + PHP |
| `sdg-mono` | Legacy monolith | Consolidated legacy system | PHP/Mixed |

**Koneksi data center**: Semua aplikasi menggunakan **satu database terpusat** `wizdam_ecosystem` dan **satu API layer** `wizdam-apis` untuk analisis data.

---

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│  Frontend Layer (React/UI)                          │
├──────────────────────┬──────────────────────────────┤
│  sdgs-mapper          │  SDGs-analytics              │
│  (researcher mapping) │  (dashboard)                 │
│  React + Material-UI  │  React + Chart.js            │
│                       │                              │
│  wizdam-sikola        │  sdg-mono                    │
│  (OJS web UI)         │  (legacy monolith)           │
│  OJS core            │  PHP/Mixed                    │
└─────────┬──────────────┬────────────────────────────┘
          │              │
          └──────────┬───┘
                     ↓
        ┌────────────────────────────┐
        │   wizdam-apis REST Layer   │
        │   (Stateless Analysis)     │
        │                            │
        │  • Citation API (4 sources)│
        │  • Impact Calculator       │
        │  • Trend Analysis          │
        │  • Policy Recommendation   │
        │  • ORCID/Scopus Profile    │
        │  • Key Management (admin)  │
        └────────────┬───────────────┘
                     ↓
        ┌────────────────────────────┐
        │  wizdam_ecosystem DB       │
        │  (Shared central DB)       │
        │                            │
        │  10 tables (unified)       │
        │  • institutions            │
        │  • researchers             │
        │  • publications            │
        │  • work_sdgs               │
        │  • journals                │
        │  • api_keys / rate_limits  │
        │  • analytics_snapshots     │
        │  • ecosystem_cache         │
        └────────────────────────────┘
```

---

## Data Flow & Responsibility

### wizdam-apis (Stateless Analysis Engine)

```
Frontend (React/OJS) 
    ↓ HTTP POST/GET (with API Key)
wizdam-apis (API)
    ↓ fetches from external APIs (if not supplied)
    OR uses supplied data from database
External APIs (ORCID, Scopus, Crossref, OpenAlex, SemanticScholar, PubMed)
wizdam_ecosystem DB (reads: api_keys, ecosystem_cache, publications for supplied_works)
    ↓ returns analysis result + raw_data
Frontend (stores in DB via own endpoint)
    ↓
wizdam_ecosystem DB (persistence: each app owns its writes)
```

**Key principle**: wizdam-apis adalah **read-only untuk DB knowledge layer** (hanya baca publications, researchers jika needed). Untuk api_keys, wizdam-apis bisa UPDATE is_active untuk revokasi. Semua **write operasi lainnya** dilakukan oleh masing-masing aplikasi sendiri.

---

## Setup Database (Jalankan Sekali di Server)

### 1. Buat database & user

```bash
mysql -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS wizdam_ecosystem
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Main application user (full access)
CREATE USER IF NOT EXISTS 'wizdam_app'@'localhost' IDENTIFIED BY 'GANTI_PASSWORD_INI';
GRANT ALL PRIVILEGES ON wizdam_ecosystem.* TO 'wizdam_app'@'localhost';

-- Optional: per-app users untuk least-privilege (lihat bagian "Hak Akses")
FLUSH PRIVILEGES;
SQL
```

### 2. Jalankan schema

```bash
# Dari sdgs-mapper (canonical schema owner):
mysql -u root -p wizdam_ecosystem < db/schema.sql
```

---

## Konfigurasi `.env` (Sama untuk Semua Repo)

Setiap repository memiliki `.env` dengan kredensial yang sama:

```env
# Database (untuk apps yang perlu menulis)
DB_DRIVER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=wizdam_ecosystem
DB_USERNAME=wizdam_app
DB_PASSWORD=GANTI_PASSWORD_INI
DB_CHARSET=utf8mb4

# API URLs (untuk frontend/backend apps yang call wizdam-apis)
WIZDAM_API_URL=https://api.sangia.org
WIZDAM_API_KEY=<generated-per-client>

# wizdam-apis server config (hanya di wizdam-apis)
WIZDAM_SHARED_SECRET=<generate-with-openssl-rand-hex-32>
SEMANTIC_SCHOLAR_API_KEY=<dari-semanticscholar.org/product/api>
PUBMED_API_KEY=<dari-ncbi.nlm.nih.gov/account>
OPENALEX_MAILTO=api@sangia.org
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60
```

---

## Struktur Tabel (10 Entitas Unified)

### Layer 1 — Identity (Institusi & Peneliti)

| Tabel | Ditulis oleh | Dibaca oleh | Keterangan |
|---|---|---|---|
| `institutions` | sikola, mapper | semua | Data institusi/universitas |
| `researchers` | mapper, sikola | semua | Profil peneliti unified (ORCID as PK) |

### Layer 2 — Knowledge (Publikasi & Jurnal)

| Tabel | Ditulis oleh | Dibaca oleh | Keterangan |
|---|---|---|---|
| `journals` | mapper | semua | Metadata jurnal (ISSN, SJR, SINTA) |
| `publications` | mapper, sikola | semua | Karya ilmiah (DOI as PK) |
| `publication_authors` | mapper, sikola | semua | Relasi publikasi ↔ peneliti |

### Layer 3 — Intelligence (SDG Mapping & Analytics)

| Tabel | Ditulis oleh | Dibaca oleh | Keterangan |
|---|---|---|---|
| `work_sdgs` | mapper | analytics, sikola | SDG mapping per publikasi (granular) |
| `ecosystem_cache` | semua | semua | Central cache layer (TTL-based) |
| `analytics_snapshots` | analytics | analytics, sikola | Pre-computed aggregates (trends, metrics) |

### Layer 4 — Platform (API & Infrastructure)

| Tabel | Ditulis oleh | Dibaca oleh | Keterangan |
|---|---|---|---|
| `api_keys` | sikola (via wizdam-apis) | apis | API key hashes, revocation status |
| `api_rate_limits` | apis | apis | Rate limit counters (optional) |
| `jobs` | semua | semua | Background job queue (future) |

---

## Cara Setiap Aplikasi Menggunakan wizdam-apis

### 1️⃣ sdgs-mapper (React + PHP Backend)

#### React Frontend → wizdam-apis

```javascript
// React component (src/components/ResearcherProfile.jsx)
import { useQuery } from '@tanstack/react-query';

export function ResearcherProfile({ orcid }) {
  // Call wizdam-apis for ORCID profile
  const { data: profile } = useQuery({
    queryKey: ['orcid-profile', orcid],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/orcid/profile?orcid=${orcid}`,
        {
          headers: { 'X-API-Key': process.env.REACT_APP_API_KEY }
        }
      );
      return res.json();
    }
  });

  // Call wizdam-apis for impact score
  const { data: impact } = useQuery({
    queryKey: ['impact-score', orcid],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/impact/calculate`,
        {
          method: 'POST',
          headers: { 'X-API-Key': process.env.REACT_APP_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ orcid, social: {}, economic: {} })
        }
      );
      return res.json();
    }
  });

  // Call wizdam-apis for citation data
  const { data: citations } = useQuery({
    queryKey: ['citations', doi],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/citation/doi?doi=${doi}`,
        { headers: { 'X-API-Key': process.env.REACT_APP_API_KEY } }
      );
      return res.json();
    }
  });

  return (
    <>
      <ProfileCard data={profile?.person_summary} />
      <ImpactScoreChart data={impact?.pillars} />
      <CitationNetworkGraph data={citations?.consolidated} />
    </>
  );
}
```

#### PHP Backend (sdgs-mapper) → wizdam_ecosystem DB (Persist hasil)

```php
// sdgs-mapper/app/Http/Controllers/ResearcherController.php
public function upsertFromOrcid(string $orcid) {
  // Step 1: Call wizdam-apis untuk fetch fresh data
  $profile = Http::withHeaders([
    'X-API-Key' => config('services.wizdam_api.key')
  ])->get(config('services.wizdam_api.url') . "/api/v1/orcid/profile?orcid=$orcid")
    ->json();

  // Step 2: Extract Scopus Author ID dari ORCID profile
  $scopusAuthorId = $profile['person_summary']['scopus_author_id'] ?? null;

  // Step 3: Simpan ke DB (pemilik: sdgs-mapper)
  Researcher::updateOrCreate(['orcid' => $orcid], [
    'name' => $profile['person_summary']['name'],
    'scopus_id' => $scopusAuthorId,
    'profile_cache_json' => json_encode($profile['raw_data']),
    'cache_expires_at' => now()->addDays(30)
  ]);

  return $profile;
}
```

---

### 2️⃣ wizdam-sikola (OJS Platform) → wizdam-apis

```php
// wizdam-sikola/app/Services/ImpactService.php
public function calculateResearcherImpact(User $user): array {
  $response = Http::withHeaders([
    'X-API-Key' => config('services.wizdam_api.service_key')
  ])->post(config('services.wizdam_api.url') . '/api/v1/impact/calculate', [
    'orcid' => $user->orcid_id,
    'social' => [
      'media_mentions' => $user->media_mentions ?? 0,
      'policy_citations' => $user->policy_citations ?? 0
    ],
    'economic' => [
      'industry_adoption' => $user->industry_adoption ?? 0,
      'patents' => Patent::where('user_id', $user->id)->count()
    ]
  ]);

  if ($response->ok()) {
    $result = $response->json();
    
    // Cache result locally
    UserAnalysis::updateOrCreate(
      ['user_id' => $user->id, 'analysis_type' => 'impact'],
      ['result_json' => json_encode($result), 'calculated_at' => now()]
    );

    return $result;
  }

  return ['status' => 'error'];
}
```

---

### 3️⃣ SDGs-analytics (React Dashboard) → wizdam-apis (read-only)

```javascript
// SDGs-analytics/src/pages/Dashboard.jsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';

export function TrendDashboard() {
  const { data: trends } = useQuery({
    queryKey: ['trends', selectedResearcher.orcid],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/v1/trend/analyze`,
        {
          method: 'POST',
          headers: { 'X-API-Key': process.env.REACT_APP_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orcid: selectedResearcher.orcid,
            analysis_type: 'sdg_evolution',
            time_range: '5y'
          })
        }
      );
      return res.json();
    }
  });

  return (
    <LineChart data={trends?.sdg_by_year}>
      <XAxis dataKey="year" />
      <YAxis />
      {trends?.dominant_sdgs?.map(sdg => (
        <Line key={sdg} type="monotone" dataKey={`SDG${sdg}`} />
      ))}
    </LineChart>
  );
}
```

---

### 4️⃣ sdg-mono (Legacy) → wizdam-apis

```php
// sdg-mono/app/api/researcher.php
$client = new GuzzleHttp\Client();
$response = $client->post(
  'https://api.sangia.org/api/v1/impact/calculate',
  [
    'headers' => ['X-API-Key' => getenv('WIZDAM_API_KEY')],
    'json' => ['orcid' => $_GET['orcid']]
  ]
);

$impact = json_decode($response->getBody(), true);
echo json_encode($impact);
```

---

## API Keys — Multi-tenant Management

### Prinsip: Satu Secret, Semua Aplikasi

`WIZDAM_SHARED_SECRET` adalah **network signing credential** yang harus **identik** di semua `.env` ekosistem:

```
wizdam-apis         ← validates HMAC
wizdam-sikola       ← can generateKey()
sdg-mapper          ← can generateKey()
sdgs-analytics      ← can generateKey()
sdg-mono            ← can generateKey()
```

wizdam-apis **tidak peduli** siapa yang membuat key — hanya memverifikasi HMAC cocok dengan secret yang sama.

### Formula Key (implementasi di semua bahasa)

```
key = "wz_" + userId + "_" + timestamp + "_" + HMAC-SHA256(userId+":"+timestamp, SECRET)[0..15]
```

### Generasi Key (dari aplikasi manapun)

```php
// PHP — berlaku untuk wizdam-sikola, sdg-mapper, sdgs-analytics, sdg-mono
$secret = env('WIZDAM_SHARED_SECRET'); // sama di semua app
$userId = (string) auth()->id();       // atau app-level ID
$ts     = (string) time();
$hmac16 = substr(hash_hmac('sha256', $userId . ':' . $ts, $secret), 0, 16);
$key    = 'wz_' . $userId . '_' . $ts . '_' . $hmac16;

// Simpan hash ke shared DB (wizdam_ecosystem.api_keys)
DB::table('api_keys')->insert([
  'key_hash'   => hash('sha256', $key),
  'user_id'    => $userId,
  'is_active'  => 1,
  'created_at' => now(),
]);
// Kembalikan $key ke user — hanya ditampilkan sekali
```

```javascript
// JavaScript / Node.js — untuk sdg-mapper backend
const crypto = require('crypto');
function generateKey(userId, secret) {
  const ts    = Math.floor(Date.now() / 1000).toString();
  const hmac  = crypto.createHmac('sha256', secret)
                      .update(userId + ':' + ts).digest('hex')
                      .substring(0, 16);
  return `wz_${userId}_${ts}_${hmac}`;
}
```

```python
# Python — untuk sdg-mono atau analytics
import hmac, hashlib, time
def generate_key(user_id: str, secret: str) -> str:
    ts    = str(int(time.time()))
    sig   = hmac.new(secret.encode(), f"{user_id}:{ts}".encode(), hashlib.sha256)
    hmac16 = sig.hexdigest()[:16]
    return f"wz_{user_id}_{ts}_{hmac16}"
```

### Revokasi (dari aplikasi manapun)

```php
// POST ke wizdam-apis /api/v1/admin/keys/revoke dengan service key
Http::withHeaders(['X-API-Key' => $serviceKey])
    ->post(config('wizdam_api.url') . '/api/v1/admin/keys/revoke', ['key' => $keyToRevoke]);
```

> **NOTE**: `permissions_json` column exists in schema but is NOT enforced by ApiKeyMiddleware.
> Current auth only validates HMAC + checks `is_active = 0`.
> Any valid key can call all endpoints. Endpoint-scoping is a future feature.

---

## Deployment Architecture (Production)

```
┌─────────────────────────────────────────┐
│  API Server (api.sangia.org:443)        │
│  wizdam-apis (PHP/Apache)               │
│  • ORCID, Scopus, Crossref, OpenAlex    │
│  • Authentication (HMAC + api_keys DB)  │
│  • Rate limiting (DB or file)           │
└────────────────┬────────────────────────┘
                 │ HTTP
┌────────────────┼─────────────────────────┐
│                │                         │
↓                ↓                         ↓
Web Server 1     Web Server 2      Shared MySQL
(sangia.org)     (stipwunaraha)    (localhost:3306)
                                   wizdam_ecosystem
• sdgs-mapper    • wizdam-sikola    • institutions
• analytics      • OJS              • researchers
• sdg-mono       users              • publications
                                    • work_sdgs
                                    • journals
                                    • api_keys
                                    • cache
                                    • snapshots
```

---

## Hak Akses per Aplikasi (Least Privilege)

```sql
-- wizdam-apis: API key management
CREATE USER 'wizdam_apis'@'%' IDENTIFIED BY 'api_password';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.api_keys TO 'wizdam_apis'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.api_rate_limits TO 'wizdam_apis'@'%';

-- sdgs-mapper: Knowledge base writers
CREATE USER 'wizdam_mapper'@'%' IDENTIFIED BY 'mapper_password';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.researchers TO 'wizdam_mapper'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.publications TO 'wizdam_mapper'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.work_sdgs TO 'wizdam_mapper'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.ecosystem_cache TO 'wizdam_mapper'@'%';

-- wizdam-sikola: Identity + knowledge base writer
CREATE USER 'wizdam_sikola'@'%' IDENTIFIED BY 'sikola_password';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.institutions TO 'wizdam_sikola'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.researchers TO 'wizdam_sikola'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.publications TO 'wizdam_sikola'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.publication_authors TO 'wizdam_sikola'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.analytics_snapshots TO 'wizdam_sikola'@'%';
GRANT SELECT, INSERT, UPDATE ON wizdam_ecosystem.ecosystem_cache TO 'wizdam_sikola'@'%';

-- SDGs-analytics: Read-only
CREATE USER 'wizdam_analytics'@'%' IDENTIFIED BY 'analytics_password';
GRANT SELECT ON wizdam_ecosystem.researchers TO 'wizdam_analytics'@'%';
GRANT SELECT ON wizdam_ecosystem.publications TO 'wizdam_analytics'@'%';
GRANT SELECT ON wizdam_ecosystem.work_sdgs TO 'wizdam_analytics'@'%';
GRANT SELECT ON wizdam_ecosystem.analytics_snapshots TO 'wizdam_analytics'@'%';

FLUSH PRIVILEGES;
```

---

## Checklist Implementasi

### ☐ sdgs-mapper
- [ ] Setup DB credentials
- [ ] React components call wizdam-apis (ORCID, citation, impact)
- [ ] Persist results to `researchers`, `publications`, `work_sdgs`
- [ ] Set API key in `.env`

### ☐ wizdam-apis
- [ ] Setup DB credentials
- [ ] Verify all clients: OpenCitations, SemanticScholar, OpenAlex, PubMed
- [ ] Rate limiting (DB or file)
- [ ] Deploy to `api.sangia.org`

### ☐ wizdam-sikola
- [ ] Setup DB credentials
- [ ] Call wizdam-apis for impact, trends, ORCID profiles
- [ ] Persist researcher profiles, publications, institution data
- [ ] Persist analysis results to `analytics_snapshots`
- [ ] Use least-privilege user: `wizdam_sikola` (not `wizdam_app`)

### ☐ SDGs-analytics
- [ ] Setup DB credentials
- [ ] React dashboard calls wizdam-apis
- [ ] Read from `analytics_snapshots`

### ☐ sdg-mono
- [ ] Update PHP scripts to call wizdam-apis
- [ ] Set API key in `.env`

---

**Schema version**: v2.0-multi-consumer  
**Last updated**: 2026-05-15  
**Canonical authority**: sdgs-mapper/UNIFIED_SCHEMA_GUIDE.md  
**API version**: v2.0-multisource
