<?php
declare(strict_types=1);

/**
 * @file api/wrapper/insights.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_wrapper
 * @brief Wawasan riset SDG yang dihitung dari database (work_sdgs + publications).
 *
 * Menggantikan api/insights.php lama yang berisi 12 wawasan karangan (angka dan
 * alasan fiktif). Setiap wawasan di sini dihitung langsung dari data yang sudah
 * dimigrasikan; bila data belum cukup, wawasan itu tidak ditampilkan.
 *
 * Kontrak yang dibaca InsightsPage.jsx:
 *   { status: 'ok', insights: [ {id, category, title, text, sdg, trend,
 *     series, series_start, icon} ], data_source: 'database' }
 *
 * Tahun berjalan tidak dipakai untuk menghitung pertumbuhan karena datanya
 * belum lengkap.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=600');

use Sciecola\Database\Db;

const INSIGHT_YEARS     = 5;  // panjang deret sparkline
const INSIGHT_MIN_BASE  = 5;  // minimal publikasi di tahun awal agar persentase bermakna
const INSIGHT_MIN_SDG   = 10; // minimal publikasi per SDG untuk perbandingan

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;
    require_once ROOT_PATH . '/includes/autoload.php';

    $pdo = Db::pdo();
    if (!$pdo) {
        throw new RuntimeException('database tidak dapat dihubungi');
    }

    echo json_encode([
        'status'      => 'ok',
        'insights'    => buildInsights($pdo),
        'data_source' => 'database',
        'generated_at'=> date('c'),
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(503);
    echo json_encode([
        'status'      => 'error',
        'message'     => 'Wawasan belum tersedia: ' . $e->getMessage(),
        'insights'    => [],
        'data_source' => 'unavailable',
    ], JSON_UNESCAPED_UNICODE);
}

function sdgName(int $n): string
{
    static $names = [
        1 => 'No Poverty', 2 => 'Zero Hunger', 3 => 'Good Health and Well-being',
        4 => 'Quality Education', 5 => 'Gender Equality', 6 => 'Clean Water and Sanitation',
        7 => 'Affordable and Clean Energy', 8 => 'Decent Work and Economic Growth',
        9 => 'Industry, Innovation and Infrastructure', 10 => 'Reduced Inequalities',
        11 => 'Sustainable Cities and Communities', 12 => 'Responsible Consumption and Production',
        13 => 'Climate Action', 14 => 'Life Below Water', 15 => 'Life on Land',
        16 => 'Peace, Justice and Strong Institutions', 17 => 'Partnerships for the Goals',
    ];
    return $names[$n] ?? ('SDG ' . $n);
}

function fmtPct(float $v, bool $signed = false): string
{
    $s = number_format(abs($v), abs($v) < 10 ? 1 : 0, ',', '.') . '%';
    if (!$signed) return $s;
    return ($v >= 0 ? '+' : '-') . $s;
}

function buildInsights(PDO $pdo): array
{
    $totalWorks = (int) $pdo->query('SELECT COUNT(DISTINCT doi) FROM work_sdgs')->fetchColumn();
    if ($totalWorks === 0) {
        return [];
    }

    $lastYear  = (int) date('Y') - 1;
    $firstYear = $lastYear - INSIGHT_YEARS + 1;
    $years     = range($firstYear, $lastYear);

    // Publikasi per SDG per tahun.
    $stmt = $pdo->prepare(
        'SELECT ws.sdg_number AS sdg, p.publication_year AS y, COUNT(DISTINCT ws.doi) AS n
           FROM work_sdgs ws
           JOIN publications p ON p.doi = ws.doi
          WHERE p.publication_year BETWEEN ? AND ?
          GROUP BY ws.sdg_number, p.publication_year'
    );
    $stmt->execute([$firstYear, $lastYear]);
    $perYear = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $perYear[(int) $r['sdg']][(int) $r['y']] = (int) $r['n'];
    }
    $seriesOf = static function (int $sdg) use ($perYear, $years): array {
        return array_map(static fn ($y) => $perYear[$sdg][$y] ?? 0, $years);
    };

    // Total per SDG.
    $totals = [];
    foreach ($pdo->query('SELECT sdg_number AS sdg, COUNT(DISTINCT doi) AS n FROM work_sdgs GROUP BY sdg_number') as $r) {
        $totals[(int) $r['sdg']] = (int) $r['n'];
    }
    arsort($totals);

    $insights = [];
    $id = 0;

    // 1–2. Pertumbuhan tercepat dan penurunan terdalam (tahun awal vs tahun terakhir lengkap).
    $growth = [];
    foreach (array_keys($totals) as $sdg) {
        $s = $seriesOf($sdg);
        if ($s[0] >= INSIGHT_MIN_BASE) {
            $growth[$sdg] = ($s[count($s) - 1] - $s[0]) / $s[0] * 100;
        }
    }
    if ($growth) {
        arsort($growth);
        $top = (int) array_key_first($growth);
        if ($growth[$top] > 0) {
            $insights[] = [
                'id' => ++$id, 'category' => 'Tren', 'icon' => 'trend_up', 'sdg' => $top,
                'title' => 'Pertumbuhan tercepat: SDG ' . $top,
                'text'  => sprintf('Publikasi terkait SDG %d (%s) berubah %s antara %d dan %d, tertinggi di antara SDG dengan data yang cukup.',
                    $top, sdgName($top), fmtPct($growth[$top], true), $firstYear, $lastYear),
                'trend' => fmtPct($growth[$top], true),
                'series' => $seriesOf($top), 'series_start' => $firstYear,
            ];
        }
        $low = (int) array_key_last($growth);
        if ($growth[$low] < 0 && $low !== $top) {
            $insights[] = [
                'id' => ++$id, 'category' => 'Peringatan', 'icon' => 'trend_down', 'sdg' => $low,
                'title' => 'Penurunan publikasi: SDG ' . $low,
                'text'  => sprintf('Publikasi terkait SDG %d (%s) turun %s antara %d dan %d.',
                    $low, sdgName($low), fmtPct(abs($growth[$low])), $firstYear, $lastYear),
                'trend' => fmtPct($growth[$low], true),
                'series' => $seriesOf($low), 'series_start' => $firstYear,
            ];
        }
    }

    // 3. SDG paling banyak diteliti (porsi dari seluruh publikasi ber-SDG).
    $most = (int) array_key_first($totals);
    $insights[] = [
        'id' => ++$id, 'category' => 'Perbandingan', 'icon' => 'chart', 'sdg' => $most,
        'title' => 'SDG paling banyak diteliti: SDG ' . $most,
        'text'  => sprintf('%s (SDG %d) muncul di %s publikasi, atau %s dari %s publikasi yang terpetakan ke SDG.',
            sdgName($most), $most, number_format($totals[$most], 0, ',', '.'),
            fmtPct($totals[$most] / $totalWorks * 100), number_format($totalWorks, 0, ',', '.')),
        'trend' => fmtPct($totals[$most] / $totalWorks * 100),
        'series' => $seriesOf($most), 'series_start' => $firstYear,
    ];

    // 4. SDG paling jarang diteliti (celah riset), termasuk SDG yang belum muncul sama sekali.
    $all = array_fill_keys(range(1, 17), 0);
    $counts = array_replace($all, $totals);
    asort($counts);
    $least = (int) array_key_first($counts);
    if ($least !== $most) {
        $share = $counts[$least] / $totalWorks * 100;
        $insights[] = [
            'id' => ++$id, 'category' => 'Rekomendasi', 'icon' => 'alert', 'sdg' => $least,
            'title' => 'Celah riset: SDG ' . $least,
            'text'  => $counts[$least] === 0
                ? sprintf('Belum ada publikasi yang terpetakan ke SDG %d (%s). Topik ini berpeluang diisi.', $least, sdgName($least))
                : sprintf('Hanya %s publikasi (%s) yang terpetakan ke SDG %d (%s), paling sedikit di antara 17 SDG.',
                    number_format($counts[$least], 0, ',', '.'), fmtPct($share), $least, sdgName($least)),
            'trend' => fmtPct($share),
            'series' => $seriesOf($least), 'series_start' => $firstYear,
        ];
    }

    // 5. Rata-rata sitasi per SDG tertinggi.
    $cit = [];
    foreach ($pdo->query(
        'SELECT ws.sdg_number AS sdg, AVG(COALESCE(p.citation_count, 0)) AS avg_c, COUNT(DISTINCT ws.doi) AS n
           FROM work_sdgs ws JOIN publications p ON p.doi = ws.doi
          GROUP BY ws.sdg_number'
    ) as $r) {
        if ((int) $r['n'] >= INSIGHT_MIN_SDG) $cit[(int) $r['sdg']] = (float) $r['avg_c'];
    }
    if ($cit) {
        arsort($cit);
        $best = (int) array_key_first($cit);
        $overall = (float) $pdo->query('SELECT AVG(COALESCE(citation_count, 0)) FROM publications WHERE doi IN (SELECT doi FROM work_sdgs)')->fetchColumn();
        if ($cit[$best] > $overall) {
            $insights[] = [
                'id' => ++$id, 'category' => 'Perbandingan', 'icon' => 'star', 'sdg' => $best,
                'title' => 'Rata-rata sitasi tertinggi: SDG ' . $best,
                'text'  => sprintf('Publikasi SDG %d (%s) rata-rata disitasi %s kali, dibanding rata-rata seluruh publikasi ber-SDG %s kali.',
                    $best, sdgName($best), number_format($cit[$best], 1, ',', '.'), number_format($overall, 1, ',', '.')),
                'trend' => number_format($cit[$best], 1, ',', '.') . '×',
                'series' => null, 'series_start' => null,
            ];
        }
    }

    // 6. Kolaborasi: porsi publikasi dengan 2+ penulis per SDG.
    $collab = [];
    foreach ($pdo->query(
        'SELECT ws.sdg_number AS sdg,
                SUM(CASE WHEN pa.c >= 2 THEN 1 ELSE 0 END) AS multi, COUNT(*) AS n
           FROM work_sdgs ws
           JOIN (SELECT doi, COUNT(*) AS c FROM publication_authors GROUP BY doi) pa ON pa.doi = ws.doi
          GROUP BY ws.sdg_number'
    ) as $r) {
        if ((int) $r['n'] >= INSIGHT_MIN_SDG) $collab[(int) $r['sdg']] = (int) $r['multi'] / (int) $r['n'] * 100;
    }
    if ($collab) {
        arsort($collab);
        $c = (int) array_key_first($collab);
        $insights[] = [
            'id' => ++$id, 'category' => 'Perbandingan', 'icon' => 'users', 'sdg' => $c,
            'title' => 'Paling kolaboratif: SDG ' . $c,
            'text'  => sprintf('%s publikasi SDG %d (%s) ditulis oleh dua penulis atau lebih, tertinggi di antara SDG.',
                fmtPct($collab[$c]), $c, sdgName($c)),
            'trend' => fmtPct($collab[$c]),
            'series' => null, 'series_start' => null,
        ];
    }

    // 7. Riset lintas SDG: publikasi yang menyentuh 3+ SDG.
    $multi = (int) $pdo->query(
        'SELECT COUNT(*) FROM (SELECT doi FROM work_sdgs GROUP BY doi HAVING COUNT(DISTINCT sdg_number) >= 3) x'
    )->fetchColumn();
    if ($multi > 0) {
        $stmt = $pdo->prepare(
            'SELECT p.publication_year AS y, COUNT(*) AS n
               FROM (SELECT doi FROM work_sdgs GROUP BY doi HAVING COUNT(DISTINCT sdg_number) >= 3) m
               JOIN publications p ON p.doi = m.doi
              WHERE p.publication_year BETWEEN ? AND ?
              GROUP BY p.publication_year'
        );
        $stmt->execute([$firstYear, $lastYear]);
        $byYear = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) $byYear[(int) $r['y']] = (int) $r['n'];
        $insights[] = [
            'id' => ++$id, 'category' => 'Tren', 'icon' => 'interconnect', 'sdg' => 17,
            'title' => 'Riset lintas SDG',
            'text'  => sprintf('%s publikasi (%s) menyentuh tiga SDG atau lebih sekaligus.',
                number_format($multi, 0, ',', '.'), fmtPct($multi / $totalWorks * 100)),
            'trend' => fmtPct($multi / $totalWorks * 100),
            'series' => array_map(static fn ($y) => $byYear[$y] ?? 0, $years), 'series_start' => $firstYear,
        ];
    }

    return $insights;
}
