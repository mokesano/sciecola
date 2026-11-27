<?php
declare(strict_types=1);

/**
 * @file api/wrapper/journals.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Journals List API - Returns paginated list of journals with Scopus metrics
 * 
 * Endpoint:
 * GET /api/journals.php?page=1&limit=20&sort=citescore&search=environmental
 *
 * Reads from: journals table (with optional ecosystem_cache for metrics)
 * Falls back to: sample data if DB is unavailable
 *
 * @author Rochmady and Claude Code
 * @version 1.0.0
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');

try {
    if (!defined('ROOT_PATH')) {
        define('ROOT_PATH', dirname(__DIR__) . '/..');
    }

    // Konfigurasi database (konstanta DB_*) ada di config/config.php
    if (!defined('DB_DATABASE') && file_exists(ROOT_PATH . '/config/config.php')) {
        require_once ROOT_PATH . '/config/config.php';
    }
    require_once ROOT_PATH . '/includes/autoload.php';

    // Validate and sanitize parameters
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $sort = in_array($_GET['sort'] ?? 'citescore', ['citescore', 'quartile', 'name', 'articles']) ? ($_GET['sort'] ?? 'citescore') : 'citescore';
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
 * Daftar jurnal dari database (journals + publications + work_sdgs).
 * Dulu selalu mengembalikan daftar jurnal karangan; kini kosong bila database kosong.
 */
function fetchJournalsList($offset, $limit, $sort, $search, $sdg_filter) {
    $sampleJournals = loadJournalsFromDb();

    // Apply search filter
    if ($search) {
        $sampleJournals = array_filter($sampleJournals, function($journal) use ($search) {
            $searchLower = strtolower($search);
            return stripos($journal['name'], $searchLower) !== false ||
                   stripos((string) $journal['subject'], $searchLower) !== false;
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
                return strcmp((string) $a['name'], (string) $b['name']);
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
 * Memuat jurnal beserta jumlah artikel dan distribusi SDG dari database.
 * Bentuk tiap item sama dengan yang dipakai JournalList.jsx.
 */
function loadJournalsFromDb(): array {
    $pdo = \Sciecola\Database\Db::pdo();
    if ($pdo === null) {
        return [];
    }
    $sdgNames = [1 => 'No Poverty', 2 => 'Zero Hunger', 3 => 'Good Health', 4 => 'Quality Education',
        5 => 'Gender Equality', 6 => 'Clean Water', 7 => 'Clean Energy', 8 => 'Decent Work',
        9 => 'Industry & Innovation', 10 => 'Reduced Inequalities', 11 => 'Sustainable Cities',
        12 => 'Responsible Consumption', 13 => 'Climate Action', 14 => 'Life Below Water',
        15 => 'Life on Land', 16 => 'Peace & Justice', 17 => 'Partnerships'];
    try {
        $year = (int) date('Y');
        $rows = $pdo->query(
            "SELECT j.id, j.title, j.issn, j.e_issn, j.publisher, j.country, j.cite_score, j.quartile, j.sjr_score, j.snip_score,
                    COUNT(p.doi) AS total_articles,
                    SUM(CASE WHEN p.publication_year = {$year} THEN 1 ELSE 0 END) AS articles_this_year
             FROM journals j
             LEFT JOIN publications p ON p.journal_id = j.id
             GROUP BY j.id, j.title, j.issn, j.e_issn, j.publisher, j.country, j.cite_score, j.quartile, j.sjr_score, j.snip_score
             HAVING COUNT(p.doi) > 0"
        )->fetchAll(PDO::FETCH_ASSOC);

        $dist = [];
        foreach ($pdo->query(
            'SELECT p.journal_id, ws.sdg_number, COUNT(DISTINCT ws.doi) AS n
             FROM work_sdgs ws JOIN publications p ON p.doi = ws.doi
             WHERE p.journal_id IS NOT NULL
             GROUP BY p.journal_id, ws.sdg_number'
        )->fetchAll(PDO::FETCH_ASSOC) as $d) {
            $dist[(int) $d['journal_id']][(int) $d['sdg_number']] = (int) $d['n'];
        }

        $items = [];
        foreach ($rows as $r) {
            $jd = $dist[(int) $r['id']] ?? [];
            arsort($jd);
            $sum = max(1, array_sum($jd));
            $sdgDist = [];
            foreach (array_slice($jd, 0, 6, true) as $n => $cnt) {
                $sdgDist[] = ['sdg' => $n, 'name' => $sdgNames[$n] ?? "SDG $n", 'value' => (int) round($cnt / $sum * 100)];
            }
            $items[] = [
                'id'                 => $r['issn'] ?: ($r['e_issn'] ?: 'j' . $r['id']),
                'name'               => $r['title'],
                'issn'               => $r['issn'] ?: $r['e_issn'],
                'publisher'          => $r['publisher'],
                'subject'            => '',
                'country'            => $r['country'],
                'citescore'          => $r['cite_score'] !== null ? (float) $r['cite_score'] : null,
                'quartile'           => $r['quartile'] !== null ? 'Q' . (int) $r['quartile'] : null,
                'sjr'                => $r['sjr_score'] !== null ? (float) $r['sjr_score'] : null,
                'snip'               => $r['snip_score'] !== null ? (float) $r['snip_score'] : null,
                'total_articles'     => (int) $r['total_articles'],
                'articles_this_year' => (int) $r['articles_this_year'],
                'focus_sdgs'         => array_slice(array_keys($jd), 0, 4),
                'sdg_distribution'   => $sdgDist,
            ];
        }
        return $items;
    } catch (Throwable $e) {
        return [];
    }
}
