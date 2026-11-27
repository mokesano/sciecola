<?php
declare(strict_types=1);

/**
 * @file api/wrapper/my_articles.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief My Articles API
 * Returns the articles from the logged-in researcher's ORCID profile.
 * 
 * Endpoints:
 * GET /api/my_articles.php?orcid=0000-0002-...&page=1&limit=10&search=&status=&sdg=&sort=date&dir=desc
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
if (!defined('DB_DATABASE')) require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

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

// ── Ambil daftar karya lewat ResearcherProfileService ───────────────────────
// (database dulu, lalu mesin SDG lokal). Dulu file ini membaca cache/orcid_<orcid>.json
// yang tidak pernah ada, lalu me-require researcher_profile.php di dalam fungsi.
@set_time_limit(90);
ob_start();
try {
    $result = \Sciecola\Sdg\ResearcherProfileService::build($orcid, ['with_impact' => false]);
    ob_end_clean();
} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data artikel: ' . $e->getMessage()]);
    exit;
}
$works = $result['works'] ?? [];

// ── Build article objects ────────────────────────────────────────────────────
$articles = [];
foreach ($works as $i => $work) {
    $year  = (int)($work['year'] ?? 0);
    $cites = (int)($work['cited_by_count'] ?? $work['citations'] ?? 0);
    $sdgs  = array_values(array_filter(
        array_map(fn($s) => (int)preg_replace('/[^0-9]/', '', (string)$s), $work['sdgs'] ?? []),
        fn($n) => $n >= 1 && $n <= 17
    ));
    $articles[] = [
        'id'          => $i + 1,
        'title'       => $work['title'] ?? '',
        'journal'     => $work['journal'] ?? '',
        'date'        => $year > 0 ? "$year-01-01" : '',
        'year'        => $year,
        'doi'         => $work['doi'] ?? null,
        'sdgs'        => $sdgs,
        'citations'   => $cites,
        'views'       => 0,
        'downloads'   => 0,
        'impactScore' => round(min(100, 50 + $cites * 1.5), 1),
        'status'      => 'Published',
        'abstract'    => $work['abstract'] ?? '',
        'authors'     => array_map(fn($c) => is_array($c) ? ($c['name'] ?? '') : (string)$c, $work['contributors'] ?? $work['authors'] ?? []),
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
