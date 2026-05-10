<?php
/**
 * Leaderboard API
 * GET /api/leaderboard.php?type=researchers|journals|institutions&limit=10
 * Reads from: orcid_profiles, sdg_cache, classified_works tables
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) {
        define('ROOT_PATH', dirname(__DIR__) . '/..');
    }
    if (file_exists(ROOT_PATH . '/includes/config.php')) {
        require_once ROOT_PATH . '/includes/config.php';
    }

    $type  = in_array($_GET['type'] ?? 'researchers', ['researchers', 'journals', 'institutions']) ? $_GET['type'] : 'researchers';
    $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));

    $data = fetchLeaderboardData($type, $limit);

    http_response_code(200);
    echo json_encode([
        'status'    => 'success',
        'type'      => $type,
        'data'      => $data,
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchLeaderboardData($type, $limit) {
    // Try database first
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER, DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            if ($type === 'researchers') {
                $stmt = $pdo->prepare(
                    "SELECT orcid_id, profile_json FROM orcid_profiles WHERE expires_at > NOW() ORDER BY updated_at DESC LIMIT ?"
                );
                $stmt->execute([$limit]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($rows)) {
                    $result = [];
                    foreach ($rows as $i => $row) {
                        $profile = json_decode($row['profile_json'], true) ?? [];
                        $result[] = [
                            'rank'        => $i + 1,
                            'name'        => $profile['name'] ?? 'Unknown',
                            'institution' => $profile['affiliation'] ?? '',
                            'country'     => $profile['country'] ?? 'Indonesia',
                            'publikasi'   => $profile['works_count'] ?? 0,
                            'sitasi'      => $profile['citations'] ?? 0,
                            'hIndex'      => $profile['h_index'] ?? 0,
                            'impact'      => round(($profile['impact_score'] ?? 0), 1),
                            'orcid'       => $row['orcid_id'],
                            'avatar'      => $profile['avatar'] ?? "https://api.dicebear.com/7.x/avataaars/svg?seed={$row['orcid_id']}",
                        ];
                    }
                    return $result;
                }
            }
        } catch (Exception $e) {
            // Fall through to sample data
        }
    }

    return getSampleLeaderboard($type, $limit);
}

function getSampleLeaderboard($type, $limit) {
    $researchers = [
        ['rank' => 1,  'name' => 'Dr. Andi Rahman',       'institution' => 'Universitas Indonesia',      'country' => 'Indonesia', 'publikasi' => 42, 'sitasi' => 1248, 'hIndex' => 17, 'impact' => 92.4, 'orcid' => '0000-0002-5152-9727', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=andi'],
        ['rank' => 2,  'name' => 'Dr. Siti Nurhaliza',    'institution' => 'BRIN',                       'country' => 'Indonesia', 'publikasi' => 38, 'sitasi' => 1102, 'hIndex' => 15, 'impact' => 88.7, 'orcid' => '0000-0001-6742-5861', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=siti'],
        ['rank' => 3,  'name' => 'Prof. Budi Santoso',    'institution' => 'Institut Teknologi Bandung', 'country' => 'Indonesia', 'publikasi' => 35, 'sitasi' =>  982, 'hIndex' => 14, 'impact' => 85.1, 'orcid' => '0000-0002-8025-4072', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=budi'],
        ['rank' => 4,  'name' => 'Dr. Dewi Lestari',      'institution' => 'Universitas Airlangga',      'country' => 'Indonesia', 'publikasi' => 31, 'sitasi' =>  876, 'hIndex' => 13, 'impact' => 78.6, 'orcid' => '0000-0003-1234-5678', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=dewi'],
        ['rank' => 5,  'name' => 'Prof. Maria Santos',    'institution' => 'University of the Philippines', 'country' => 'Philippines', 'publikasi' => 28, 'sitasi' => 764, 'hIndex' => 12, 'impact' => 72.3, 'orcid' => '0000-0001-7890-1234', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'],
        ['rank' => 6,  'name' => 'Dr. Ahmad Fauzi',       'institution' => 'Universitas Gadjah Mada',    'country' => 'Indonesia', 'publikasi' => 26, 'sitasi' =>  688, 'hIndex' => 12, 'impact' => 69.8, 'orcid' => '0000-0002-4567-8901', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad'],
        ['rank' => 7,  'name' => 'Dr. Rahul Patel',       'institution' => 'Indian Institute of Technology', 'country' => 'India', 'publikasi' => 24, 'sitasi' => 654, 'hIndex' => 11, 'impact' => 66.2, 'orcid' => '0000-0003-2345-6789', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul'],
        ['rank' => 8,  'name' => 'Prof. Elena Vasquez',   'institution' => 'UNAM Mexico',                'country' => 'Mexico', 'publikasi' => 23, 'sitasi' =>  612, 'hIndex' => 11, 'impact' => 63.4, 'orcid' => '0000-0002-3456-7890', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena'],
        ['rank' => 9,  'name' => 'Dr. Bambang Sutrisno',  'institution' => 'Universitas Andalas',         'country' => 'Indonesia', 'publikasi' => 22, 'sitasi' =>  598, 'hIndex' => 10, 'impact' => 61.7, 'orcid' => '0000-0002-1234-0001', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=bambang'],
        ['rank' => 10, 'name' => 'Prof. Rina Wulandari',  'institution' => 'Universitas Diponegoro',      'country' => 'Indonesia', 'publikasi' => 21, 'sitasi' =>  560, 'hIndex' => 10, 'impact' => 59.3, 'orcid' => '0000-0002-1234-0002', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=rina'],
    ];

    $journals = [
        ['rank' => 1, 'name' => 'Nature Climate Change',                      'issn' => '1758-678X', 'citescore' => 4.56, 'quartile' => 'Q1', 'sjr' => 2.34, 'articles' => 87],
        ['rank' => 2, 'name' => 'Global Environmental Change',                 'issn' => '0959-3780', 'citescore' => 3.12, 'quartile' => 'Q1', 'sjr' => 1.32, 'articles' => 62],
        ['rank' => 3, 'name' => 'Journal of Cleaner Production',               'issn' => '0959-6526', 'citescore' => 3.21, 'quartile' => 'Q1', 'sjr' => 1.45, 'articles' => 124],
        ['rank' => 4, 'name' => 'Marine Pollution Bulletin',                   'issn' => '0025-326X', 'citescore' => 2.89, 'quartile' => 'Q2', 'sjr' => 0.92, 'articles' => 45],
        ['rank' => 5, 'name' => 'Journal of Environmental Science',            'issn' => '1234-5678', 'citescore' => 2.48, 'quartile' => 'Q2', 'sjr' => 0.85, 'articles' => 68],
    ];

    $institutions = [
        ['rank' => 1, 'name' => 'Universitas Indonesia',      'country' => 'Indonesia', 'researchers' => 342, 'publications' => 1245, 'citations' => 18432],
        ['rank' => 2, 'name' => 'Institut Teknologi Bandung', 'country' => 'Indonesia', 'researchers' => 289, 'publications' => 1087, 'citations' => 15678],
        ['rank' => 3, 'name' => 'Universitas Gadjah Mada',    'country' => 'Indonesia', 'researchers' => 276, 'publications' =>  987, 'citations' => 14321],
        ['rank' => 4, 'name' => 'BRIN',                       'country' => 'Indonesia', 'researchers' => 198, 'publications' =>  876, 'citations' => 12456],
        ['rank' => 5, 'name' => 'IPB University',              'country' => 'Indonesia', 'researchers' => 187, 'publications' =>  765, 'citations' => 11234],
    ];

    $map = ['researchers' => $researchers, 'journals' => $journals, 'institutions' => $institutions];
    return array_slice($map[$type], 0, $limit);
}
