<?php
declare(strict_types=1);

/**
 * @file api/wrapper/trends_analysis.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Analisis tren publikasi, sitasi, SDG, dan kolaborasi — seluruhnya dihitung dari database.
 *
 * GET /api/trends_analysis.php[?years=5&sdg=13]
 *   years = 0 → seluruh waktu; sdg = 1..17 → hanya publikasi yang terpetakan ke SDG itu.
 * Sumber: publications, work_sdgs, publication_authors, researchers, institutions.
 *
 * Versi sebelumnya menampilkan "perbandingan regional" dengan angka tetap (Singapura 86,4,
 * Malaysia 78,3, …), garis dampak "media sosial" dan "praktis" yang selalu nol, dan prediksi
 * dari dua titik terakhir termasuk tahun berjalan yang belum lengkap. Semua itu dihapus.
 *
 * Tahun berjalan ditandai `partial: true` dan tidak dipakai untuk menghitung pertumbuhan
 * maupun proyeksi, karena datanya belum lengkap.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Database\Db;

const TRENDS_MIN_BASE = 3; // publikasi minimal di tahun awal agar persentase pertumbuhan bermakna

$years = isset($_GET['years']) ? max(0, min(50, (int) $_GET['years'])) : 5;
$sdg   = isset($_GET['sdg'])   ? max(0, min(17, (int) $_GET['sdg'])) : 0;

try {
    $pdo = Db::pdo();
    if (!$pdo) {
        throw new RuntimeException('database tidak dapat dihubungi');
    }
    echo json_encode([
        'status'      => 'success',
        'data'        => buildTrends($pdo, $years, $sdg),
        'data_source' => 'database',
        'timestamp'   => date('c'),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('[trends_analysis] ' . $e->getMessage());
    http_response_code(503);
    echo json_encode([
        'status'      => 'error',
        'message'     => 'Data tren belum tersedia.',
        'data_source' => 'unavailable',
    ], JSON_UNESCAPED_UNICODE);
}

function sdgMeta(): array
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

function pct(float $from, float $to): ?float
{
    return $from > 0 ? round(($to - $from) / $from * 100, 1) : null;
}

/** Regresi linear sederhana (kuadrat terkecil). @return array{0:float,1:float} [slope, intercept] */
function linearFit(array $xs, array $ys): array
{
    $n = count($xs);
    $mx = array_sum($xs) / $n;
    $my = array_sum($ys) / $n;
    $num = 0.0; $den = 0.0;
    foreach ($xs as $i => $x) {
        $num += ($x - $mx) * ($ys[$i] - $my);
        $den += ($x - $mx) ** 2;
    }
    $slope = $den > 0 ? $num / $den : 0.0;
    return [$slope, $my - $slope * $mx];
}

