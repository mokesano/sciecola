<?php
declare(strict_types=1);

/**
 * @file api/wrapper/institutions.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Institutions List API.
 * 
 * Endpoint:
 * GET /api/institutions?country=&type=&search=&sort=&limit=50
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        echo json_encode(getInstitutions());
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getInstitutions(): array {
    $country = trim($_GET['country'] ?? '');
    $type = trim($_GET['type'] ?? '');
    $search = trim($_GET['search'] ?? '');
    $sort = $_GET['sort'] ?? 'publications';
    $limit = (int)($_GET['limit'] ?? 50);

    // DoS protection: cap limit
    if ($limit > 500) $limit = 500;
    if ($limit < 1) $limit = 1;

    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleInstitutions();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where = [];
        $params = [];

        if ($country !== '') {
            $where[] = 'i.country = ?';
            $params[] = $country;
        }

        if ($type !== '') {
            $where[] = 'i.type = ?';
            $params[] = $type;
        }

        if ($search !== '') {
            $where[] = '(i.name LIKE ? OR i.acronym LIKE ?)';
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $orderBy = match($sort) {
            'citations' => 'ist.citations_count DESC',
            'researchers' => 'ist.researchers_count DESC',
            'hindex' => 'ist.h_index DESC',
            default => 'ist.publications_count DESC'
        };

        $sql = "SELECT
                    i.id, i.name, i.acronym, i.country, i.city, i.website_url,
                    i.logo_url, i.type, i.established_year, i.rector_name,
                    i.faculties_count, i.students_count, i.lecturers_count,
                    ist.publications_count, ist.researchers_count, ist.citations_count,
                    ist.h_index, ist.i10_index, ist.journals_count, ist.collaborations_count,
                    ist.sdg_focus, ist.last_publication_year
                FROM institutions i
                LEFT JOIN institution_stats ist ON ist.institution_id = i.id
                $whereClause
                ORDER BY $orderBy
                LIMIT $limit";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $institutions = array_map(function ($row) {
            $sdgFocus = json_decode($row['sdg_focus'] ?? '[]', true);
            return [
                'id' => (int)$row['id'],
                'name' => $row['name'],
                'acronym' => $row['acronym'],
                'country' => $row['country'],
                'city' => $row['city'],
                'logo' => $row['logo_url'] ?? ('https://via.placeholder.com/150?text=' . urlencode($row['acronym'] ?? 'INST')),
                'type' => $row['type'],
                'established_year' => (int)($row['established_year'] ?? 0),
                'rector' => $row['rector_name'],
                'website' => $row['website_url'],
                'publications' => (int)($row['publications_count'] ?? 0),
                'researchers' => (int)($row['researchers_count'] ?? 0),
                'citations' => (int)($row['citations_count'] ?? 0),
                'hIndex' => (int)($row['h_index'] ?? 0),
                'i10Index' => (int)($row['i10_index'] ?? 0),
                'journals' => (int)($row['journals_count'] ?? 0),
                'collaborations' => (int)($row['collaborations_count'] ?? 0),
                'sdgs' => is_array($sdgFocus) ? $sdgFocus : [],
                'faculties' => (int)($row['faculties_count'] ?? 0),
                'students' => (int)($row['students_count'] ?? 0),
                'lecturers' => (int)($row['lecturers_count'] ?? 0)
            ];
        }, $rows);

        return [
            'status' => 'success',
            'institutions' => $institutions,
            'total' => count($institutions),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleInstitutions();
    }
}

function getSampleInstitutions(): array {
    return [
        'status' => 'success',
        'institutions' => [
            ['id' => 1, 'name' => 'Massachusetts Institute of Technology', 'acronym' => 'MIT', 'country' => 'United States', 'city' => 'Cambridge', 'logo' => 'https://logo.clearbit.com/mit.edu', 'type' => 'university', 'established_year' => 1861, 'rector' => 'Sally Johnson', 'website' => 'https://mit.edu', 'publications' => 8934, 'researchers' => 1250, 'citations' => 456000, 'hIndex' => 185, 'i10Index' => 1089, 'journals' => 56, 'collaborations' => 234, 'sdgs' => [4, 7, 9, 11, 13], 'faculties' => 5, 'students' => 4600, 'lecturers' => 1000],
            ['id' => 2, 'name' => 'University of Oxford', 'acronym' => 'OXFORD', 'country' => 'United Kingdom', 'city' => 'Oxford', 'logo' => 'https://logo.clearbit.com/ox.ac.uk', 'type' => 'university', 'established_year' => 1096, 'rector' => 'Andrew Hamilton', 'website' => 'https://ox.ac.uk', 'publications' => 12450, 'researchers' => 1800, 'citations' => 580000, 'hIndex' => 195, 'i10Index' => 1234, 'journals' => 78, 'collaborations' => 312, 'sdgs' => [1, 3, 5, 10, 16], 'faculties' => 16, 'students' => 24500, 'lecturers' => 2500],
            ['id' => 3, 'name' => 'University of Tokyo', 'acronym' => 'UTokyo', 'country' => 'Japan', 'city' => 'Tokyo', 'logo' => 'https://logo.clearbit.com/u-tokyo.ac.jp', 'type' => 'university', 'established_year' => 1877, 'rector' => 'Teruo Fujii', 'website' => 'https://u-tokyo.ac.jp', 'publications' => 7823, 'researchers' => 980, 'citations' => 389000, 'hIndex' => 172, 'i10Index' => 945, 'journals' => 45, 'collaborations' => 187, 'sdgs' => [2, 6, 12, 13, 14], 'faculties' => 10, 'students' => 28000, 'lecturers' => 1200]
        ],
        'total' => 3,
        'timestamp' => date('c')
    ];
}
