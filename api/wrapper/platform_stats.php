<?php
declare(strict_types=1);

/**
 * @file api/wrapper/platform_stats.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Platform Statistics API (beranda publik, beranda pengguna, kartu statistik).
 *
 * GET /api/platform_stats.php
 *   data    : [{key, label, value, raw}]   — format lama (label Indonesia) tetap dipertahankan
 *   summary : {articles, researchers, journals, institutions, sdgs, citations}
 *   yearly  : [{year, count, partial}]     — publikasi terklasifikasi per tahun (8 tahun terakhir)
 *   top_sdgs: [{sdg, name, color, count, percentage}]  — 5 SDG teratas
 *
 * Semua angka dihitung dari database (publications, researchers, journals, institutions,
 * work_sdgs). Bila database tidak bisa dihubungi, endpoint mengembalikan error 503
 * (frontend menampilkan "—"), bukan angka contoh.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=300');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

try {
    $pdo = \Sciecola\Database\Db::pdo();
    if (!$pdo) {
        throw new RuntimeException('database tidak dapat dihubungi');
    }
    echo json_encode(fetchPlatformStats($pdo) + [
        'status'      => 'success',
        'data_source' => 'database',
        'timestamp'   => date('c'),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Statistik platform belum tersedia',
    ], JSON_UNESCAPED_UNICODE);
    error_log('[platform_stats] ' . $e->getMessage());
}

/** COUNT/SUM tunggal; null bila tabel belum ada. */
function ps_scalar(PDO $pdo, string $sql): ?int
{
    try {
        $v = $pdo->query($sql)->fetchColumn();
        return $v === false || $v === null ? 0 : (int) $v;
    } catch (Throwable $e) {
        return null;
    }
}

function ps_sdg_meta(): array
{
    return [
        1 => ['No Poverty', '#e5243b'], 2 => ['Zero Hunger', '#dda63a'], 3 => ['Good Health', '#4c9f38'],
        4 => ['Quality Education', '#c5192d'], 5 => ['Gender Equality', '#ff3a21'], 6 => ['Clean Water', '#26bde2'],
        7 => ['Clean Energy', '#fcc30b'], 8 => ['Decent Work', '#a21942'], 9 => ['Industry & Innovation', '#fd6925'],
        10 => ['Reduced Inequalities', '#dd1367'], 11 => ['Sustainable Cities', '#fd9d24'],
        12 => ['Responsible Consumption', '#bf8b2e'], 13 => ['Climate Action', '#3f7e44'],
        14 => ['Life Below Water', '#0a97d9'], 15 => ['Life on Land', '#56c02b'],
        16 => ['Peace & Justice', '#00689d'], 17 => ['Partnerships', '#19486a'],
    ];
}

function fetchPlatformStats(PDO $pdo): array
{
    // Artikel = publikasi yang punya minimal satu SDG (lolos ambang klasifikasi).
    $summary = [
        'articles'     => ps_scalar($pdo, 'SELECT COUNT(DISTINCT doi) FROM work_sdgs'),
        'researchers'  => ps_scalar($pdo, 'SELECT COUNT(*) FROM researchers'),
        'journals'     => ps_scalar($pdo, 'SELECT COUNT(*) FROM journals'),
        'institutions' => ps_scalar($pdo, 'SELECT COUNT(*) FROM institutions'),
        'sdgs'         => ps_scalar($pdo, 'SELECT COUNT(DISTINCT sdg_number) FROM work_sdgs'),
        'citations'    => ps_scalar($pdo, 'SELECT COALESCE(SUM(citation_count), 0) FROM publications'),
    ];

    $labels = [
        'articles'  => 'Artikel Terklasifikasi',
        'researchers' => 'Peneliti',
        'journals'  => 'Jurnal',
        'sdgs'      => 'SDGs Terwakili',
        'citations' => 'Total Sitasi',
    ];
    $data = [];
    foreach ($labels as $key => $label) {
        $raw = $summary[$key];
        $data[] = ['key' => $key, 'label' => $label, 'value' => $raw === null ? '—' : number_format($raw), 'raw' => $raw];
    }

    // Publikasi terklasifikasi per tahun (8 tahun terakhir). Tahun berjalan ditandai partial.
    $yearly = [];
    $current = (int) date('Y');
    try {
        $st = $pdo->prepare(
            'SELECT p.publication_year AS y, COUNT(DISTINCT p.doi) AS n
               FROM publications p
               JOIN work_sdgs ws ON ws.doi = p.doi
              WHERE p.publication_year BETWEEN ? AND ?
              GROUP BY p.publication_year
              ORDER BY p.publication_year'
        );
        $st->execute([$current - 7, $current]);
        $byYear = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $byYear[(int) $r['y']] = (int) $r['n'];
        }
        if ($byYear) {
            for ($y = min(array_keys($byYear)); $y <= $current; $y++) {
                $yearly[] = ['year' => $y, 'count' => $byYear[$y] ?? 0, 'partial' => $y === $current];
            }
        }
    } catch (Throwable $e) {
        $yearly = [];
    }

    // 5 SDG teratas berdasarkan jumlah artikel.
    $topSdgs = [];
    try {
        $rows = $pdo->query(
            'SELECT sdg_number AS s, COUNT(DISTINCT doi) AS n FROM work_sdgs
              GROUP BY sdg_number ORDER BY n DESC, sdg_number LIMIT 5'
        )->fetchAll(PDO::FETCH_ASSOC);
        $meta = ps_sdg_meta();
        $total = max(1, (int) ($summary['articles'] ?? 0));
        foreach ($rows as $r) {
            $s = (int) $r['s'];
            $topSdgs[] = [
                'sdg'        => $s,
                'name'       => $meta[$s][0] ?? "SDG {$s}",
                'color'      => $meta[$s][1] ?? '#64748b',
                'count'      => (int) $r['n'],
                'percentage' => round((int) $r['n'] / $total * 100, 1),
            ];
        }
    } catch (Throwable $e) {
        $topSdgs = [];
    }

    return ['data' => $data, 'summary' => $summary, 'yearly' => $yearly, 'top_sdgs' => $topSdgs];
}