function buildTrends(PDO $pdo, int $years, int $sdg): array
{
    $currentYear = (int) date('Y');
    $where  = 'p.publication_year IS NOT NULL AND p.publication_year <= ' . $currentYear;
    if ($years > 0) {
        $where .= ' AND p.publication_year >= ' . ($currentYear - $years + 1);
    }
    $sdgJoin = $sdg > 0 ? 'JOIN work_sdgs wsf ON wsf.doi = p.doi AND wsf.sdg_number = ' . $sdg : '';
    $meta = sdgMeta();

    // ── 1. Publikasi & sitasi per tahun ──────────────────────────────────────
    $rows = $pdo->query(
        "SELECT p.publication_year AS y, COUNT(DISTINCT p.doi) AS pubs,
                COALESCE(SUM(p.citation_count), 0) AS cites
           FROM publications p {$sdgJoin}
          WHERE {$where}
          GROUP BY p.publication_year ORDER BY p.publication_year"
    )->fetchAll(PDO::FETCH_ASSOC);
    $yearly = array_map(static fn ($r) => [
        'year'          => (string) $r['y'],
        'pub_count'     => (int) $r['pubs'],
        'citations'     => (int) $r['cites'],
        'avg_citations' => (int) $r['pubs'] > 0 ? round((int) $r['cites'] / (int) $r['pubs'], 2) : 0,
        'partial'       => (int) $r['y'] === $currentYear,
    ], $rows);
    $complete = array_values(array_filter($yearly, static fn ($r) => !$r['partial']));

    $deltas = ['pub_count' => null, 'avg_citations' => null, 'from_year' => null, 'to_year' => null];
    if (count($complete) >= 2) {
        $f = $complete[0];
        $l = $complete[count($complete) - 1];
        $deltas = [
            'pub_count'     => $f['pub_count'] >= TRENDS_MIN_BASE ? pct($f['pub_count'], $l['pub_count']) : null,
            'avg_citations' => pct((float) $f['avg_citations'], (float) $l['avg_citations']),
            'from_year'     => $f['year'],
            'to_year'       => $l['year'],
        ];
    }

    // ── 2. Proyeksi jumlah publikasi (regresi linear tahun lengkap, min. 3 tahun) ──
    $projection = [];
    if (count($complete) >= 3) {
        $xs = array_map(static fn ($r) => (int) $r['year'], $complete);
        $ys = array_map(static fn ($r) => (float) $r['pub_count'], $complete);
        [$slope, $intercept] = linearFit($xs, $ys);
        foreach ($complete as $r) {
            $projection[] = ['year' => $r['year'], 'actual' => $r['pub_count'], 'projected' => null];
        }
        $last = (int) end($xs);
        $projection[count($projection) - 1]['projected'] = (float) end($ys);
        for ($i = 1; $i <= 2; $i++) {
            $projection[] = ['year' => (string) ($last + $i), 'actual' => null,
                             'projected' => max(0, round($slope * ($last + $i) + $intercept))];
        }
    }

    // ── 3. Publikasi per SDG per tahun ────────────────────────────────────────
    $sdgRows = $pdo->query(
        "SELECT ws.sdg_number AS s, p.publication_year AS y, COUNT(DISTINCT p.doi) AS n
           FROM work_sdgs ws JOIN publications p ON p.doi = ws.doi
          WHERE {$where}
          GROUP BY ws.sdg_number, p.publication_year"
    )->fetchAll(PDO::FETCH_ASSOC);
    $bySdg = [];
    foreach ($sdgRows as $r) {
        $bySdg[(int) $r['s']][(int) $r['y']] = (int) $r['n'];
    }
    $completeYears = array_map(static fn ($r) => (int) $r['year'], $complete);
    $firstY = $completeYears[0] ?? null;
    $lastY  = $completeYears ? end($completeYears) : null;

    $topicsGrowth = [];
    foreach ($bySdg as $s => $byYear) {
        $total = array_sum($byYear);
        $from  = $firstY !== null ? ($byYear[$firstY] ?? 0) : 0;
        $to    = $lastY !== null ? ($byYear[$lastY] ?? 0) : 0;
        $topicsGrowth[] = [
            'sdg'           => $s,
            'topic'         => $meta[$s][0] ?? "SDG {$s}",
            'color'         => $meta[$s][1] ?? '#6b7280',
            'current_count' => $total,
            'from_count'    => $from,
            'to_count'      => $to,
            'growth'        => ($firstY !== null && $lastY !== null && $firstY !== $lastY && $from >= TRENDS_MIN_BASE)
                ? pct($from, $to) : null,
        ];
    }
    // Pertumbuhan yang bisa dihitung didahulukan, lalu berdasarkan jumlah publikasi.
    usort($topicsGrowth, static fn ($a, $b) =>
        [($b['growth'] !== null), $b['growth'] ?? 0, $b['current_count']] <=> [($a['growth'] !== null), $a['growth'] ?? 0, $a['current_count']]);
    $topicsGrowth = array_slice($topicsGrowth, 0, 8);

    $totals = array_map('array_sum', $bySdg);
    arsort($totals);
    $topKeys = array_slice(array_keys($totals), 0, 5);
    $allYears = [];
    foreach ($bySdg as $byYear) {
        $allYears = array_merge($allYears, array_keys($byYear));
    }
    $allYears = array_values(array_unique($allYears));
    sort($allYears);
    $fieldTrends = [];
    foreach ($allYears as $y) {
        $row = ['year' => (string) $y, 'partial' => $y === $currentYear];
        foreach ($topKeys as $s) {
            $row["sdg{$s}"] = (int) ($bySdg[$s][$y] ?? 0);
        }
        $fieldTrends[] = $row;
    }
    $topSdgs = array_map(static fn ($s) => [
        'sdg' => (int) $s, 'name' => $meta[$s][0] ?? "SDG {$s}", 'color' => $meta[$s][1] ?? '#6b7280',
        'count' => (int) $totals[$s],
    ], $topKeys);

    // ── 4. Kolaborasi: publikasi dengan penulis dari lebih dari satu negara ──
    // Negara diambil dari afiliasi ORCID peneliti (researchers.country / institutions.country).
    $countryExpr = "COALESCE(NULLIF(r.country, ''), i.country)";
    $collabRows = $pdo->query(
        "SELECT p.publication_year AS y, COUNT(DISTINCT p.doi) AS total,
                COUNT(DISTINCT CASE WHEN mc.n > 1 THEN p.doi END) AS intl,
                COUNT(DISTINCT CASE WHEN mc.n >= 1 THEN p.doi END) AS known
           FROM publications p {$sdgJoin}
           LEFT JOIN (
                SELECT pa.doi, COUNT(DISTINCT {$countryExpr}) AS n
                  FROM publication_authors pa
                  JOIN researchers r ON r.orcid = pa.orcid
                  LEFT JOIN institutions i ON i.id = r.institution_id
                 WHERE {$countryExpr} IS NOT NULL
                 GROUP BY pa.doi
           ) mc ON mc.doi = p.doi
          WHERE {$where}
          GROUP BY p.publication_year ORDER BY p.publication_year"
    )->fetchAll(PDO::FETCH_ASSOC);
    $collabTrend = array_map(static fn ($r) => [
        'year'          => (string) $r['y'],
        'total'         => (int) $r['total'],
        'known'         => (int) $r['known'],
        'international' => (int) $r['intl'],
        'national'      => (int) $r['known'] - (int) $r['intl'],
        'intl_percent'  => (int) $r['known'] > 0 ? round((int) $r['intl'] / (int) $r['known'] * 100, 1) : null,
        'partial'       => (int) $r['y'] === $currentYear,
    ], $collabRows);
    $hasCountryData = array_sum(array_column($collabTrend, 'known')) > 0;

    // Negara "asal" = negara terbanyak di antara peneliti; negara mitra = negara lain.
    $countries = $pdo->query(
        "SELECT {$countryExpr} AS c, COUNT(DISTINCT p.doi) AS n
           FROM publications p {$sdgJoin}
           JOIN publication_authors pa ON pa.doi = p.doi
           JOIN researchers r ON r.orcid = pa.orcid
           LEFT JOIN institutions i ON i.id = r.institution_id
          WHERE {$where} AND {$countryExpr} IS NOT NULL
          GROUP BY {$countryExpr} ORDER BY n DESC LIMIT 12"
    )->fetchAll(PDO::FETCH_ASSOC);
    $home = $countries[0]['c'] ?? null;
    $topCountries = [];
    foreach (array_slice($countries, 1, 8) as $r) {
        $topCountries[] = ['country' => (string) $r['c'], 'collaborations' => (int) $r['n']];
    }

    return [
        'yearly'          => $yearly,
        'deltas'          => $deltas,
        'projection'      => $projection,
        'topics_growth'   => $topicsGrowth,
        'field_trends'    => $fieldTrends,
        'top_sdgs'        => $topSdgs,
        'collab_trend'    => $hasCountryData ? $collabTrend : [],
        'home_country'    => $home,
        'top_countries'   => $topCountries,
        'total_publications' => array_sum(array_column($yearly, 'pub_count')),
        'current_year'    => (string) $currentYear,
    ];
}
