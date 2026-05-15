<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=300');

require_once __DIR__ . '/../includes/bootstrap.php';

use Sciecola\Database\Connection;
use Sciecola\Cache\DbCacheService;

$timeRange = in_array($_GET['range'] ?? '', ['1h', '24h', '7d', '30d'], true)
    ? $_GET['range']
    : '24h';

try {
    $db    = Connection::getInstance();
    $cache = new DbCacheService();

    $cacheKey   = "monitoring_stats_{$timeRange}";
    $cachedData = $cache->get($cacheKey);
    if ($cachedData) {
        echo json_encode(['status' => 'ok', 'cached' => true, 'data' => $cachedData]);
        exit;
    }

    $data = [
        'summary'        => getSummaryStats($db, $timeRange),
        'geoData'        => getGeoData($db, $timeRange),
        'trafficSources' => getTrafficSources($db, $timeRange),
        'pagesData'      => getPagesData($db, $timeRange),
        'systemData'     => getSystemData($db, $timeRange),
        'activity'       => getActivityLog($db, $timeRange),
    ];

    $cache->set($cacheKey, $data, 300);

    echo json_encode(['status' => 'ok', 'cached' => false, 'data' => $data]);

} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function startTimestamp(string $range): int
{
    return match ($range) {
        '1h'  => time() - 3600,
        '7d'  => time() - 604800,
        '30d' => time() - 2592000,
        default => time() - 86400,  // 24h
    };
}

function getSummaryStats(Connection $db, string $range): array
{
    $since = startTimestamp($range);

    $stats = $db->fetchOne(
        'SELECT
            COUNT(*)                                              AS total_views,
            COUNT(DISTINCT ip_address)                           AS unique_visitors,
            COALESCE(AVG(NULLIF(session_duration, 0)), 0)        AS avg_session_duration,
            SUM(CASE WHEN session_duration IS NULL
                      OR session_duration = 0 THEN 1 ELSE 0 END) AS bounce_count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND is_bot = 0',
        [$since]
    );

    $totalViews    = (int) ($stats['total_views']    ?? 0);
    $uniqueVisitors = (int) ($stats['unique_visitors'] ?? 0);
    $avgDuration   = (float) ($stats['avg_session_duration'] ?? 0);
    $bounceCount   = (int) ($stats['bounce_count']   ?? 0);
    $bounceRate    = $totalViews > 0 ? round(($bounceCount / $totalViews) * 100, 1) : 0.0;

    return [
        'totalPageViews'      => $totalViews,
        'uniqueVisitors'      => $uniqueVisitors,
        'avgSessionDuration'  => (int) round($avgDuration),
        'bounceRate'          => $bounceRate,
    ];
}

function getGeoData(Connection $db, string $range): array
{
    $since = startTimestamp($range);

    $rows = $db->fetchAll(
        'SELECT
            city,
            country,
            COUNT(*)          AS visitors,
            AVG(latitude)     AS latitude,
            AVG(longitude)    AS longitude
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?)
           AND city IS NOT NULL
           AND is_bot = 0
         GROUP BY city, country
         ORDER BY visitors DESC
         LIMIT 25',
        [$since]
    );

    $geoData = [];
    foreach ((array) $rows as $idx => $row) {
        $geoData[] = [
            'id'       => $idx + 1,
            'city'     => $row['city']     ?? 'Unknown',
            'country'  => $row['country']  ?? 'Unknown',
            'visitors' => (int)   ($row['visitors']  ?? 0),
            'lat'      => (float) ($row['latitude']  ?? 0),
            'lng'      => (float) ($row['longitude'] ?? 0),
        ];
    }

    return $geoData;
}

function getTrafficSources(Connection $db, string $range): array
{
    $since = startTimestamp($range);

    $sources = $db->fetchAll(
        'SELECT traffic_source AS source, COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND traffic_source IS NOT NULL AND is_bot = 0
         GROUP BY traffic_source
         ORDER BY count DESC',
        [$since]
    );

    $nameMap  = [
        'direct'   => 'Direct',
        'organic'  => 'Organic Search',
        'social'   => 'Social Media',
        'referral' => 'Referral',
        'email'    => 'Email',
    ];
    $colorMap = [
        'direct'   => 'bg-indigo-500',
        'organic'  => 'bg-purple-500',
        'social'   => 'bg-pink-500',
        'referral' => 'bg-blue-500',
        'email'    => 'bg-green-500',
    ];

    $total      = array_sum(array_column((array) $sources, 'count'));
    $sourceList = [];
    foreach ((array) $sources as $row) {
        $src   = $row['source'] ?? 'direct';
        $count = (int) $row['count'];
        $sourceList[] = [
            'name'       => $nameMap[$src]  ?? ucfirst($src),
            'value'      => $count,
            'percentage' => $total > 0 ? (int) round($count / $total * 100) : 0,
            'color'      => $colorMap[$src] ?? 'bg-gray-500',
        ];
    }

    return [
        'sources'   => $sourceList,
        'utm'       => getUTMCampaigns($db, $since),
        'referrers' => getReferrers($db, $since),
        'keywords'  => getSearchKeywords($db, $since),
    ];
}

