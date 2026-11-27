<?php
declare(strict_types=1);

/**
 * @file api/wrapper/monitoring.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Statistik kunjungan nyata untuk halaman Admin → Monitoring.
 *
 * GET /api/monitoring.php?range=1h|24h|7d|30d[&fresh=1]       -> JSON
 * GET /api/monitoring.php?range=…&format=csv                  -> CSV kunjungan (tanpa IP)
 *
 * Sumber: access_logs dengan visit_type = 'pageview' — satu baris per halaman yang
 * benar-benar dibuka di browser (dikirim frontend lewat /api/track.php), lengkap dengan
 * lama tampil halaman. Bot/crawler tidak dicatat. Baris lama dari pencatat sisi server
 * tidak dipakai karena path-nya selalu "/" dan durasinya kosong.
 *
 * Bagian "security" berasal dari security_events (src/Middleware/AccessLogger.php):
 * brute force, pemindaian celah, akses diblokir, login gagal, akses langsung, bot.
 *
 * Semua angka dihitung dari data; tidak ada nilai bawaan. "Perubahan" dibandingkan
 * dengan periode sebelumnya yang sama panjang (null bila periode sebelumnya kosong).
 */

header('Cache-Control: private, no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
// Konstanta DB_* (dipakai AdminGuard/UserAuth untuk membaca sesi admin) ada di config/config.php.
if (file_exists(ROOT_PATH . '/config/config.php')) require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Analytics\VisitTracker;
use Sciecola\Database\Db;
use Sciecola\Middleware\AccessLogger;

// Data trafik hanya untuk admin.
\Sciecola\Auth\AdminGuard::require();

$range = in_array($_GET['range'] ?? '', ['1h', '24h', '7d', '30d'], true) ? $_GET['range'] : '24h';
$span  = ['1h' => 3600, '24h' => 86400, '7d' => 604800, '30d' => 2592000][$range];
$now   = time();
$from  = $now - $span;

try {
    $pdo = Db::pdo();
    if (!$pdo) {
        throw new RuntimeException('database tidak dapat dihubungi');
    }
    VisitTracker::ensure($pdo);

    if (($_GET['format'] ?? '') === 'csv') {
        mon_csv($pdo, $from, $now, $range);
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');

    $cacheFile = ROOT_PATH . '/cache/monitoring_' . $range . '.json';
    if (empty($_GET['fresh']) && is_file($cacheFile) && filemtime($cacheFile) > $now - 60) {
        $cached = json_decode((string) file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            echo json_encode(['status' => 'ok', 'cached' => true, 'data' => $cached], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $rows = mon_rows($pdo, $from, $now, true);
    $prev = mon_rows($pdo, $from - $span, $from, false);

    $cur = mon_summary($rows);
    $old = mon_summary($prev);
    $cur['changes'] = [
        'totalPageViews'     => mon_pct($old['totalPageViews'], $cur['totalPageViews']),
        'uniqueVisitors'     => mon_pct($old['uniqueVisitors'], $cur['uniqueVisitors']),
        'avgSessionDuration' => mon_pct($old['avgSessionDuration'], $cur['avgSessionDuration']),
        // Untuk bounce rate yang dibandingkan selisih poin persen, bukan persen perubahan.
        'bounceRate'         => ($old['bounceRate'] !== null && $cur['bounceRate'] !== null)
            ? round($cur['bounceRate'] - $old['bounceRate'], 1) : null,
    ];

    $data = [
        'range'          => $range,
        'generatedAt'    => date('c', $now),
        'trackingSince'  => mon_first_view($pdo),
        'summary'        => $cur,
        'timeline'       => mon_timeline($rows, $from, $now, $range),
        'geoData'        => mon_geo($rows),
        'trafficSources' => mon_sources($rows),
        'pagesData'      => mon_pages($rows),
        'systemData'     => [
            'browsers'  => mon_share($rows, 'browser'),
            'platforms' => mon_share($rows, 'device_type'),
            'os'        => mon_share($rows, 'os'),
        ],
        'activity'       => mon_activity($rows),
        'security'       => mon_security($pdo, $from, $now),
    ];

    @file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'ok', 'cached' => false, 'data' => $data], JSON_UNESCAPED_UNICODE);
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    error_log('[monitoring] ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Data monitoring belum tersedia.']);
}

// ─── Pengambilan data ───────────────────────────────────────────────────────

function mon_rows(PDO $pdo, int $from, int $to, bool $full): array
{
    $cols = $full
        ? 'id, created_at, page_path, session_id, visitor_id, ip_address, session_duration, traffic_source,
           referrer, utm_campaign, browser, os, device_type, city, country, latitude, longitude'
        : 'created_at, session_id, visitor_id, ip_address, session_duration';
    $st = $pdo->prepare(
        "SELECT {$cols} FROM access_logs
          WHERE visit_type = ? AND is_bot = 0 AND created_at >= ? AND created_at < ?
          ORDER BY created_at, id
          LIMIT 200000"
    );
    $st->execute([VisitTracker::TYPE, date('Y-m-d H:i:s', $from), date('Y-m-d H:i:s', $to)]);
    return $st->fetchAll(PDO::FETCH_ASSOC);
}

function mon_first_view(PDO $pdo): ?string
{
    $st = $pdo->prepare('SELECT MIN(created_at) FROM access_logs WHERE visit_type = ?');
    $st->execute([VisitTracker::TYPE]);
    $v = $st->fetchColumn();
    return $v ? date('c', strtotime((string) $v)) : null;
}

function mon_pct($old, $new): ?float
{
    if ($old === null || $new === null || (float) $old <= 0) return null;
    return round(((float) $new - (float) $old) / (float) $old * 100, 1);
}

function mon_visitor(array $r): string
{
    return (string) ($r['visitor_id'] ?: $r['ip_address']);
}

/** Kelompokkan baris per sesi kunjungan (baris sudah urut waktu). */
function mon_sessions(array $rows): array
{
    $s = [];
    foreach ($rows as $r) {
        $k = (string) $r['session_id'];
        if (!isset($s[$k])) {
            $s[$k] = ['views' => 0, 'dur' => 0, 'measured' => false, 'first' => $r, 'last' => $r];
        }
        $s[$k]['views']++;
        if ($r['session_duration'] !== null) {
            $s[$k]['dur'] += (int) $r['session_duration'];
            $s[$k]['measured'] = true;
        }
        $s[$k]['last'] = $r;
    }
    return $s;
}

function mon_summary(array $rows): array
{
    $visitors = [];
    foreach ($rows as $r) {
        $visitors[mon_visitor($r)] = true;
    }
    $sessions = mon_sessions($rows);
    $n = count($sessions);
    $bounces = 0;
    $durs = [];
    foreach ($sessions as $s) {
        if ($s['views'] === 1) $bounces++;
        if ($s['measured']) $durs[] = $s['dur'];
    }
    return [
        'totalPageViews'     => count($rows),
        'uniqueVisitors'     => count($visitors),
        'sessions'           => $n,
        'pagesPerSession'    => $n > 0 ? round(count($rows) / $n, 2) : null,
        'avgSessionDuration' => $durs ? (int) round(array_sum($durs) / count($durs)) : null, // detik
        'bounceRate'         => $n > 0 ? round($bounces / $n * 100, 1) : null,               // % sesi 1 halaman
    ];
}

/** Path dengan ID diganti penanda, agar halaman sejenis terhitung bersama. */
function mon_group_path(string $p): string
{
    $rules = [
        '#^/(orcid|scopus|sinta|researcherid)/[^/]+$#'                       => '/$1/:id',
        '#^/doi/.+$#'                                                       => '/doi/:doi',
        '#^/(journals|institutions|collections|teams|researchers)/[^/]+$#' => '/$1/:id',
    ];
    foreach ($rules as $re => $rep) {
        if (preg_match($re, $p)) return (string) preg_replace($re, $rep, $p);
    }
    return $p;
}

function mon_timeline(array $rows, int $from, int $to, string $range): array
{
    $step  = ['1h' => 300, '24h' => 3600, '7d' => 86400, '30d' => 86400][$range];
    $daily = $step >= 86400;
    $start = $daily ? strtotime(date('Y-m-d', $from)) : intdiv($from, $step) * $step;
    $buckets = [];
    for ($t = $start; $t < $to; $t += $step) {
        $key = $daily ? date('Y-m-d', $t) : (string) $t;
        $buckets[$key] = ['label' => date($daily ? 'd M' : 'H:i', $t), 'views' => 0, 'visitors' => []];
    }
    foreach ($rows as $r) {
        $ts  = strtotime((string) $r['created_at']);
        $key = $daily ? date('Y-m-d', $ts) : (string) (intdiv($ts, $step) * $step);
        if (!isset($buckets[$key])) continue;
        $buckets[$key]['views']++;
        $buckets[$key]['visitors'][mon_visitor($r)] = true;
    }
    return array_values(array_map(static fn ($b) => [
        'label' => $b['label'], 'views' => $b['views'], 'visitors' => count($b['visitors']),
    ], $buckets));
}

function mon_geo(array $rows): array
{
    $g = [];
    foreach ($rows as $r) {
        if (empty($r['city']) || $r['latitude'] === null || $r['longitude'] === null) continue;
        $k = $r['city'] . '|' . $r['country'];
        if (!isset($g[$k])) {
            $g[$k] = ['city' => $r['city'], 'country' => $r['country'], 'views' => 0, 'lat' => 0.0, 'lng' => 0.0, 'visitors' => []];
        }
        $g[$k]['views']++;
        $g[$k]['lat'] += (float) $r['latitude'];
        $g[$k]['lng'] += (float) $r['longitude'];
        $g[$k]['visitors'][mon_visitor($r)] = true;
    }
    $out = [];
    foreach ($g as $x) {
        $out[] = [
            'city'     => $x['city'],
            'country'  => $x['country'],
            'views'    => $x['views'],
            'visitors' => count($x['visitors']),
            'lat'      => round($x['lat'] / $x['views'], 4),
            'lng'      => round($x['lng'] / $x['views'], 4),
        ];
    }
    usort($out, static fn ($a, $b) => $b['visitors'] <=> $a['visitors']);
    $out = array_slice($out, 0, 50);
    foreach ($out as $i => &$o) {
        $o['id'] = $i + 1;
    }
    unset($o);
    return $out;
}

/** Jumlah + persen tiap nilai. */
function mon_count(array $values, int $limit = 0): array
{
    $c = array_count_values(array_map('strval', $values));
    arsort($c);
    if ($limit > 0) $c = array_slice($c, 0, $limit, true);
    $total = count($values);
    $out = [];
    foreach ($c as $k => $n) {
        $out[] = ['name' => (string) $k, 'value' => $n, 'percentage' => $total > 0 ? (int) round($n / $total * 100) : 0];
    }
    return $out;
}

function mon_share(array $rows, string $col): array
{
    return mon_count(array_map(static fn ($r) => $r[$col] ?: 'Unknown', $rows));
}

function mon_sources(array $rows): array
{
    // Sumber trafik dihitung per sesi (halaman pertama sesi), seperti alat analitik umumnya.
    $firsts = array_map(static fn ($s) => $s['first'], mon_sessions($rows));

    $names  = ['direct' => 'Direct', 'organic' => 'Organic Search', 'social' => 'Social Media',
               'referral' => 'Referral', 'email' => 'Email', 'paid' => 'Paid'];
    $colors = ['direct' => 'bg-indigo-500', 'organic' => 'bg-purple-500', 'social' => 'bg-pink-500',
               'referral' => 'bg-blue-500', 'email' => 'bg-green-500', 'paid' => 'bg-amber-500'];
    $sources = [];
    foreach (mon_count(array_map(static fn ($r) => $r['traffic_source'] ?: 'direct', $firsts)) as $s) {
        $key = $s['name'];
        $sources[] = [
            'key'        => $key,
            'name'       => $names[$key] ?? ucfirst($key),
            'value'      => $s['value'],
            'percentage' => $s['percentage'],
            'color'      => $colors[$key] ?? 'bg-gray-500',
        ];
    }

    $refs = [];
    foreach ($firsts as $r) {
        $h = strtolower((string) parse_url((string) $r['referrer'], PHP_URL_HOST));
        if ($h !== '') $refs[] = (string) preg_replace('/^www\./', '', $h);
    }
    $utm = array_values(array_filter(array_map(static fn ($r) => $r['utm_campaign'], $firsts)));

    return [
        'sources'   => $sources,
        'referrers' => array_map(static fn ($x) => ['domain' => $x['name'], 'value' => $x['value'], 'percentage' => $x['percentage']], mon_count($refs, 8)),
        'utm'       => array_map(static fn ($x) => ['campaign' => $x['name'], 'value' => $x['value'], 'percentage' => $x['percentage']], mon_count($utm, 5)),
    ];
}

function mon_pages(array $rows): array
{
    $pages = [];
    foreach ($rows as $r) {
        $p = mon_group_path((string) $r['page_path']);
        $pages[$p] ??= ['views' => 0, 'dur' => 0, 'measured' => 0];
        $pages[$p]['views']++;
        if ($r['session_duration'] !== null) {
            $pages[$p]['dur'] += (int) $r['session_duration'];
            $pages[$p]['measured']++;
        }
    }
    uasort($pages, static fn ($a, $b) => $b['views'] <=> $a['views']);
    $top = [];
    foreach (array_slice($pages, 0, 10, true) as $p => $x) {
        $top[] = [
            'path'    => (string) $p,
            'views'   => $x['views'],
            'avgTime' => $x['measured'] ? (int) round($x['dur'] / $x['measured']) : null, // detik
        ];
    }

    $entry = [];
    $exit  = [];
    foreach (mon_sessions($rows) as $s) {
        $e = mon_group_path((string) $s['first']['page_path']);
        $entry[$e] ??= ['views' => 0, 'bounces' => 0];
        $entry[$e]['views']++;
        if ($s['views'] === 1) $entry[$e]['bounces']++;
        $x = mon_group_path((string) $s['last']['page_path']);
        $exit[$x] = ($exit[$x] ?? 0) + 1;
    }
    uasort($entry, static fn ($a, $b) => $b['views'] <=> $a['views']);
    arsort($exit);
    $te = array_sum(array_column($entry, 'views'));
    $tx = array_sum($exit);

    $entryOut = [];
    foreach (array_slice($entry, 0, 5, true) as $p => $x) {
        $entryOut[] = [
            'path'       => (string) $p,
            'views'      => $x['views'],
            'percentage' => $te ? (int) round($x['views'] / $te * 100) : 0,
            'bounceRate' => round($x['bounces'] / $x['views'] * 100, 1),
        ];
    }
    $exitOut = [];
    foreach (array_slice($exit, 0, 5, true) as $p => $n) {
        $exitOut[] = ['path' => (string) $p, 'views' => $n, 'percentage' => $tx ? (int) round($n / $tx * 100) : 0];
    }
    return ['topPages' => $top, 'entryPages' => $entryOut, 'exitPages' => $exitOut];
}

function mon_activity(array $rows): array
{
    $out = [];
    foreach (array_slice(array_reverse($rows), 0, 15) as $r) {
        $out[] = [
            'id'        => (int) $r['id'],
            'timestamp' => date('c', strtotime((string) $r['created_at'])),
            'page'      => $r['page_path'],
            'source'    => $r['traffic_source'] ?: 'direct',
            'location'  => $r['city'] ? trim($r['city'] . ', ' . $r['country'], ', ') : ($r['country'] ?: null),
            'device'    => ($r['browser'] ?: '?') . ' / ' . ($r['os'] ?: '?') . ' · ' . ($r['device_type'] ?: '?'),
            'duration'  => $r['session_duration'] !== null ? (int) $r['session_duration'] : null, // detik
        ];
    }
    return $out;
}

function mon_csv(PDO $pdo, int $from, int $to, string $range): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="kunjungan-' . $range . '-' . date('Ymd-His') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF"); // BOM agar Excel membaca UTF-8
    fputcsv($out, ['waktu', 'halaman', 'sesi', 'lama_tampil_detik', 'sumber', 'referrer', 'utm_campaign',
                   'kota', 'negara', 'browser', 'os', 'perangkat']);
    foreach (mon_rows($pdo, $from, $to, true) as $r) {
        fputcsv($out, [
            $r['created_at'], $r['page_path'], substr((string) $r['session_id'], 0, 8), $r['session_duration'],
            $r['traffic_source'], $r['referrer'], $r['utm_campaign'], $r['city'], $r['country'],
            $r['browser'], $r['os'], $r['device_type'],
        ]);
    }
    fclose($out);
}

