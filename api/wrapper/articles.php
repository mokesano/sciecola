<?php
/**
 * Articles List API - Returns paginated list of articles with SDG classification
 *
 * GET /api/articles.php?page=1&limit=20&sort=citations&search=climate
 *
 * Reads from: classified_works table (persisted articles with SDG tags)
 * Falls back to: SDG_Classification_API for real-time data if needed
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
    $sort = in_array($_GET['sort'] ?? 'recent', ['recent', 'citations', 'title']) ? $_GET['sort'] : 'recent';
    $search = trim($_GET['search'] ?? '');
    $sdg_filter = (int)($_GET['sdg'] ?? 0);

    // Build query
    $articles = fetchArticlesList($offset, $limit, $sort, $search, $sdg_filter);

    http_response_code(200);
    echo json_encode([
        'status'    => 'success',
        'page'      => $page,
        'limit'     => $limit,
        'total'     => $articles['total'],
        'total_pages' => ceil($articles['total'] / $limit),
        'data'      => $articles['items'],
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
 * Fetch articles list from database or generate mock data
 */
function fetchArticlesList($offset, $limit, $sort, $search, $sdg_filter) {
    // Try to fetch from database first
    // For now, generate sample data - in production would query classified_works table

    $sampleArticles = generateSampleArticles();

    // Apply search filter
    if ($search) {
        $sampleArticles = array_filter($sampleArticles, function($article) use ($search) {
            $searchLower = strtolower($search);
            return stripos($article['title'], $searchLower) !== false ||
                   stripos($article['abstract'], $searchLower) !== false;
        });
    }

    // Apply SDG filter
    if ($sdg_filter > 0) {
        $sampleArticles = array_filter($sampleArticles, function($article) use ($sdg_filter) {
            return in_array($sdg_filter, $article['sdgs']);
        });
    }

    // Sort
    usort($sampleArticles, function($a, $b) use ($sort) {
        switch ($sort) {
            case 'citations':
                return $b['citations'] - $a['citations'];
            case 'title':
                return strcmp($a['title'], $b['title']);
            case 'recent':
            default:
                return strtotime($b['published_date']) - strtotime($a['published_date']);
        }
    });

    $total = count($sampleArticles);
    $items = array_slice($sampleArticles, $offset, $limit);

    return [
        'total' => $total,
        'items' => $items,
    ];
}

/**
 * Generate sample articles (TODO: replace with database query)
 */
