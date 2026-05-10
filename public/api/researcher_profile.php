<?php
/**
 * Aggregated ORCID Researcher Profile API
 *
 * Menggabungkan: ORCID init + semua batch works + wizdam-apis impact score
 * Output: JSON terpadu siap digunakan ResearcherProfile.jsx
 *
 * GET /api/researcher_profile.php?orcid=0000-0000-0000-0000
 */

declare(strict_types=1);

define('SCIECOLA_API_CONTEXT', true);
$configFile = __DIR__ . '/../../config/config.php';
if (file_exists($configFile)) require_once $configFile;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// ── Input validation ──────────────────────────────────────────────────────────
$orcid = trim($_GET['orcid'] ?? '');
if (empty($orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'orcid is required']);
    exit;
}
if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'invalid ORCID format']);
    exit;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Call SDG_Classification_API.php directly (in-process, no HTTP).
 */
function callLocalApi(string $apiFile, array $params): array
{
    $origGet    = $_GET;
    $origMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $_GET = $params;
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $prevErr = ini_get('display_errors');
    ini_set('display_errors', '0');
    ob_start();
    try {
        require $apiFile;
    } catch (Throwable $t) {
        ob_end_clean();
        $_GET = $origGet;
        $_SERVER['REQUEST_METHOD'] = $origMethod;
        ini_set('display_errors', $prevErr);
        return ['status' => 'error', 'message' => $t->getMessage()];
    }
    $raw = ob_get_clean();
    $_GET = $origGet;
    $_SERVER['REQUEST_METHOD'] = $origMethod;
    ini_set('display_errors', $prevErr);

    // Extract first JSON object/array from output
    for ($i = 0, $l = strlen($raw); $i < $l; $i++) {
        if ($raw[$i] === '{' || $raw[$i] === '[') {
            $data = json_decode(substr($raw, $i), true);
            return is_array($data) ? $data : ['status' => 'error', 'message' => 'invalid json'];
        }
    }
    return ['status' => 'error', 'message' => 'empty api output'];
}

/**
 * Call wizdam-apis (api.sangia.org) via cURL. Returns null if API key missing or error.
 */
function callWizdamApi(string $endpoint, array $body): ?array
{
    $apiKey  = defined('WIZDAM_API_KEY') ? WIZDAM_API_KEY : (getenv('WIZDAM_API_KEY') ?: '');
    $baseUrl = defined('WIZDAM_API_BASE') ? WIZDAM_API_BASE : 'https://api.sangia.org';
    if (empty($apiKey)) return null;

    $ch = curl_init($baseUrl . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-Key: ' . $apiKey,
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $resp     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if (!$resp || $httpCode >= 400) return null;
    $data = json_decode($resp, true);
    return is_array($data) ? $data : null;
}

// ── Static lookup tables ──────────────────────────────────────────────────────

const SDG_COLORS = [
    1 => '#e5243b', 2 => '#dda63a', 3 => '#4c9f38', 4 => '#c5192d',
    5 => '#ff3a21', 6 => '#26bde2', 7 => '#fcc30b', 8 => '#a21942',
    9 => '#fd6925', 10 => '#dd1367', 11 => '#fd9d24', 12 => '#bf8b2e',
    13 => '#3f7e44', 14 => '#0a97d9', 15 => '#56c02b', 16 => '#00689d',
    17 => '#19486a',
];
const SDG_NAMES = [
    1 => 'No Poverty', 2 => 'Zero Hunger', 3 => 'Good Health & Well-being',
    4 => 'Quality Education', 5 => 'Gender Equality', 6 => 'Clean Water & Sanitation',
    7 => 'Affordable & Clean Energy', 8 => 'Decent Work & Economic Growth',
    9 => 'Industry, Innovation & Infrastructure', 10 => 'Reduced Inequalities',
    11 => 'Sustainable Cities & Communities', 12 => 'Responsible Consumption',
    13 => 'Climate Action', 14 => 'Life Below Water', 15 => 'Life on Land',
    16 => 'Peace, Justice & Strong Institutions', 17 => 'Partnerships for the Goals',
];
const COUNTRY_MAP = [
    'ID' => 'Indonesia', 'US' => 'United States', 'GB' => 'United Kingdom',
    'AU' => 'Australia', 'MY' => 'Malaysia', 'SG' => 'Singapore',
    'JP' => 'Japan', 'CN' => 'China', 'IN' => 'India', 'DE' => 'Germany',
    'FR' => 'France', 'NL' => 'Netherlands', 'CA' => 'Canada',
];

// ── Locate API file ───────────────────────────────────────────────────────────

$apiFile = __DIR__ . '/SDG_Classification_API.php';
if (!file_exists($apiFile)) {
    $apiFile = __DIR__ . '/../../api/SDG_Classification_API.php';
}
if (!file_exists($apiFile)) {
    http_response_code(503);
    echo json_encode(['status' => 'error', 'message' => 'SDG_Classification_API.php not found']);
    exit;
}

// ── Step 1: init ──────────────────────────────────────────────────────────────

$initData = callLocalApi($apiFile, ['orcid' => $orcid, 'action' => 'init']);
if (($initData['status'] ?? '') !== 'success') {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'ORCID fetch failed', 'detail' => $initData]);
    exit;
}

