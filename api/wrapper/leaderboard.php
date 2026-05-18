<?php
/**
 * Leaderboard API
 * GET /api/leaderboard.php?type=researchers|journals|institutions
 *                          &limit=20&sdg=0-17&country=Indonesia
 * Reads from: researchers, publications, publication_authors,
 *             journals, institutions, work_sdgs
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $type    = in_array($_GET['type'] ?? 'researchers', ['researchers', 'journals', 'institutions'])
               ? $_GET['type'] : 'researchers';
    $limit   = min(50, max(1, (int)($_GET['limit'] ?? 20)));
    $sdg     = (int)($_GET['sdg'] ?? 0);
    $country = trim($_GET['country'] ?? '');

    [$data, $summary, $sdgDist, $countries] = fetchAll($type, $limit, $sdg, $country);

    echo json_encode([
        'status'               => 'success',
        'type'                 => $type,
        'data'                 => $data,
        'summary'              => $summary,
        'sdg_distribution'     => $sdgDist,
        'available_countries'  => $countries,
        'timestamp'            => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/* ─── main fetch ─────────────────────────────────────────────────────────── */

function fetchAll(string $type, int $limit, int $sdg, string $country): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        return [
            getSampleLeaderboard($type, $limit),
            getSampleSummary(),
            getSampleSdgDist(),
            ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Philippines'],
        ];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $data     = fetchLeaderboard($pdo, $type, $limit, $sdg, $country);
        $summary  = fetchSummary($pdo);
        $sdgDist  = fetchSdgDistribution($pdo);
        $countries = fetchCountries($pdo);

        return [$data, $summary, $sdgDist, $countries];

    } catch (Exception $e) {
        return [
            getSampleLeaderboard($type, $limit),
            getSampleSummary(),
            getSampleSdgDist(),
            ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Philippines'],
        ];
    }
}

/* ─── leaderboard rows ───────────────────────────────────────────────────── */

