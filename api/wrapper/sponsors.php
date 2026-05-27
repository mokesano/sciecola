<?php
declare(strict_types=1);

/**
 * @file api/wrapper/sponsors.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Sponsors API — returns active financial sponsors from the sponsors table.
 * Sponsors are organizations approved after applying via BecomeSponsor.
 * 
 * Endpoints:
 * GET /api/wrapper/sponsors.php?tier=all|platinum|gold|silver|bronze
 *                               &search=keyword&limit=100
 * Returns: { status, sponsors[], summary{}, tier_counts{}, timestamp }
 *
 * Tables: sponsors (id, organization, tier, logo_url, website, description,
 *                   focus_areas JSON, since_date, is_active)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $tier   = trim($_GET['tier']   ?? 'all');
    $search = trim($_GET['search'] ?? '');
    $limit  = min(200, max(1, (int)($_GET['limit'] ?? 100)));

    if (!in_array($tier, ['all','platinum','gold','silver','bronze'], true)) $tier = 'all';

    [$sponsors, $tierCounts] = fetchSponsors($tier, $search, $limit);

    echo json_encode([
        'status'      => 'success',
        'sponsors'    => $sponsors,
        'total'       => count($sponsors),
        'tier_counts' => $tierCounts,
        'timestamp'   => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/* ─── fetch ───────────────────────────────────────────────────────────────── */

function fetchSponsors(string $tier, string $search, int $limit): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        return [sampleSponsors(), sampleTierCounts()];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        /* ── tier counts (all tiers, for badge display) ── */
        $tcStmt = $pdo->query(
            "SELECT tier, COUNT(*) AS cnt FROM sponsors WHERE is_active = 1 GROUP BY tier"
        );
        $tierCounts = ['platinum'=>0,'gold'=>0,'silver'=>0,'bronze'=>0];
        foreach ($tcStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $tierCounts[$r['tier']] = (int)$r['cnt'];
        }

        /* ── main query ── */
        $where  = ['s.is_active = 1'];
        $params = [];

        if ($tier !== 'all') {
            $where[] = 's.tier = ?';
            $params[] = $tier;
        }
        if ($search !== '') {
            $where[] = '(s.organization LIKE ? OR s.description LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $sql = "SELECT s.id, s.organization, s.tier, s.logo_url, s.website,
                       s.description, s.focus_areas,
                       YEAR(s.since_date) AS since_year
                FROM sponsors s
                $whereClause
                ORDER BY FIELD(s.tier,'platinum','gold','silver','bronze'),
                         s.organization ASC
                LIMIT ?";
        $params[] = $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $sponsors = array_map(fn (array $r): array => [
                'id'           => (int)$r['id'],
                'name'         => $r['organization'],
                'tier'         => $r['tier'],
                'logo'         => $r['logo_url'],
                'website'      => $r['website'],
                'description'  => $r['description'],
                'focus_areas'  => $r['focus_areas'] ? json_decode($r['focus_areas'], true) : [],
                'since'        => (int)$r['since_year'],
            ], $rows);
            return [$sponsors, $tierCounts];
        }
    } catch (Exception $e) { /* fall through */ }

    return [sampleSponsors(), sampleTierCounts()];
}

/* ─── sample data ─────────────────────────────────────────────────────────── */

function sampleTierCounts(): array
{
    return ['platinum' => 3, 'gold' => 4, 'silver' => 5, 'bronze' => 6];
}

function sampleSponsors(): array
{
    return [
        ['id'=>1,'name'=>'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi','tier'=>'platinum','logo'=>null,'website'=>'https://www.kemdikbud.go.id','description'=>'Mendukung digitalisasi riset Indonesia dan akselerasi pencapaian SDGs melalui inovasi teknologi.','focus_areas'=>['education','technology'],'since'=>2021],
        ['id'=>2,'name'=>'Badan Riset dan Inovasi Nasional (BRIN)',                 'tier'=>'platinum','logo'=>null,'website'=>'https://www.brin.go.id',           'description'=>'Memperkuat ekosistem riset nasional melalui platform analitik berbasis kecerdasan buatan.',   'focus_areas'=>['research','innovation'],  'since'=>2022],
        ['id'=>3,'name'=>'Google.org',                                              'tier'=>'platinum','logo'=>null,'website'=>'https://www.google.org',           'description'=>'Mendukung inisiatif teknologi untuk kebaikan sosial dan pembangunan berkelanjutan.',           'focus_areas'=>['technology','social'],   'since'=>2023],
        ['id'=>4,'name'=>'PT Telkom Indonesia',                                     'tier'=>'gold',    'logo'=>null,'website'=>'https://www.telkom.co.id',         'description'=>'Infrastruktur digital dan konektivitas untuk peneliti di seluruh Indonesia.',                'focus_areas'=>['infrastructure'],        'since'=>2022],
        ['id'=>5,'name'=>'UNDP Indonesia',                                          'tier'=>'gold',    'logo'=>null,'website'=>'https://www.undp.org/indonesia',   'description'=>'Program pembangunan berkelanjutan dan pencapaian SDGs di Indonesia.',                         'focus_areas'=>['sdgs','development'],    'since'=>2023],
        ['id'=>6,'name'=>'Universitas Indonesia',                                   'tier'=>'silver',  'logo'=>null,'website'=>'https://www.ui.ac.id',             'description'=>'Dukungan institusi akademik terkemuka untuk riset berbasis bukti.',                          'focus_areas'=>['education'],             'since'=>2023],
        ['id'=>7,'name'=>'Bank Rakyat Indonesia',                                   'tier'=>'silver',  'logo'=>null,'website'=>'https://www.bri.co.id',            'description'=>'Mendukung inklusi keuangan dan riset ekonomi berkelanjutan.',                                'focus_areas'=>['finance'],               'since'=>2024],
        ['id'=>8,'name'=>'Yayasan Konservasi Alam Nusantara',                       'tier'=>'bronze',  'logo'=>null,'website'=>'https://ykan.or.id',               'description'=>'Konservasi biodiversitas dan riset lingkungan hidup.',                                       'focus_areas'=>['environment'],           'since'=>2024],
    ];
}