// ─── Keamanan ───────────────────────────────────────────────────────────────

function mon_security(PDO $pdo, int $from, int $to): array
{
    AccessLogger::ensure($pdo);
    $st = $pdo->prepare(
        'SELECT id, event_type, severity, ip_address, http_method, path, user_agent, identifier,
                city, country, latitude, longitude, hits, detail, created_at, last_seen_at
           FROM security_events
          WHERE last_seen_at >= ? AND last_seen_at < ?
          ORDER BY last_seen_at DESC
          LIMIT 20000'
    );
    $st->execute([date('Y-m-d H:i:s', $from), date('Y-m-d H:i:s', $to + 1)]);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    $byType = array_fill_keys(array_keys(AccessLogger::EVENTS), 0);
    $sev = ['danger' => 0, 'warning' => 0];
    $ips = [];
    $points = [];
    foreach ($rows as $r) {
        $h = (int) $r['hits'];
        $type = (string) $r['event_type'];
        $byType[$type] = ($byType[$type] ?? 0) + $h;
        $sev[$r['severity'] === 'danger' ? 'danger' : 'warning'] += $h;

        $ip = (string) $r['ip_address'];
        $ips[$ip] ??= ['ip' => $ip, 'hits' => 0, 'types' => [], 'location' => null, 'severity' => 'warning', 'last_seen' => $r['last_seen_at']];
        $ips[$ip]['hits'] += $h;
        $ips[$ip]['types'][$type] = ($ips[$ip]['types'][$type] ?? 0) + $h;
        if ($r['severity'] === 'danger') $ips[$ip]['severity'] = 'danger';
        if (!$ips[$ip]['location'] && $r['city']) $ips[$ip]['location'] = trim($r['city'] . ', ' . $r['country'], ', ');

        if ($r['latitude'] !== null && $r['longitude'] !== null) {
            $k = ($r['city'] ?: '?') . '|' . ($r['country'] ?: '?');
            $points[$k] ??= ['city' => $r['city'] ?: null, 'country' => $r['country'] ?: null, 'lat' => 0.0, 'lng' => 0.0,
                             'n' => 0, 'hits' => 0, 'severity' => 'warning', 'types' => [], 'ips' => []];
            $points[$k]['lat'] += (float) $r['latitude'];
            $points[$k]['lng'] += (float) $r['longitude'];
            $points[$k]['n']++;
            $points[$k]['hits'] += $h;
            $points[$k]['types'][$type] = ($points[$k]['types'][$type] ?? 0) + $h;
            $points[$k]['ips'][$ip] = true;
            if ($r['severity'] === 'danger') $points[$k]['severity'] = 'danger';
        }
    }

    $geo = [];
    foreach ($points as $p) {
        arsort($p['types']);
        $geo[] = [
            'city'     => $p['city'],
            'country'  => $p['country'],
            'lat'      => round($p['lat'] / $p['n'], 4),
            'lng'      => round($p['lng'] / $p['n'], 4),
            'hits'     => $p['hits'],
            'ips'      => count($p['ips']),
            'severity' => $p['severity'],
            'types'    => $p['types'],
        ];
    }
    usort($geo, static fn ($a, $b) => [$b['severity'] === 'danger', $b['hits']] <=> [$a['severity'] === 'danger', $a['hits']]);
    foreach ($geo as $i => &$g) { $g['id'] = 's' . ($i + 1); }
    unset($g);

    uasort($ips, static fn ($a, $b) => $b['hits'] <=> $a['hits']);
    $topIps = array_map(static function ($x) {
        arsort($x['types']);
        $x['last_seen'] = date('c', strtotime((string) $x['last_seen']));
        return $x;
    }, array_slice(array_values($ips), 0, 8));

    $recent = [];
    foreach (array_slice($rows, 0, 25) as $r) {
        $recent[] = [
            'id'         => (int) $r['id'],
            'type'       => $r['event_type'],
            'severity'   => $r['severity'],
            'ip'         => $r['ip_address'],
            'method'     => $r['http_method'],
            'path'       => $r['path'],
            'identifier' => $r['identifier'],
            'location'   => $r['city'] ? trim($r['city'] . ', ' . $r['country'], ', ') : ($r['country'] ?: null),
            'hits'       => (int) $r['hits'],
            'userAgent'  => $r['user_agent'],
            'detail'     => $r['detail'] ? (json_decode((string) $r['detail'], true) ?: null) : null,
            'firstSeen'  => date('c', strtotime((string) $r['created_at'])),
            'lastSeen'   => date('c', strtotime((string) $r['last_seen_at'])),
        ];
    }

    return [
        'summary' => [
            'total'     => array_sum($byType),
            'danger'    => $sev['danger'],
            'warning'   => $sev['warning'],
            'uniqueIps' => count($ips),
            'byType'    => $byType,
        ],
        'geoData' => array_slice($geo, 0, 60),
        'topIps'  => $topIps,
        'recent'  => $recent,
    ];
}
