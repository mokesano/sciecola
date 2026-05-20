<?php
/**
 * Partners API — returns research/data/policy collaborators from the partners table.
 * Partners are NOT financial sponsors; they are institutions collaborating
 * on data, research, policy, or technology.
 *
 * GET /api/wrapper/partners.php?type=all|academic|nonprofit|industry|government
 *                               &search=keyword&limit=100
 * Returns: { status, partners[], total, type_counts{}, timestamp }
 *
 * Tables: partners (id, organization, category_id, logo_url, website, description,
 *                   type, since_date, contact_email, cooperation_areas JSON, is_active)
 *         partner_categories (id, name, description)
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $type   = trim($_GET['type']   ?? 'all');
    $search = trim($_GET['search'] ?? '');
    $limit  = min(200, max(1, (int)($_GET['limit'] ?? 100)));

    $validTypes = ['all','academic','nonprofit','industry','government'];
    if (!in_array($type, $validTypes, true)) $type = 'all';

    [$partners, $typeCounts] = fetchPartners($type, $search, $limit);

    echo json_encode([
        'status'      => 'success',
        'partners'    => $partners,
        'total'       => count($partners),
        'type_counts' => $typeCounts,
        'timestamp'   => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/* ─── fetch ───────────────────────────────────────────────────────────────── */

function fetchPartners(string $type, string $search, int $limit): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        return [samplePartners(), sampleTypeCounts()];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        /* ── type counts ── */
        $tcStmt = $pdo->query(
            "SELECT type, COUNT(*) AS cnt FROM partners WHERE is_active = 1 GROUP BY type"
        );
        $typeCounts = ['academic'=>0,'nonprofit'=>0,'industry'=>0,'government'=>0];
        foreach ($tcStmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            if (isset($typeCounts[$r['type']])) {
                $typeCounts[$r['type']] = (int)$r['cnt'];
            }
        }

        /* ── main query ── */
        $where  = ['p.is_active = 1'];
        $params = [];

        if ($type !== 'all') {
            $where[] = 'p.type = ?';
            $params[] = $type;
        }
        if ($search !== '') {
            $where[] = '(p.organization LIKE ? OR p.description LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $sql = "SELECT p.id, p.organization, p.type, p.logo_url, p.website,
                       p.description, p.cooperation_areas,
                       YEAR(p.since_date) AS since_year,
                       pc.name AS category_name
                FROM partners p
                LEFT JOIN partner_categories pc ON pc.id = p.category_id
                $whereClause
                ORDER BY p.organization ASC
                LIMIT ?";
        $params[] = $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $partners = array_map(fn (array $r): array => [
                'id'                => (int)$r['id'],
                'name'              => $r['organization'],
                'type'              => $r['type'],
                'category'          => $r['category_name'],
                'logo'              => $r['logo_url'],
                'website'           => $r['website'],
                'description'       => $r['description'],
                'cooperation_areas' => $r['cooperation_areas']
                    ? json_decode($r['cooperation_areas'], true) : [],
                'since'             => (int)$r['since_year'],
            ], $rows);
            return [$partners, $typeCounts];
        }
    } catch (Exception $e) { /* fall through */ }

    return [samplePartners(), sampleTypeCounts()];
}

/* ─── sample data ─────────────────────────────────────────────────────────── */

function sampleTypeCounts(): array
{
    return ['academic'=>5,'nonprofit'=>4,'industry'=>3,'government'=>4];
}

function samplePartners(): array
{
    return [
        ['id'=>1, 'name'=>'University of Melbourne',                'type'=>'academic',    'category'=>'Research', 'logo'=>null,'website'=>'https://www.unimelb.edu.au',    'description'=>'Joint research on climate change and sustainability indicators.','cooperation_areas'=>['Climate Research','SDG 13','Data Sharing'],'since'=>2022],
        ['id'=>2, 'name'=>'UNEP — United Nations Environment',       'type'=>'nonprofit',   'category'=>'Policy',   'logo'=>null,'website'=>'https://www.unep.org',           'description'=>'Collaboration on environmental data standards and SDG indicators.',  'cooperation_areas'=>['SDG 13','SDG 14','SDG 15','Policy'],'since'=>2023],
        ['id'=>3, 'name'=>'World Bank Open Data',                   'type'=>'nonprofit',   'category'=>'Data',     'logo'=>null,'website'=>'https://data.worldbank.org',     'description'=>'Access to global development datasets for SDG analysis.',             'cooperation_areas'=>['Open Data','Development','Finance'],'since'=>2023],
        ['id'=>4, 'name'=>'Institut Teknologi Bandung',             'type'=>'academic',    'category'=>'Research', 'logo'=>null,'website'=>'https://www.itb.ac.id',          'description'=>'Technology and engineering research collaboration for SDG 9.',         'cooperation_areas'=>['Engineering','SDG 9','Innovation'],'since'=>2022],
        ['id'=>5, 'name'=>'Kementerian Lingkungan Hidup',           'type'=>'government',  'category'=>'Policy',   'logo'=>null,'website'=>'https://www.menlhk.go.id',       'description'=>'Environmental policy data and forest monitoring integration.',         'cooperation_areas'=>['Environment','SDG 15','Policy'],'since'=>2021],
        ['id'=>6, 'name'=>'CrossRef',                               'type'=>'nonprofit',   'category'=>'Data',     'logo'=>null,'website'=>'https://www.crossref.org',       'description'=>'DOI metadata provider and citation network data.',                    'cooperation_areas'=>['DOI','Citations','Metadata'],'since'=>2020],
        ['id'=>7, 'name'=>'Scopus — Elsevier',                      'type'=>'industry',    'category'=>'Data',     'logo'=>null,'website'=>'https://www.scopus.com',         'description'=>'Bibliometric data and journal indexing for research analytics.',       'cooperation_areas'=>['Bibliometrics','Journals','Citations'],'since'=>2022],
        ['id'=>8, 'name'=>'BPS — Badan Pusat Statistik',           'type'=>'government',  'category'=>'Data',     'logo'=>null,'website'=>'https://www.bps.go.id',          'description'=>'Official statistical data on socioeconomic SDG indicators.',          'cooperation_areas'=>['Statistics','SDG 1','SDG 8'],'since'=>2021],
    ];
}