$totalWorks = (int)($initData['total_works'] ?? 0);
$personal   = $initData['personal_info'] ?? [];

// ── Step 2: fetch all batches ─────────────────────────────────────────────────

$allWorks  = [];
$batchSize = 10;
for ($offset = 0; $offset < $totalWorks && $offset < 200; $offset += $batchSize) {
    $batch = callLocalApi($apiFile, [
        'orcid'  => $orcid,
        'action' => 'batch',
        'offset' => $offset,
        'limit'  => $batchSize,
    ]);
    if (!empty($batch['works'])) {
        $allWorks = array_merge($allWorks, $batch['works']);
    }
}

// ── Step 3: wizdam-apis impact score (optional) ───────────────────────────────

$scopusId = null;
foreach (($personal['external_ids'] ?? []) as $extId) {
    if (($extId['type'] ?? '') === 'Scopus Author ID') {
        $scopusId = $extId['value'] ?? null;
        break;
    }
}

$impactData = callWizdamApi('/api/v1/impact/calculate', [
    'orcid'           => $orcid,
    'scopus_id'       => $scopusId,
    'batch_size'      => 20,
    'supplied_works'  => $allWorks,
    'supplied_person' => $personal,
]);

// ── Step 4: derive computed fields ────────────────────────────────────────────

// Publication trend
$yearCounts   = [];
$firstPubYear = null;
foreach ($allWorks as $work) {
    $year = (int)($work['year'] ?? 0);
    if ($year < 1980 || $year > 2100) continue;
    $yearCounts[$year] = ($yearCounts[$year] ?? 0) + 1;
    if ($firstPubYear === null || $year < $firstPubYear) $firstPubYear = $year;
}
ksort($yearCounts);
$publicationTrend = array_values(array_map(
    fn($y, $c) => ['year' => (string)$y, 'count' => $c],
    array_keys($yearCounts),
    array_values($yearCounts)
));

// Collaborators (unique contributors, counted by co-occurrences)
$collaboratorMap = [];
foreach ($allWorks as $work) {
    foreach (($work['contributors'] ?? []) as $c) {
        $name = trim($c['name'] ?? '');
        if (empty($name)) continue;
        if (!isset($collaboratorMap[$name])) {
            $collaboratorMap[$name] = ['count' => 0, 'orcid' => $c['orcid'] ?? null];
        }
        $collaboratorMap[$name]['count']++;
    }
}
uasort($collaboratorMap, fn($a, $b) => $b['count'] - $a['count']);
$collaborators = [];
$idx = 1;
foreach (array_slice($collaboratorMap, 0, 20, true) as $cName => $meta) {
    $collaborators[] = [
        'id'             => $idx++,
        'name'           => $cName,
        'univ'           => '',
        'avatar'         => null,
        'collaborations' => $meta['count'],
        'orcid'          => $meta['orcid'],
    ];
}

// SDG focus (from classified works)
$sdgCounts = [];
foreach ($allWorks as $work) {
    foreach (($work['sdgs'] ?? []) as $sdg) {
        $n = (int)preg_replace('/[^0-9]/', '', (string)$sdg);
        if ($n >= 1 && $n <= 17) $sdgCounts[$n] = ($sdgCounts[$n] ?? 0) + 1;
    }
}
arsort($sdgCounts);
$totalSdg = max(1, array_sum($sdgCounts));
$sdgFocus = [];
foreach ($sdgCounts as $n => $cnt) {
    $sdgFocus[] = [
        'sdg'        => $n,
        'name'       => SDG_NAMES[$n] ?? "SDG $n",
        'percentage' => (int)round($cnt / $totalSdg * 100),
        'color'      => SDG_COLORS[$n] ?? '#6b7280',
        'count'      => $cnt,
    ];
}

// Top keywords (from works, excluding generic SDG keywords)
$stopWords  = ['partnerships','global cooperation','sustainable development','international support'];
$kwFreq = [];
foreach ($allWorks as $work) {
    foreach (($work['keywords'] ?? []) as $kw) {
        $kw = strtolower(trim($kw));
        if (strlen($kw) < 3 || strlen($kw) > 60 || in_array($kw, $stopWords)) continue;
        $kwFreq[$kw] = ($kwFreq[$kw] ?? 0) + 1;
    }
}
// Also add researcher's own keywords
foreach (($personal['keywords'] ?? []) as $kw) {
    $kw = strtolower(trim($kw));
    if (!empty($kw)) $kwFreq[$kw] = ($kwFreq[$kw] ?? 0) + 10;
}
arsort($kwFreq);
$topKeywords = [];
foreach (array_slice($kwFreq, 0, 20, true) as $text => $freq) {
    $topKeywords[] = ['text' => ucwords($text), 'size' => min(40, max(10, $freq * 3))];
}

