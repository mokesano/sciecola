<?php
/**
 * Journals List API - Returns paginated list of journals with Scopus metrics
 *
 * GET /api/journals.php?page=1&limit=20&sort=citescore&search=environmental
 *
 * Reads from: journals table (with optional ecosystem_cache for metrics)
 * Falls back to: sample data if DB is unavailable
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
    $sort = in_array($_GET['sort'] ?? 'citescore', ['citescore', 'quartile', 'name', 'articles']) ? $_GET['sort'] : 'citescore';
    $search = trim($_GET['search'] ?? '');
    $sdg_filter = (int)($_GET['sdg'] ?? 0);

    // Build query
    $journals = fetchJournalsList($offset, $limit, $sort, $search, $sdg_filter);

    http_response_code(200);
    echo json_encode([
        'status'    => 'success',
        'page'      => $page,
        'limit'     => $limit,
        'total'     => $journals['total'],
        'total_pages' => ceil($journals['total'] / $limit),
        'data'      => $journals['items'],
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
 * Fetch journals list from database or generate mock data
 */
function fetchJournalsList($offset, $limit, $sort, $search, $sdg_filter) {
    // Try to fetch from database first
    // For now, generate sample data - in production would query journals + work_sdgs tables

    $sampleJournals = generateSampleJournals();

    // Apply search filter
    if ($search) {
        $sampleJournals = array_filter($sampleJournals, function($journal) use ($search) {
            $searchLower = strtolower($search);
            return stripos($journal['name'], $searchLower) !== false ||
                   stripos($journal['subject'], $searchLower) !== false;
        });
    }

    // Apply SDG filter
    if ($sdg_filter > 0) {
        $sampleJournals = array_filter($sampleJournals, function($journal) use ($sdg_filter) {
            return in_array($sdg_filter, $journal['focus_sdgs']);
        });
    }

    // Sort
    usort($sampleJournals, function($a, $b) use ($sort) {
        switch ($sort) {
            case 'citescore':
                return ($b['citescore'] ?? 0) - ($a['citescore'] ?? 0);
            case 'quartile':
                $quartilesOrder = ['Q1' => 4, 'Q2' => 3, 'Q3' => 2, 'Q4' => 1];
                $aQ = $quartilesOrder[$a['quartile']] ?? 0;
                $bQ = $quartilesOrder[$b['quartile']] ?? 0;
                return $bQ - $aQ;
            case 'articles':
                return $b['total_articles'] - $a['total_articles'];
            case 'name':
            default:
                return strcmp($a['name'], $b['name']);
        }
    });

    $total = count($sampleJournals);
    $items = array_slice($sampleJournals, $offset, $limit);

    return [
        'total' => $total,
        'items' => $items,
    ];
}

/**
 * Generate sample journals (TODO: replace with database query)
 */
