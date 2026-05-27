<?php
declare(strict_types=1);

/**
 * @file api/wrapper/institution_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Institution Profile API - Aggregates institution metrics with SDG classification.
 * 
 * Endpoint:
 * GET /api/institution_profile.php?id={institutionId}
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $method        = $_SERVER['REQUEST_METHOD'];
    $institutionId = (int)($_GET['id'] ?? 0);

    if ($method === 'GET') {
        if (!$institutionId) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Institution ID required']);
            exit;
        }
        echo json_encode(getInstitutionProfile($institutionId));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getInstitutionProfile(int $institutionId): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleInstitutionProfile();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $instStmt = $pdo->prepare("
            SELECT i.*, ist.*
            FROM institutions i
            LEFT JOIN institution_stats ist ON ist.institution_id = i.id
            WHERE i.id = ?
        ");
        $instStmt->execute([$institutionId]);
        $inst = $instStmt->fetch(PDO::FETCH_ASSOC);

        if (!$inst) {
            return ['status' => 'error', 'message' => 'Institution not found'];
        }

        $news           = fetchNewsRows($pdo, $institutionId);
        $trends         = fetchTrendRows($pdo, $institutionId);
        $topResearchers = fetchTopResearcherRows($pdo, $institutionId);
        $topPublications = fetchTopPublicationRows($pdo, $institutionId);

        return buildProfileResponse($inst, $news, $trends, $topResearchers, $topPublications);
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleInstitutionProfile();
    }
}

function fetchNewsRows(PDO $pdo, int $institutionId): array {
    $stmt = $pdo->prepare("
        SELECT id, title, description, image_url, category, news_date
        FROM institution_news
        WHERE institution_id = ?
        ORDER BY news_date DESC
        LIMIT 5
    ");
    $stmt->execute([$institutionId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchTrendRows(PDO $pdo, int $institutionId): array {
    $stmt = $pdo->prepare("
        SELECT publication_year, publications_count, citations_count, average_citation
        FROM institution_publication_trend
        WHERE institution_id = ?
        ORDER BY publication_year ASC
    ");
    $stmt->execute([$institutionId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchTopResearcherRows(PDO $pdo, int $institutionId): array {
    $stmt = $pdo->prepare("
        SELECT r.orcid, r.name, r.h_index, r.citation_count
        FROM researchers r
        WHERE r.institution_id = ?
        ORDER BY r.citation_count DESC
        LIMIT 10
    ");
    $stmt->execute([$institutionId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchTopPublicationRows(PDO $pdo, int $institutionId): array {
    $stmt = $pdo->prepare("
        SELECT p.doi, p.title, p.publication_year, p.citation_count
        FROM publications p
        JOIN publication_authors pa ON pa.doi = p.doi
        JOIN researchers r ON r.orcid = pa.orcid
        WHERE r.institution_id = ?
        ORDER BY p.citation_count DESC
        LIMIT 10
    ");
    $stmt->execute([$institutionId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function buildProfileResponse(array $inst, array $news, array $trends, array $topResearchers, array $topPublications): array {
    $sdgFocus = json_decode($inst['sdg_focus'] ?? '[]', true);

    return [
        'status' => 'success',
        'institution' => [
            'id'               => (int)$inst['id'],
            'name'             => $inst['name'],
            'acronym'          => $inst['acronym'],
            'logo'             => $inst['logo_url'] ?? ('https://via.placeholder.com/150?text=' . urlencode($inst['acronym'] ?? 'INST')),
            'type'             => $inst['type'],
            'country'          => $inst['country'],
            'city'             => $inst['city'],
            'website'          => $inst['website_url'],
            'motto'            => $inst['motto'],
            'rector'           => $inst['rector_name'],
            'established_year' => (int)($inst['established_year'] ?? 0),
            'faculties'        => (int)($inst['faculties_count'] ?? 0),
            'students'         => (int)($inst['students_count'] ?? 0),
            'lecturers'        => (int)($inst['lecturers_count'] ?? 0)
        ],
        'statistics' => [
            'publications'                 => (int)($inst['publications_count'] ?? 0),
            'researchers'                  => (int)($inst['researchers_count'] ?? 0),
            'citations'                    => (int)($inst['citations_count'] ?? 0),
            'hIndex'                       => (int)($inst['h_index'] ?? 0),
            'i10Index'                     => (int)($inst['i10_index'] ?? 0),
            'journals'                     => (int)($inst['journals_count'] ?? 0),
            'collaborations'               => (int)($inst['collaborations_count'] ?? 0),
            'average_citations_per_article' => (float)($inst['average_citations_per_article'] ?? 0),
            'sdg_focus'                    => is_array($sdgFocus) ? $sdgFocus : []
        ],
        'publication_trend' => array_map(function ($row) {
            return [
                'year'            => (int)$row['publication_year'],
                'publications'    => (int)$row['publications_count'],
                'citations'       => (int)$row['citations_count'],
                'average_citation' => (int)$row['average_citation']
            ];
        }, $trends),
        'top_researchers' => array_map(function ($row) {
            return [
                'orcid'     => $row['orcid'],
                'name'      => $row['name'],
                'h_index'   => (int)$row['h_index'],
                'citations' => (int)$row['citation_count']
            ];
        }, $topResearchers),
        'top_publications' => array_map(function ($row) {
            return [
                'doi'       => $row['doi'],
                'title'     => $row['title'],
                'year'      => (int)$row['publication_year'],
                'citations' => (int)$row['citation_count']
            ];
        }, $topPublications),
        'news' => array_map(function ($row) {
            return [
                'title'       => $row['title'],
                'description' => substr($row['description'], 0, 200),
                'image'       => $row['image_url'],
                'category'    => $row['category'],
                'date'        => $row['news_date']
            ];
        }, $news),
        'timestamp' => date('c')
    ];
}

function getSampleInstitutionProfile(): array {
    return [
        'status' => 'success',
        'institution' => [
            'id'               => 1,
            'name'             => 'Massachusetts Institute of Technology',
            'acronym'          => 'MIT',
            'logo'             => 'https://logo.clearbit.com/mit.edu',
            'type'             => 'university',
            'country'          => 'United States',
            'city'             => 'Cambridge',
            'website'          => 'https://mit.edu',
            'motto'            => 'Mens et Manus',
            'rector'           => 'Sally Johnson',
            'established_year' => 1861,
            'faculties'        => 5,
            'students'         => 4600,
            'lecturers'        => 1000
        ],
        'statistics' => [
            'publications'                  => 8934,
            'researchers'                   => 1250,
            'citations'                     => 456000,
            'hIndex'                        => 185,
            'i10Index'                      => 1089,
            'journals'                      => 56,
            'collaborations'                => 234,
            'average_citations_per_article' => 51.05,
            'sdg_focus'                     => [4, 7, 9, 11, 13]
        ],
        'publication_trend' => [
            ['year' => 2018, 'publications' => 734,  'citations' => 34560, 'average_citation' => 47],
            ['year' => 2019, 'publications' => 812,  'citations' => 38900, 'average_citation' => 48],
            ['year' => 2020, 'publications' => 956,  'citations' => 42100, 'average_citation' => 44],
            ['year' => 2021, 'publications' => 1089, 'citations' => 48900, 'average_citation' => 45],
            ['year' => 2022, 'publications' => 1245, 'citations' => 54200, 'average_citation' => 44],
            ['year' => 2023, 'publications' => 1234, 'citations' => 52300, 'average_citation' => 42]
        ],
        'top_researchers' => [
            ['orcid' => '0000-0001-1234-5678', 'name' => 'Dr. Sarah Chen',    'h_index' => 52, 'citations' => 12400],
            ['orcid' => '0000-0002-8765-4321', 'name' => 'Prof. Ahmed Hassan', 'h_index' => 48, 'citations' => 11200]
        ],
        'top_publications' => [
            ['doi' => '10.1234/example.1', 'title' => 'Breakthrough in Quantum Computing', 'year' => 2023, 'citations' => 234],
            ['doi' => '10.1234/example.2', 'title' => 'AI and Climate Change Mitigation',  'year' => 2022, 'citations' => 189]
        ],
        'news' => [
            ['title' => 'MIT Launches New Climate Research Center', 'description' => 'MIT announced the opening of its new..', 'image' => 'https://via.placeholder.com/300', 'category' => 'announcement', 'date' => '2024-01-15'],
            ['title' => 'Research Team Wins International Award',   'description' => 'MIT researchers recognized for breakthrough...', 'image' => 'https://via.placeholder.com/300', 'category' => 'achievement',   'date' => '2024-01-10']
        ],
        'timestamp' => date('c')
    ];
}