// Recent publications (sorted newest first)
usort($allWorks, fn($a, $b) => (int)($b['year'] ?? 0) - (int)($a['year'] ?? 0));
$recentPublications = [];
foreach (array_slice($allWorks, 0, 20) as $i => $work) {
    $sdgsNum = array_values(array_filter(
        array_map(fn($s) => (int)preg_replace('/[^0-9]/', '', (string)$s), $work['sdgs'] ?? []),
        fn($n) => $n >= 1 && $n <= 17
    ));
    $recentPublications[] = [
        'id'        => $i + 1,
        'doi'       => $work['doi'] ?? null,
        'title'     => $work['title'] ?? '',
        'journal'   => $work['journal'] ?? '',
        'year'      => (int)($work['year'] ?? 0),
        'sdgs'      => $sdgsNum,
        'views'     => 0,
        'citations' => 0,
        'abstract'  => $work['abstract'] ?? '',
        'authors'   => array_map(fn($c) => $c['name'] ?? '', $work['contributors'] ?? []),
        'put_code'  => $work['put_code'] ?? null,
        'thumbnail' => null,
    ];
}

// Affiliations from personal_info
$affiliations = [];
$affSeen = [];
foreach (($personal['affiliations'] ?? []) as $aff) {
    $org = trim($aff['organization'] ?? '');
    if (empty($org) || in_array($org, $affSeen)) continue;
    $affSeen[] = $org;
    $affiliations[] = [
        'name'       => $org,
        'department' => $aff['department'] ?? null,
        'role'       => $aff['role'] ?? null,
        'is_current' => (bool)($aff['is_current'] ?? false),
        'articles'   => 0,
        'percentage' => 0,
        'logo'       => null,
    ];
}
if (!empty($affiliations)) {
    $affiliations[0]['articles']   = $totalWorks;
    $affiliations[0]['percentage'] = 100;
}

// Personal fields
$primaryAff  = $personal['affiliations'][0] ?? [];
$address     = $primaryAff['address'] ?? [];
$countryCode = $address['country'] ?? '';
$country     = COUNTRY_MAP[$countryCode] ?? ($countryCode ?: 'Unknown');
$city        = $address['city'] ?? '';
$location    = $city ? "$city, $country" : $country;

$scopusUrl = null;
foreach (($personal['external_ids'] ?? []) as $extId) {
    if (($extId['type'] ?? '') === 'Scopus Author ID') {
        $scopusUrl = $extId['url'] ?? null;
        break;
    }
}

// Impact metrics (from wizdam-apis, else 0)
$totalCitations = (int)($impactData['total_citations'] ?? $impactData['citations'] ?? 0);
$hIndex         = (int)($impactData['h_index']         ?? $impactData['hIndex']    ?? 0);
$i10Index       = (int)($impactData['i10_index']        ?? $impactData['i10Index']  ?? 0);
$citationTrend  = [];
foreach ($impactData['citation_trend'] ?? [] as $row) {
    $citationTrend[] = ['year' => (string)($row['year'] ?? ''), 'citations' => (int)($row['citations'] ?? 0)];
}

// ── Step 5: build unified response ───────────────────────────────────────────

echo json_encode([
    'status' => 'success',
    'orcid'  => $orcid,
    'profile' => [
        // Identity
        'name'         => $personal['name'] ?? '',
        'orcid'        => $orcid,
        'avatar'       => null,
        'verified'     => false,
        'title'        => $primaryAff['role'] ?? 'Researcher',
        'univ'         => $personal['institutions'][0] ?? ($primaryAff['organization'] ?? ''),
        'department'   => $primaryAff['department'] ?? '',
        'location'     => $location,
        'email'        => $personal['emails'][0] ?? null,
        'scopusId'     => $scopusId,
        'researcherId' => null,
        'country'      => $country,
        'bio'          => $personal['bio'] ?? null,

        // Metrics
        'publications'       => $totalWorks,
        'citations'          => $totalCitations,
        'hIndex'             => $hIndex,
        'i10Index'           => $i10Index,
        'collaboratorsCount' => count($collaborators),
        'views'              => 0,
        'downloads'          => 0,
        'sdgsInvolved'       => count($sdgCounts),
        'yearsActive'        => $firstPubYear ? "$firstPubYear - Sekarang" : 'N/A',
        'firstPublication'   => $firstPubYear ?? 0,

        // Research
        'researchInterests' => $personal['keywords'] ?? [],
        'sdgFocus'          => $sdgFocus,
        'topKeywords'       => $topKeywords,

        // Trends
        'publicationTrend' => $publicationTrend,
        'citationTrend'    => $citationTrend,

        // Collections
        'recentPublications' => $recentPublications,
        'collaborators'      => $collaborators,
        'affiliations'       => $affiliations,

        // Links
        'socialLinks' => [
            'googleScholar' => null,
            'scopus'        => $scopusUrl,
            'orcid'         => "https://orcid.org/$orcid",
            'linkedin'      => null,
            'researchgate'  => null,
        ],
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