function getUTMCampaigns(Connection $db, int $since): array
{
    $rows = $db->fetchAll(
        'SELECT utm_campaign, COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND utm_campaign IS NOT NULL
         GROUP BY utm_campaign
         ORDER BY count DESC
         LIMIT 5',
        [$since]
    );

    $total  = array_sum(array_column((array) $rows, 'count'));
    $result = [];
    foreach ((array) $rows as $row) {
        $count    = (int) $row['count'];
        $result[] = [
            'campaign'   => $row['utm_campaign'],
            'value'      => $count,
            'percentage' => $total > 0 ? (int) round($count / $total * 100) : 0,
        ];
    }
    return $result;
}

function getReferrers(Connection $db, int $since): array
{
    $rows = $db->fetchAll(
        "SELECT
            CASE
                WHEN referrer LIKE '%google.%'   THEN 'google.com'
                WHEN referrer LIKE '%bing.%'     THEN 'bing.com'
                WHEN referrer LIKE '%linkedin.%' THEN 'linkedin.com'
                WHEN referrer LIKE '%twitter.%'
                  OR referrer LIKE '%x.com%'     THEN 'twitter.com'
                WHEN referrer LIKE '%facebook.%' THEN 'facebook.com'
                ELSE 'others'
            END AS domain,
            COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND referrer IS NOT NULL
         GROUP BY domain
         ORDER BY count DESC",
        [$since]
    );

    $total  = array_sum(array_column((array) $rows, 'count'));
    $result = [];
    foreach ((array) $rows as $row) {
        $count    = (int) $row['count'];
        $result[] = [
            'domain'     => $row['domain'],
            'value'      => $count,
            'percentage' => $total > 0 ? (int) round($count / $total * 100) : 0,
        ];
    }
    return $result;
}

function getSearchKeywords(Connection $db, int $since): array
{
    // Keywords require server-side search log; return top UTM sources as proxy
    $rows = $db->fetchAll(
        'SELECT utm_source AS keyword, COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND utm_source IS NOT NULL
         GROUP BY utm_source
         ORDER BY count DESC
         LIMIT 5',
        [$since]
    );

    $total  = array_sum(array_column((array) $rows, 'count'));
    $result = [];
    foreach ((array) $rows as $row) {
        $count    = (int) $row['count'];
        $result[] = [
            'keyword'    => $row['keyword'],
            'value'      => $count,
            'percentage' => $total > 0 ? (int) round($count / $total * 100) : 0,
        ];
    }
    return $result;
}

