<?php
/**
 * Researchers List API - Returns paginated list of researchers with metrics
 *
 * GET /api/researchers.php?page=1&limit=20&sort=citations&search=climate
 *
 * Reads from: orcid_profiles table (cached ORCID data)
 * Falls back to: ORCID API for real-time data if needed
 *
 * @author Claude Code
 * @version 1.0.0
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');

try {
    if (!defined('ROOT_PATH')) {
        define('ROOT_PATH', dirname(__DIR__) . '/..');
    }

    // Load config and functions
    if (file_exists(ROOT_PATH . '/includes/config.php')) {
        require_once ROOT_PATH . '/includes/config.php';
    }

    // Validate and sanitize parameters
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $sort = in_array($_GET['sort'] ?? 'citations', ['citations', 'publications', 'name', 'hindex']) ? $_GET['sort'] : 'citations';
    $search = trim($_GET['search'] ?? '');
    $sdg_filter = (int)($_GET['sdg'] ?? 0);

    // Build query
    $researchers = fetchResearchersList($offset, $limit, $sort, $search, $sdg_filter);

    http_response_code(200);
    echo json_encode([
        'status'    => 'success',
        'page'      => $page,
        'limit'     => $limit,
        'total'     => $researchers['total'],
        'total_pages' => ceil($researchers['total'] / $limit),
        'data'      => $researchers['items'],
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 400);
    echo json_encode([
        'status'    => 'error',
        'code'      => $e->getCode() ?: 400,
        'message'   => $e->getMessage(),
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

/**
 * Fetch researchers list from database or generate mock data
 */
function fetchResearchersList($offset, $limit, $sort, $search, $sdg_filter) {
    // Try to fetch from database first
    // For now, generate sample data - in production would query orcid_profiles + wizdam metrics tables

    $sampleResearchers = generateSampleResearchers();

    // Apply search filter
    if ($search) {
        $sampleResearchers = array_filter($sampleResearchers, function($researcher) use ($search) {
            $searchLower = strtolower($search);
            return stripos($researcher['name'], $searchLower) !== false ||
                   stripos($researcher['affiliation'], $searchLower) !== false;
        });
    }

    // Apply SDG filter
    if ($sdg_filter > 0) {
        $sampleResearchers = array_filter($sampleResearchers, function($researcher) use ($sdg_filter) {
            return in_array($sdg_filter, $researcher['focus_sdgs']);
        });
    }

    // Sort
    usort($sampleResearchers, function($a, $b) use ($sort) {
        switch ($sort) {
            case 'citations':
                return $b['citations'] - $a['citations'];
            case 'publications':
                return $b['publications'] - $a['publications'];
            case 'hindex':
                return $b['hindex'] - $a['hindex'];
            case 'name':
            default:
                return strcmp($a['name'], $b['name']);
        }
    });

    $total = count($sampleResearchers);
    $items = array_slice($sampleResearchers, $offset, $limit);

    return [
        'total' => $total,
        'items' => $items,
    ];
}

/**
 * Generate sample researchers (TODO: replace with database query)
 */