function fetchLeaderboard(PDO $pdo, string $type, int $limit, int $sdg, string $country): array
{
    if ($type === 'researchers') {
        $where  = ['1=1'];
        $params = [];

        if ($sdg >= 1 && $sdg <= 17) {
            $where[] = 'EXISTS (
                SELECT 1 FROM publication_authors pa2
                INNER JOIN work_sdgs ws ON ws.doi = pa2.doi
                WHERE pa2.orcid = r.orcid AND ws.sdg_number = ?
            )';
            $params[] = $sdg;
        }
        if ($country !== '') {
            $where[] = 'r.country = ?';
            $params[] = $country;
        }
        $whereClause = implode(' AND ', $where);

        $sql = "SELECT r.orcid, r.name, r.h_index, r.citation_count, r.country,
                       r.profile_cache_json,
                       i.name AS institution_name,
                       COUNT(DISTINCT pa.doi) AS pub_count
                FROM researchers r
                LEFT JOIN institutions i         ON i.id = r.institution_id
                LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
                WHERE $whereClause
                GROUP BY r.orcid, r.name, r.h_index, r.citation_count,
                         r.country, r.profile_cache_json, i.name
                ORDER BY r.citation_count DESC
                LIMIT ?";
        $params[] = $limit;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $maxCit = max(array_column($rows, 'citation_count')) ?: 1;
            return array_map(function (array $row, int $i) use ($maxCit): array {
                $profile = json_decode($row['profile_cache_json'] ?? '{}', true) ?? [];
                $cit     = (int)$row['citation_count'];
                $pub     = (int)$row['pub_count'];
                $h       = (int)$row['h_index'];
                $impact  = round(
                    0.4 * ($h  / max(1, 30) * 100)
                  + 0.3 * (log($cit + 1) / log($maxCit + 1) * 100)
                  + 0.2 * (log($pub + 1) / log(200) * 100)
                  + 0.1 * min(100, ($profile['collab_count'] ?? 0) * 10),
                    1
                );
                return [
                    'rank'        => $i + 1,
                    'orcid'       => $row['orcid'],
                    'name'        => $row['name'],
                    'institution' => $row['institution_name'] ?? ($profile['affiliation'] ?? ''),
                    'country'     => $row['country'] ?? '',
                    'publications' => $pub,
                    'citations'   => $cit,
                    'h_index'     => $h,
                    'impact'      => min(100.0, max(0.0, $impact)),
                    'avatar'      => $profile['avatar'] ?? null,
                ];
            }, $rows, array_keys($rows));
        }
    }

    if ($type === 'journals') {
        $where  = ['1=1'];
        $params = [];

        if ($sdg >= 1 && $sdg <= 17) {
            $where[] = 'EXISTS (
                SELECT 1 FROM publications p2
                INNER JOIN work_sdgs ws ON ws.doi = p2.doi
                WHERE p2.journal_id = j.id AND ws.sdg_number = ?
            )';
            $params[] = $sdg;
        }
        $whereClause = implode(' AND ', $where);

        $sql = "SELECT j.id, j.title, j.issn, j.cite_score, j.sinta_grade, j.sjr_score,
                       COUNT(DISTINCT p.doi) AS article_count
                FROM journals j
                LEFT JOIN publications p ON p.journal_id = j.id
                WHERE $whereClause
                GROUP BY j.id, j.title, j.issn, j.cite_score, j.sinta_grade, j.sjr_score
                ORDER BY j.cite_score DESC
                LIMIT ?";
        $params[] = $limit;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            return array_map(fn (array $r, int $i): array => [
                'rank'      => $i + 1,
                'name'      => $r['title'],
                'issn'      => $r['issn'],
                'citescore' => round((float)$r['cite_score'], 2),
                'sinta'     => $r['sinta_grade'] ?? null,
                'sjr'       => round((float)$r['sjr_score'], 2),
                'articles'  => (int)$r['article_count'],
            ], $rows, array_keys($rows));
        }
    }

    if ($type === 'institutions') {
        $where  = ['1=1'];
        $params = [];

        if ($sdg >= 1 && $sdg <= 17) {
            $where[] = 'EXISTS (
                SELECT 1 FROM researchers r2
                INNER JOIN publication_authors pa2 ON pa2.orcid = r2.orcid
                INNER JOIN work_sdgs ws ON ws.doi = pa2.doi
                WHERE r2.institution_id = i.id AND ws.sdg_number = ?
            )';
            $params[] = $sdg;
        }
        if ($country !== '') {
            $where[] = 'i.country = ?';
            $params[] = $country;
        }
        $whereClause = implode(' AND ', $where);

        $sql = "SELECT i.id, i.name, i.country,
                       COUNT(DISTINCT r.orcid) AS researcher_count,
                       COUNT(DISTINCT pa.doi)   AS pub_count,
                       COALESCE(SUM(r.citation_count), 0) AS total_citations
                FROM institutions i
                LEFT JOIN researchers r          ON r.institution_id = i.id
                LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
                WHERE $whereClause
                GROUP BY i.id, i.name, i.country
                ORDER BY total_citations DESC
                LIMIT ?";
        $params[] = $limit;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            return array_map(fn (array $r, int $i): array => [
                'rank'         => $i + 1,
                'name'         => $r['name'],
                'country'      => $r['country'] ?? '',
                'researchers'  => (int)$r['researcher_count'],
                'publications' => (int)$r['pub_count'],
                'citations'    => (int)$r['total_citations'],
            ], $rows, array_keys($rows));
        }
    }

    return getSampleLeaderboard($type, $limit);
}

/* ─── summary stats ──────────────────────────────────────────────────────── */