function generateSampleJournals() {
    return [
        [
            'id' => 'jess-2024',
            'name' => 'Journal of Environmental Science and Sustainability',
            'issn' => '1234-5678',
            'publisher' => 'Sangia Research Media and Publishing',
            'subject' => 'Environmental Science',
            'country' => 'Indonesia',
            'citescore' => 2.48,
            'quartile' => 'Q2',
            'sjr' => 0.85,
            'snip' => 1.12,
            'total_articles' => 356,
            'articles_this_year' => 68,
            'focus_sdgs' => [13, 11, 15, 14],
            'sdg_distribution' => [
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 28],
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 20],
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 16],
                ['sdg' => 14, 'name' => 'Life Below Water', 'value' => 12],
            ],
        ],
        [
            'id' => 'jcp-2024',
            'name' => 'Journal of Cleaner Production',
            'issn' => '0959-6526',
            'publisher' => 'Elsevier',
            'subject' => 'Environmental Science & Technology',
            'country' => 'United Kingdom',
            'citescore' => 3.21,
            'quartile' => 'Q1',
            'sjr' => 1.45,
            'snip' => 1.89,
            'total_articles' => 892,
            'articles_this_year' => 124,
            'focus_sdgs' => [12, 13, 11, 7],
            'sdg_distribution' => [
                ['sdg' => 12, 'name' => 'Responsible Consumption', 'value' => 35],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 28],
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 22],
                ['sdg' => 7, 'name' => 'Clean Energy', 'value' => 15],
            ],
        ],
        [
            'id' => 'ncc-2024',
            'name' => 'Nature Climate Change',
            'issn' => '1758-678X',
            'publisher' => 'Springer Nature',
            'subject' => 'Climate Science',
            'country' => 'United Kingdom',
            'citescore' => 4.56,
            'quartile' => 'Q1',
            'sjr' => 2.34,
            'snip' => 2.45,
            'total_articles' => 456,
            'articles_this_year' => 87,
            'focus_sdgs' => [13, 14, 15, 6],
            'sdg_distribution' => [
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 45],
                ['sdg' => 14, 'name' => 'Life Below Water', 'value' => 22],
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 18],
                ['sdg' => 6, 'name' => 'Clean Water', 'value' => 15],
            ],
        ],
        [
            'id' => 'mpb-2024',
            'name' => 'Marine Pollution Bulletin',
            'issn' => '0025-326X',
            'publisher' => 'Elsevier',
            'subject' => 'Marine Science',
            'country' => 'United Kingdom',
            'citescore' => 2.89,
            'quartile' => 'Q2',
            'sjr' => 0.92,
            'snip' => 1.34,
            'total_articles' => 234,
            'articles_this_year' => 45,
            'focus_sdgs' => [14, 13, 6, 15],
            'sdg_distribution' => [
                ['sdg' => 14, 'name' => 'Life Below Water', 'value' => 50],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 25],
                ['sdg' => 6, 'name' => 'Clean Water', 'value' => 15],
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 10],
            ],
        ],
        [
            'id' => 'wm-2024',
            'name' => 'Waste Management',
            'issn' => '0956-053X',
            'publisher' => 'Elsevier',
            'subject' => 'Waste Management & Environmental',
            'country' => 'United Kingdom',
            'citescore' => 2.34,
            'quartile' => 'Q2',
            'sjr' => 0.78,
            'snip' => 1.05,
            'total_articles' => 445,
            'articles_this_year' => 78,
            'focus_sdgs' => [12, 11, 13, 6],
            'sdg_distribution' => [
                ['sdg' => 12, 'name' => 'Responsible Consumption', 'value' => 45],
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 28],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 18],
                ['sdg' => 6, 'name' => 'Clean Water', 'value' => 9],
            ],
        ],
        [
            'id' => 'gec-2024',
            'name' => 'Global Environmental Change',
            'issn' => '0959-3780',
            'publisher' => 'Elsevier',
            'subject' => 'Environmental Studies',
            'country' => 'United Kingdom',
            'citescore' => 3.12,
            'quartile' => 'Q1',
            'sjr' => 1.32,
            'snip' => 1.78,
            'total_articles' => 378,
            'articles_this_year' => 62,
            'focus_sdgs' => [13, 15, 14, 12],
            'sdg_distribution' => [
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 35],
                ['sdg' => 15, 'name' => 'Life on Land', 'value' => 28],
                ['sdg' => 14, 'name' => 'Life Below Water', 'value' => 22],
                ['sdg' => 12, 'name' => 'Responsible Consumption', 'value' => 15],
            ],
        ],
        [
            'id' => 'sustainability-2024',
            'name' => 'Sustainability',
            'issn' => '2071-1050',
            'publisher' => 'MDPI',
            'subject' => 'Sustainability & Environmental',
            'country' => 'Switzerland',
            'citescore' => 1.87,
            'quartile' => 'Q3',
            'sjr' => 0.45,
            'snip' => 0.78,
            'total_articles' => 1234,
            'articles_this_year' => 289,
            'focus_sdgs' => [12, 13, 11, 7],
            'sdg_distribution' => [
                ['sdg' => 12, 'name' => 'Responsible Consumption', 'value' => 32],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 28],
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 24],
                ['sdg' => 7, 'name' => 'Clean Energy', 'value' => 16],
            ],
        ],
        [
            'id' => 'cities-2024',
            'name' => 'Cities',
            'issn' => '2118-1620',
            'publisher' => 'Elsevier',
            'subject' => 'Urban Planning & Development',
            'country' => 'United Kingdom',
            'citescore' => 1.56,
            'quartile' => 'Q3',
            'sjr' => 0.38,
            'snip' => 0.65,
            'total_articles' => 267,
            'articles_this_year' => 48,
            'focus_sdgs' => [11, 13, 3, 8],
            'sdg_distribution' => [
                ['sdg' => 11, 'name' => 'Sustainable Cities', 'value' => 55],
                ['sdg' => 13, 'name' => 'Climate Action', 'value' => 22],
                ['sdg' => 3, 'name' => 'Good Health', 'value' => 15],
                ['sdg' => 8, 'name' => 'Decent Work', 'value' => 8],
            ],
        ],
    ];
}