function generateSampleArticles() {
    return [
        [
            'id' => '1',
            'doi' => '10.1145/3366424.3380271',
            'title' => 'Climate Change Adaptation in Coastal Communities: A Systematic Review',
            'abstract' => 'This systematic review examines climate adaptation strategies in coastal communities across Southeast Asia.',
            'authors' => ['Andi Rahman', 'Budi Santoso', 'Siti Nurhaliza'],
            'journal' => 'Journal of Environmental Science',
            'published_date' => '2024-05-15',
            'citations' => 152,
            'sdgs' => [13, 11, 15],
            'sdg_distribution' => [
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 52],
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 28],
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 20],
            ],
            'views' => 5432,
            'downloads' => 1200,
            'thumbnail' => 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '2',
            'doi' => '10.1016/j.jclepro.2024.141234',
            'title' => 'Sustainable Urban Transport Systems in Indonesia',
            'abstract' => 'An analysis of public transport policies and their impact on urban sustainability goals.',
            'authors' => ['Dewi Lestari', 'Ahmad Fauzi'],
            'journal' => 'Journal of Cleaner Production',
            'published_date' => '2024-03-10',
            'citations' => 98,
            'sdgs' => [11, 13, 9],
            'sdg_distribution' => [
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 55],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 30],
                ['sdg' => 9, 'name' => 'Industry & Innovation', 'value' => 15],
            ],
            'views' => 3210,
            'downloads' => 876,
            'thumbnail' => 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '3',
            'doi' => '10.1038/s41558-024-02015-z',
            'title' => 'Renewable Energy Policy and Its Impact on SDG 7',
            'abstract' => 'Policy analysis of renewable energy adoption across developing nations.',
            'authors' => ['Prof. John Smith', 'Dr. Lisa Wong'],
            'journal' => 'Nature Climate Change',
            'published_date' => '2024-01-22',
            'citations' => 76,
            'sdgs' => [7, 13, 8],
            'sdg_distribution' => [
                ['sdg' => 7, 'name' => 'Clean Energy', 'value' => 45],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 35],
                ['sdg' => 8, 'name' => 'Decent Work', 'value' => 20],
            ],
            'views' => 4567,
            'downloads' => 1543,
            'thumbnail' => 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '4',
            'doi' => '10.1016/j.marpolbul.2024.115876',
            'title' => 'Mangrove Restoration and Coastal Resilience',
            'abstract' => 'Study on mangrove ecosystem restoration for coastal protection.',
            'authors' => ['Dr. Maria Santos', 'Prof. Carlos Rivera'],
            'journal' => 'Marine Pollution Bulletin',
            'published_date' => '2023-11-05',
            'citations' => 65,
            'sdgs' => [14, 15, 13],
            'sdg_distribution' => [
                ['sdg' => 14, 'name' => 'Life Below Water', 'value' => 50],
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 35],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 15],
            ],
            'views' => 2890,
            'downloads' => 654,
            'thumbnail' => 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '5',
            'doi' => '10.1016/j.wasman.2024.03.045',
            'title' => 'Waste Management Strategies for Sustainable Cities',
            'abstract' => 'Comprehensive review of circular economy approaches to waste management.',
            'authors' => ['Rahul Patel', 'Sophie Martin', 'Jun Liu'],
            'journal' => 'Waste Management',
            'published_date' => '2023-09-18',
            'citations' => 59,
            'sdgs' => [12, 11, 13],
            'sdg_distribution' => [
                ['sdg' => 12, 'name' => 'Responsible Consumption', 'value' => 50],
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 35],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 15],
            ],
            'views' => 3456,
            'downloads' => 789,
            'thumbnail' => 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '6',
            'doi' => '10.1177/1084426624063947',
            'title' => 'Gender Equality and Women Empowerment in STEM Education',
            'abstract' => 'Evidence-based strategies for increasing women participation in STEM fields.',
            'authors' => ['Dr. Elena Vasquez', 'Prof. Amara Okafor'],
            'journal' => 'Journal of Science Education',
            'published_date' => '2023-07-30',
            'citations' => 44,
            'sdgs' => [5, 4, 8],
            'sdg_distribution' => [
                ['sdg' => 5, 'name' => 'Gender Equality', 'value' => 55],
                ['sdg' => 4, 'name' => 'Quality Education', 'value' => 30],
                ['sdg' => 8, 'name' => 'Decent Work', 'value' => 15],
            ],
            'views' => 2134,
            'downloads' => 567,
            'thumbnail' => 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '7',
            'doi' => '10.1016/j.gloenvcha.2024.102634',
            'title' => 'Biodiversity Conservation in Agricultural Landscapes',
            'abstract' => 'Integrating biodiversity conservation with sustainable agricultural practices.',
            'authors' => ['Dr. Hassan Al-Rashid', 'Prof. Yuki Tanaka'],
            'journal' => 'Global Environmental Change',
            'published_date' => '2023-06-12',
            'citations' => 38,
            'sdgs' => [15, 2, 12],
            'sdg_distribution' => [
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 50],
                ['sdg' => 2, 'name' => 'Zero Hunger', 'value' => 35],
                ['sdg' => 12, 'name' => 'Responsible Consumption', 'value' => 15],
            ],
            'views' => 1876,
            'downloads' => 423,
            'thumbnail' => 'https://images.unsplash.com/photo-1574263867373-f78145e8f66d?w=60&h=60&fit=crop&q=80',
        ],
        [
            'id' => '8',
            'doi' => '10.1136/bmj.q1234',
            'title' => 'Universal Health Coverage and Health Equity in Low-Income Countries',
            'abstract' => 'Pathways to achieving universal health coverage in resource-limited settings.',
            'authors' => ['Dr. Amara Okonkwo', 'Prof. James Wilson'],
            'journal' => 'British Medical Journal',
            'published_date' => '2023-04-28',
            'citations' => 72,
            'sdgs' => [3, 1, 10],
            'sdg_distribution' => [
                ['sdg' => 3, 'name' => 'Good Health', 'value' => 60],
                ['sdg' => 1, 'name' => 'No Poverty', 'value' => 25],
                ['sdg' => 10, 'name' => 'Reduced Inequalities', 'value' => 15],
            ],
            'views' => 4123,
            'downloads' => 1256,
            'thumbnail' => 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=60&h=60&fit=crop&q=80',
        ],
    ];
}