function fetchSummary(PDO $pdo): array
{
    try {
        $r = $pdo->query('SELECT COUNT(*) FROM researchers')->fetchColumn();
        $p = $pdo->query('SELECT COUNT(*) FROM publications')->fetchColumn();
        $c = $pdo->query('SELECT COALESCE(SUM(citation_count),0) FROM researchers')->fetchColumn();
        $j = $pdo->query('SELECT COUNT(*) FROM journals')->fetchColumn();
        $i = $pdo->query('SELECT COUNT(*) FROM institutions')->fetchColumn();
        return [
            'researchers'  => (int)$r,
            'publications' => (int)$p,
            'citations'    => (int)$c,
            'journals'     => (int)$j,
            'institutions' => (int)$i,
        ];
    } catch (Exception $e) {
        return getSampleSummary();
    }
}

/* ─── SDG distribution ───────────────────────────────────────────────────── */

const SDG_NAMES = [
    1=>'No Poverty',2=>'Zero Hunger',3=>'Good Health',4=>'Quality Education',
    5=>'Gender Equality',6=>'Clean Water',7=>'Clean Energy',8=>'Decent Work',
    9=>'Industry & Innovation',10=>'Reduced Inequalities',11=>'Sustainable Cities',
    12=>'Responsible Consumption',13=>'Climate Action',14=>'Life Below Water',
    15=>'Life on Land',16=>'Peace & Justice',17=>'Partnerships',
];

const SDG_COLORS = [
    1=>'#E5243B',2=>'#DDA63A',3=>'#4C9F38',4=>'#C5192D',5=>'#FF3A21',
    6=>'#26BDE2',7=>'#FCC30B',8=>'#A21942',9=>'#FD6925',10=>'#DD1367',
    11=>'#FD9D24',12=>'#BF8B2E',13=>'#3F7E44',14=>'#0A97D9',15=>'#56C02B',
    16=>'#00689D',17=>'#19486A',
];

function fetchSdgDistribution(PDO $pdo): array
{
    try {
        $stmt = $pdo->query(
            'SELECT sdg_number, COUNT(*) AS cnt
             FROM work_sdgs
             GROUP BY sdg_number
             ORDER BY cnt DESC
             LIMIT 8'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($rows)) {
            return array_map(fn (array $r): array => [
                'sdg'   => (int)$r['sdg_number'],
                'name'  => SDG_NAMES[(int)$r['sdg_number']] ?? 'SDG ' . $r['sdg_number'],
                'count' => (int)$r['cnt'],
                'color' => SDG_COLORS[(int)$r['sdg_number']] ?? '#6366f1',
            ], $rows);
        }
    } catch (Exception $e) { /* fall through */ }
    return getSampleSdgDist();
}

/* ─── available countries ────────────────────────────────────────────────── */

function fetchCountries(PDO $pdo): array
{
    try {
        $stmt = $pdo->query(
            'SELECT DISTINCT country FROM researchers
             WHERE country IS NOT NULL AND country <> ""
             ORDER BY country LIMIT 100'
        );
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        return ['Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Philippines'];
    }
}

/* ─── sample data ────────────────────────────────────────────────────────── */

function getSampleSummary(): array
{
    return [
        'researchers'  => 10892,
        'publications' => 98732,
        'citations'    => 421897,
        'journals'     => 1234,
        'institutions' => 567,
    ];
}

function getSampleSdgDist(): array
{
    return [
        ['sdg' => 13, 'name' => 'Climate Action',         'count' => 2841, 'color' => '#3F7E44'],
        ['sdg' =>  4, 'name' => 'Quality Education',      'count' => 2563, 'color' => '#C5192D'],
        ['sdg' =>  3, 'name' => 'Good Health',            'count' => 2234, 'color' => '#4C9F38'],
        ['sdg' =>  7, 'name' => 'Clean Energy',           'count' => 1987, 'color' => '#FCC30B'],
        ['sdg' =>  9, 'name' => 'Industry & Innovation',  'count' => 1756, 'color' => '#FD6925'],
        ['sdg' => 11, 'name' => 'Sustainable Cities',     'count' => 1542, 'color' => '#FD9D24'],
        ['sdg' =>  6, 'name' => 'Clean Water',            'count' => 1321, 'color' => '#26BDE2'],
        ['sdg' => 14, 'name' => 'Life Below Water',       'count' => 1198, 'color' => '#0A97D9'],
    ];
}