function getPagesData(Connection $db, string $range): array
{
    $since = startTimestamp($range);

    // Top pages from access_logs (real-time)
    $topPages = $db->fetchAll(
        'SELECT
            page_path                                                  AS path,
            COUNT(*)                                                   AS views,
            COALESCE(AVG(NULLIF(session_duration, 0)), 0)             AS avg_time,
            COUNT(CASE WHEN http_status >= 400 THEN 1 END)            AS exits
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND is_bot = 0
         GROUP BY page_path
         ORDER BY views DESC
         LIMIT 5',
        [$since]
    );

    // Entry pages: first hit per session (min created_at per session_id)
    $entryPages = $db->fetchAll(
        'SELECT page_path AS path, COUNT(*) AS views
         FROM access_logs al
         WHERE created_at >= FROM_UNIXTIME(?)
           AND session_id IS NOT NULL
           AND is_bot = 0
           AND created_at = (
               SELECT MIN(created_at)
               FROM access_logs al2
               WHERE al2.session_id = al.session_id
           )
         GROUP BY page_path
         ORDER BY views DESC
         LIMIT 5',
        [$since]
    );

    // Exit pages: last hit per session
    $exitPages = $db->fetchAll(
        'SELECT page_path AS path, COUNT(*) AS views
         FROM access_logs al
         WHERE created_at >= FROM_UNIXTIME(?)
           AND session_id IS NOT NULL
           AND is_bot = 0
           AND created_at = (
               SELECT MAX(created_at)
               FROM access_logs al2
               WHERE al2.session_id = al.session_id
           )
         GROUP BY page_path
         ORDER BY views DESC
         LIMIT 5',
        [$since]
    );

    $totalViews = array_sum(array_column((array) $topPages, 'views'));

    $topResult = [];
    foreach ((array) $topPages as $row) {
        $avgSec     = (int) $row['avg_time'];
        $topResult[] = [
            'path'    => $row['path'],
            'views'   => (int) $row['views'],
            'avgTime' => floor($avgSec / 60) . 'm ' . ($avgSec % 60) . 's',
            'exits'   => (int) $row['exits'],
        ];
    }

    $totalEntry = array_sum(array_column((array) $entryPages, 'views'));
    $entryResult = [];
    foreach ((array) $entryPages as $row) {
        $views        = (int) $row['views'];
        $entryResult[] = [
            'path'       => $row['path'],
            'views'      => $views,
            'percentage' => $totalEntry > 0 ? (int) round($views / $totalEntry * 100) : 0,
            'bounceRate' => '—',
        ];
    }

    $totalExit = array_sum(array_column((array) $exitPages, 'views'));
    $exitResult = [];
    foreach ((array) $exitPages as $row) {
        $views       = (int) $row['views'];
        $exitResult[] = [
            'path'       => $row['path'],
            'views'      => $views,
            'percentage' => $totalExit > 0 ? (int) round($views / $totalExit * 100) : 0,
        ];
    }

    return [
        'topPages'   => $topResult,
        'entryPages' => $entryResult,
        'exitPages'  => $exitResult,
    ];
}

function getSystemData(Connection $db, string $range): array
{
    $since = startTimestamp($range);

    $browsers = $db->fetchAll(
        'SELECT browser, COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND browser IS NOT NULL AND is_bot = 0
         GROUP BY browser
         ORDER BY count DESC',
        [$since]
    );

    $devices = $db->fetchAll(
        'SELECT device_type, COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND device_type IS NOT NULL AND is_bot = 0
         GROUP BY device_type
         ORDER BY count DESC',
        [$since]
    );

    $osList = $db->fetchAll(
        'SELECT os, COUNT(*) AS count
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND os IS NOT NULL AND is_bot = 0
         GROUP BY os
         ORDER BY count DESC',
        [$since]
    );

    $totalHits = (int) ($db->fetchOne(
        'SELECT COUNT(*) AS total FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND is_bot = 0',
        [$since]
    )['total'] ?? 1);

    return [
        'browsers'  => buildStats((array) $browsers,  $totalHits, 'browser'),
        'platforms' => buildStats((array) $devices,   $totalHits, 'device_type'),
        'os'        => buildStats((array) $osList,    $totalHits, 'os'),
    ];
}

function buildStats(array $rows, int $total, string $nameKey): array
{
    $result = [];
    foreach ($rows as $row) {
        $count    = (int) $row['count'];
        $result[] = [
            'name'       => $row[$nameKey] ?? 'Unknown',
            'value'      => $count,
            'percentage' => $total > 0 ? (int) round($count / $total * 100) : 0,
        ];
    }
    return $result;
}

function getActivityLog(Connection $db, string $range): array
{
    $since = startTimestamp($range);

    $rows = $db->fetchAll(
        "SELECT
            created_at,
            page_path,
            traffic_source,
            city,
            CONCAT(COALESCE(browser, 'Unknown'), '/', COALESCE(device_type, 'unknown')) AS device,
            session_duration
         FROM access_logs
         WHERE created_at >= FROM_UNIXTIME(?) AND is_bot = 0
         ORDER BY created_at DESC
         LIMIT 8",
        [$since]
    );

    $result = [];
    foreach ((array) $rows as $idx => $row) {
        $duration = (int) ($row['session_duration'] ?? 0);
        $result[] = [
            'id'        => $idx + 1,
            'timestamp' => $row['created_at'],
            'page'      => $row['page_path']     ?? '/',
            'source'    => $row['traffic_source'] ?? 'direct',
            'location'  => $row['city']           ?? 'Unknown',
            'device'    => $row['device']         ?? 'Unknown',
            'duration'  => floor($duration / 60) . 'm ' . ($duration % 60) . 's',
        ];
    }

    return $result;
}