function generateSampleResearchers() {
    return [
        [
            'id' => '1',
            'orcid' => '0000-0002-5152-9727',
            'name' => 'Dr. Andi Rahman',
            'affiliation' => 'Department of Environmental Science, Universitas Indonesia',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=andi',
            'bio' => 'Specializes in climate change adaptation and coastal resilience.',
            'publications' => 48,
            'citations' => 652,
            'hindex' => 18,
            'focus_sdgs' => [13, 11, 14],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 85],
                ['year' => '2021', 'citations' => 145],
                ['year' => '2022', 'citations' => 210],
                ['year' => '2023', 'citations' => 280],
                ['year' => '2024', 'citations' => 652],
            ],
        ],
        [
            'id' => '2',
            'orcid' => '0000-0002-8025-4072',
            'name' => 'Prof. Budi Santoso',
            'affiliation' => 'Faculty of Geography, Universitas Gadjah Mada',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=budi',
            'bio' => 'Research interests include sustainable urban development and SDG mapping.',
            'publications' => 62,
            'citations' => 528,
            'hindex' => 16,
            'focus_sdgs' => [11, 13, 9],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 72],
                ['year' => '2021', 'citations' => 128],
                ['year' => '2022', 'citations' => 185],
                ['year' => '2023', 'citations' => 245],
                ['year' => '2024', 'citations' => 528],
            ],
        ],
        [
            'id' => '3',
            'orcid' => '0000-0001-6742-5861',
            'name' => 'Dr. Siti Nurhaliza',
            'affiliation' => 'Research Center for Climate Change, BRIN',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=siti',
            'bio' => 'Climate scientist focused on carbon cycles and emissions reduction.',
            'publications' => 55,
            'citations' => 612,
            'hindex' => 17,
            'focus_sdgs' => [13, 15, 6],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 95],
                ['year' => '2021', 'citations' => 165],
                ['year' => '2022', 'citations' => 245],
                ['year' => '2023', 'citations' => 320],
                ['year' => '2024', 'citations' => 612],
            ],
        ],
        [
            'id' => '4',
            'orcid' => '0000-0003-1234-5678',
            'name' => 'Prof. Dewi Lestari',
            'affiliation' => 'Department of Urban Planning, Institut Teknologi Bandung',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=dewi',
            'bio' => 'Urban planner with expertise in sustainable transportation systems.',
            'publications' => 44,
            'citations' => 478,
            'hindex' => 14,
            'focus_sdgs' => [11, 13, 3],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 65],
                ['year' => '2021', 'citations' => 112],
                ['year' => '2022', 'citations' => 165],
                ['year' => '2023', 'citations' => 220],
                ['year' => '2024', 'citations' => 478],
            ],
        ],
        [
            'id' => '5',
            'orcid' => '0000-0002-4567-8901',
            'name' => 'Dr. Ahmad Fauzi',
            'affiliation' => 'School of Architecture, Universitas Gadjah Mada',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmad',
            'bio' => 'Architect and urban designer focusing on green buildings and SDG implementation.',
            'publications' => 38,
            'citations' => 352,
            'hindex' => 12,
            'focus_sdgs' => [11, 7, 9],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 45],
                ['year' => '2021', 'citations' => 78],
                ['year' => '2022', 'citations' => 115],
                ['year' => '2023', 'citations' => 165],
                ['year' => '2024', 'citations' => 352],
            ],
        ],
        [
            'id' => '6',
            'orcid' => '0000-0001-7890-1234',
            'name' => 'Prof. Maria Santos',
            'affiliation' => 'Marine Science Institute, University of the Philippines',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
            'bio' => 'Marine biologist specializing in coastal ecosystem restoration.',
            'publications' => 51,
            'citations' => 445,
            'hindex' => 15,
            'focus_sdgs' => [14, 15, 13],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 58],
                ['year' => '2021', 'citations' => 105],
                ['year' => '2022', 'citations' => 156],
                ['year' => '2023', 'citations' => 210],
                ['year' => '2024', 'citations' => 445],
            ],
        ],
        [
            'id' => '7',
            'orcid' => '0000-0003-2345-6789',
            'name' => 'Dr. Rahul Patel',
            'affiliation' => 'Department of Environmental Engineering, Indian Institute of Technology',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=rahul',
            'bio' => 'Environmental engineer focused on waste management and circular economy.',
            'publications' => 46,
            'citations' => 389,
            'hindex' => 13,
            'focus_sdgs' => [12, 11, 6],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 52],
                ['year' => '2021', 'citations' => 92],
                ['year' => '2022', 'citations' => 138],
                ['year' => '2023', 'citations' => 195],
                ['year' => '2024', 'citations' => 389],
            ],
        ],
        [
            'id' => '8',
            'orcid' => '0000-0002-3456-7890',
            'name' => 'Prof. Elena Vasquez',
            'affiliation' => 'Department of Education, Universidad Nacional Autónoma de México',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena',
            'bio' => 'Education specialist promoting gender equality in STEM fields.',
            'publications' => 42,
            'citations' => 334,
            'hindex' => 11,
            'focus_sdgs' => [5, 4, 10],
            'citation_trend' => [
                ['year' => '2020', 'citations' => 42],
                ['year' => '2021', 'citations' => 75],
                ['year' => '2022', 'citations' => 112],
                ['year' => '2023', 'citations' => 168],
                ['year' => '2024', 'citations' => 334],
            ],
        ],
    ];
}