function getSampleLeaderboard(string $type, int $limit): array
{
    $data = [
        'researchers' => [
            ['rank'=>1,'orcid'=>'0000-0002-5152-9727','name'=>'Dr. Andi Rahman',    'institution'=>'Universitas Indonesia',        'country'=>'Indonesia',   'publications'=>42,'citations'=>1248,'h_index'=>17,'impact'=>92.4,'avatar'=>null],
            ['rank'=>2,'orcid'=>'0000-0001-6742-5861','name'=>'Dr. Siti Nurhaliza', 'institution'=>'BRIN',                         'country'=>'Indonesia',   'publications'=>38,'citations'=>1102,'h_index'=>15,'impact'=>88.7,'avatar'=>null],
            ['rank'=>3,'orcid'=>'0000-0002-8025-4072','name'=>'Prof. Budi Santoso', 'institution'=>'Institut Teknologi Bandung',   'country'=>'Indonesia',   'publications'=>35,'citations'=> 982,'h_index'=>14,'impact'=>85.1,'avatar'=>null],
            ['rank'=>4,'orcid'=>'0000-0003-1234-5678','name'=>'Dr. Dewi Lestari',   'institution'=>'Universitas Airlangga',        'country'=>'Indonesia',   'publications'=>31,'citations'=> 876,'h_index'=>13,'impact'=>78.6,'avatar'=>null],
            ['rank'=>5,'orcid'=>'0000-0001-7890-1234','name'=>'Prof. Maria Santos', 'institution'=>'University of the Philippines','country'=>'Philippines', 'publications'=>28,'citations'=> 764,'h_index'=>12,'impact'=>72.3,'avatar'=>null],
        ],
        'journals' => [
            ['rank'=>1,'name'=>'Nature Climate Change',         'issn'=>'1758-678X','citescore'=>4.56,'sinta'=>'S1','sjr'=>2.34,'articles'=>87],
            ['rank'=>2,'name'=>'Global Environmental Change',   'issn'=>'0959-3780','citescore'=>3.12,'sinta'=>'S1','sjr'=>1.32,'articles'=>62],
            ['rank'=>3,'name'=>'Journal of Cleaner Production', 'issn'=>'0959-6526','citescore'=>3.21,'sinta'=>'S1','sjr'=>1.45,'articles'=>124],
            ['rank'=>4,'name'=>'Marine Pollution Bulletin',     'issn'=>'0025-326X','citescore'=>2.89,'sinta'=>'S2','sjr'=>0.92,'articles'=>45],
            ['rank'=>5,'name'=>'J. of Environmental Science',  'issn'=>'1001-0742','citescore'=>2.48,'sinta'=>'S2','sjr'=>0.85,'articles'=>68],
        ],
        'institutions' => [
            ['rank'=>1,'name'=>'Universitas Indonesia',      'country'=>'Indonesia','researchers'=>342,'publications'=>1245,'citations'=>18432],
            ['rank'=>2,'name'=>'Institut Teknologi Bandung', 'country'=>'Indonesia','researchers'=>289,'publications'=>1087,'citations'=>15678],
            ['rank'=>3,'name'=>'Universitas Gadjah Mada',   'country'=>'Indonesia','researchers'=>276,'publications'=> 987,'citations'=>14321],
            ['rank'=>4,'name'=>'BRIN',                      'country'=>'Indonesia','researchers'=>198,'publications'=> 876,'citations'=>12456],
            ['rank'=>5,'name'=>'IPB University',             'country'=>'Indonesia','researchers'=>187,'publications'=> 765,'citations'=>11234],
        ],
    ];
    return array_slice($data[$type] ?? [], 0, $limit);
}
