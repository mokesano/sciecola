<?php
/**
 * My Articles API
 * Returns the articles from the logged-in researcher's ORCID profile.
 *
 * GET /api/my_articles.php?orcid=0000-0002-...&page=1&limit=10&search=&status=&sdg=&sort=date&dir=desc
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;

$orcid  = trim($_GET['orcid'] ?? '');
$page   = max(1, (int)($_GET['page'] ?? 1));
$limit  = min(50, max(1, (int)($_GET['limit'] ?? 10)));
$search = strtolower(trim($_GET['search'] ?? ''));
$status = $_GET['status'] ?? 'All';
$sdg    = $_GET['sdg'] ?? 'All';
$sort   = $_GET['sort'] ?? 'date';
$dir    = strtolower($_GET['dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

if (empty($orcid) || !preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parameter orcid valid diperlukan']);
    exit;
}

// ── Fetch profile from cache or API ─────────────────────────────────────────

function fetchProfile(string $orcid): ?array {
    // 1. Check cache folder first
    $cacheFile = ROOT_PATH . '/cache/orcid_' . preg_replace('/[^a-z0-9_-]/i', '_', $orcid) . '.json';
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['cached_at'])) {
            if (time() - strtotime($cached['cached_at']) < 604800) return $cached;
        }
    }

    // 2. Delegate to researcher_profile.php
    $apiFile = __DIR__ . '/researcher_profile.php';
    if (!file_exists($apiFile)) return null;

    $origGet = $_GET; $origMethod = $_SERVER['REQUEST_METHOD'];
    $_GET = ['orcid' => $orcid];
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    try { require $apiFile; } catch (Throwable $t) { ob_end_clean(); }
    $raw = ob_get_clean();
    $_GET = $origGet; $_SERVER['REQUEST_METHOD'] = $origMethod;

    for ($i = 0, $l = strlen($raw ?? ''); $i < $l; $i++) {
        if ($raw[$i] === '{' || $raw[$i] === '[') {
            $data = json_decode(substr($raw, $i), true);
            if (is_array($data)) return $data;
        }
    }
    return null;
}

$profileData = fetchProfile($orcid);

if (!$profileData || ($profileData['status'] ?? '') !== 'success') {
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data artikel dari ORCID']);
    exit;
}

$profile = $profileData['profile'] ?? [];
$works   = $profile['recentPublications'] ?? [];

// ── Build article objects ────────────────────────────────────────────────────

$articles = [];
foreach ($works as $i => $work) {
    $year = (int)($work['year'] ?? 0);
    $articles[] = [
        'id'          => $work['id'] ?? ($i + 1),
        'title'       => $work['title'] ?? '',
        'journal'     => $work['journal'] ?? '',
        'date'        => $year > 0 ? "$year-01-01" : '',
        'year'        => $year,
        'doi'         => $work['doi'] ?? null,
        'sdgs'        => $work['sdgs'] ?? [],
        'citations'   => (int)($work['citations'] ?? 0),
        'views'       => (int)($work['views'] ?? 0),
        'downloads'   => 0,
        'impactScore' => round(min(100, 50 + ($work['citations'] ?? 0) * 1.5), 1),
        'status'      => 'Published',
        'abstract'    => $work['abstract'] ?? '',
        'authors'     => $work['authors'] ?? [],
    ];
}

// ── Apply filters ────────────────────────────────────────────────────────────

if ($search) {
    $articles = array_filter($articles, fn($a) =>
        str_contains(strtolower($a['title']), $search) ||
        str_contains(strtolower($a['journal']), $search)
    );
}
if ($status !== 'All') {
    $articles = array_filter($articles, fn($a) => $a['status'] === $status);
}
if ($sdg !== 'All') {
    $articles = array_filter($articles, fn($a) => in_array((int)$sdg, $a['sdgs']));
}

// ── Sort ─────────────────────────────────────────────────────────────────────

$sortMap = ['date' => 'year', 'citations' => 'citations', 'views' => 'views', 'impactScore' => 'impactScore'];
$sortKey = $sortMap[$sort] ?? 'year';

usort($articles, function($a, $b) use ($sortKey, $dir) {
    $cmp = ($a[$sortKey] ?? 0) <=> ($b[$sortKey] ?? 0);
    return $dir === 'asc' ? $cmp : -$cmp;
});

$articles = array_values($articles);

// ── Paginate ─────────────────────────────────────────────────────────────────

$total      = count($articles);
$totalPages = max(1, (int)ceil($total / $limit));
$offset     = ($page - 1) * $limit;
$paginated  = array_slice($articles, $offset, $limit);

echo json_encode([
    'status'     => 'success',
    'orcid'      => $orcid,
    'total'      => $total,
    'page'       => $page,
    'limit'      => $limit,
    'totalPages' => $totalPages,
    'articles'   => $paginated,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
