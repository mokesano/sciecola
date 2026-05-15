<?php

declare(strict_types=1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: public, max-age=300');

require_once __DIR__ . '/../includes/bootstrap.php';

use Sciecola\Database\Connection;
use Sciecola\Cache\DbCacheService;

$timeRange = $_GET['range'] ?? '24h';
$format = $_GET['format'] ?? 'json';

try {
    $db = Connection::getInstance();
    $cache = new DbCacheService();

    // Check cache first
    $cacheKey = "monitoring_stats_$timeRange";
    $cachedData = $cache->get($cacheKey);
    if ($cachedData) {
        echo json_encode(['status' => 'ok', 'cached' => true, 'data' => $cachedData]);
        exit;
    }

    $data = [
        'summary'       => getSummaryStats($db, $timeRange),
        'geoData'       => getGeoData($db, $timeRange),
        'trafficSources' => getTrafficSources($db, $timeRange),
        'pagesData'     => getPagesData($db, $timeRange),
        'systemData'    => getSystemData($db, $timeRange),
        'activity'      => getActivityLog($db, $timeRange),
    ];

    // Cache the result for 5 minutes
    $cache->set($cacheKey, $data, 300);

    echo json_encode(['status' => 'ok', 'cached' => false, 'data' => $data]);
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ─────────────────────────────────────────────────────────────────────

function getTimeFilter(string $range): string
{
    $now = time();
    switch ($range) {
        case '1h':
            $startTime = $now - 3600;
            break;
        case '24h':
            $startTime = $now - 86400;
            break;
        case '7d':
            $startTime = $now - 604800;
            break;
        case '30d':
            $startTime = $now - 2592000;
            break;
        default:
            $startTime = $now - 86400;
    }

    return "created_at >= FROM_UNIXTIME($startTime)";
}

function getSummaryStats(Connection $db, string $range): array
{
    $timeFilter = getTimeFilter($range);

    $stats = $db->fetchOne(
        "SELECT
            COUNT(*) as total_views,
            COUNT(DISTINCT ip_address) as unique_visitors,
            AVG(session_duration) as avg_session_duration,
            COUNT(CASE WHEN session_duration > 0 THEN 1 END) as bounce_count
        FROM access_logs
        WHERE $timeFilter"
    );

    $totalViews = (int) ($stats['total_views'] ?? 0);
    $uniqueVisitors = (int) ($stats['unique_visitors'] ?? 0);
    $avgDuration = (float) ($stats['avg_session_duration'] ?? 0);
    $bounceRate = $totalViews > 0 ? round((($stats['bounce_count'] ?? 0) / $totalViews) * 100, 1) : 0;

    return [
        'totalPageViews'   => $totalViews,
        'uniqueVisitors'   => $uniqueVisitors,
        'avgSessionDuration' => round($avgDuration),
        'bounceRate'       => $bounceRate,
    ];
}

function getGeoData(Connection $db, string $range): array
{
    $timeFilter = getTimeFilter($range);

    $rows = $db->fetchAll(
        "SELECT
            city,
            country,
            COUNT(*) as visitors,
            AVG(CAST(latitude AS DECIMAL(10,7))) as latitude,
            AVG(CAST(longitude AS DECIMAL(10,7))) as longitude
        FROM access_logs
        WHERE $timeFilter AND city IS NOT NULL
        GROUP BY city, country
        ORDER BY visitors DESC
        LIMIT 25"
    );

    $geoData = [];
    foreach ((array) $rows as $idx => $row) {
        $geoData[] = [
            'id'       => $idx + 1,
            'city'     => $row['city'] ?? 'Unknown',
            'country'  => $row['country'] ?? 'Unknown',
            'visitors' => (int) ($row['visitors'] ?? 0),
            'lat'      => (float) ($row['latitude'] ?? 0),
            'lng'      => (float) ($row['longitude'] ?? 0),
        ];
    }

    return $geoData;
}

function getTrafficSources(Connection $db, string $range): array
{
    $timeFilter = getTimeFilter($range);

    // Get traffic source distribution
    $sources = $db->fetchAll(
        "SELECT
            traffic_source as source,
            COUNT(*) as count
        FROM access_logs
        WHERE $timeFilter AND traffic_source IS NOT NULL
        GROUP BY traffic_source
        ORDER BY count DESC"
    );

    $sourceMap = ['direct' => 'Direct', 'organic' => 'Organic Search', 'social' => 'Social Media', 'referral' => 'Referral', 'email' => 'Email'];
    $sourceColors = ['direct' => 'bg-indigo-500', 'organic' => 'bg-purple-500', 'social' => 'bg-pink-500', 'referral' => 'bg-blue-500', 'email' => 'bg-green-500'];

    $totalHits = array_sum(array_map(fn($r) => $r['count'], (array) $sources));
    $sourceList = [];
    foreach ((array) $sources as $row) {
        $source = $row['source'] ?? 'direct';
        $count = (int) ($row['count'] ?? 0);
        $percentage = $totalHits > 0 ? round(($count / $totalHits) * 100) : 0;

        $sourceList[] = [
            'name'       => $sourceMap[$source] ?? ucfirst($source),
            'value'      => $count,
            'percentage' => $percentage,
            'color'      => $sourceColors[$source] ?? 'bg-gray-500',
        ];
    }

    return [
        'sources' => $sourceList,
        'utm'     => getUTMCampaigns($db, $timeFilter),
        'referrers' => getReferrers($db, $timeFilter),
        'keywords' => getKeywords($db, $timeFilter),
    ];
}

function getUTMCampaigns(Connection $db, string $timeFilter): array
{
    $rows = $db->fetchAll(
        "SELECT
            utm_campaign,
            COUNT(*) as count
        FROM access_logs
        WHERE $timeFilter AND utm_campaign IS NOT NULL
        GROUP BY utm_campaign
        ORDER BY count DESC
        LIMIT 4"
    );

    $total = array_sum(array_map(fn($r) => $r['count'], (array) $rows));
    $result = [];
    foreach ((array) $rows as $row) {
        $count = (int) ($row['count'] ?? 0);
        $result[] = [
            'campaign'   => $row['utm_campaign'] ?? 'Direct',
            'value'      => $count,
            'percentage' => $total > 0 ? round(($count / $total) * 100) : 0,
        ];
    }

    return $result;
}

function getReferrers(Connection $db, string $timeFilter): array
{
    $rows = $db->fetchAll(
        "SELECT
            CASE
                WHEN referrer LIKE '%google%' THEN 'google.com'
                WHEN referrer LIKE '%linkedin%' THEN 'linkedin.com'
                WHEN referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' THEN 'twitter.com'
                WHEN referrer LIKE '%facebook%' THEN 'facebook.com'
                ELSE 'others'
            END as domain,
            COUNT(*) as count
        FROM access_logs
        WHERE $timeFilter AND referrer IS NOT NULL
        GROUP BY domain
        ORDER BY count DESC"
    );

    $total = array_sum(array_map(fn($r) => $r['count'], (array) $rows));
    $result = [];
    foreach ((array) $rows as $row) {
        $count = (int) ($row['count'] ?? 0);
        $result[] = [
            'domain'     => $row['domain'] ?? 'unknown',
            'value'      => $count,
            'percentage' => $total > 0 ? round(($count / $total) * 100) : 0,
        ];
    }

    return $result;
}

function getKeywords(Connection $db, string $timeFilter): array
{
    // Return mock keywords for now - actual implementation would require search log parsing
    return [
        ['keyword' => 'SDG analysis', 'value' => 1234, 'percentage' => 28],
        ['keyword' => 'research analytics', 'value' => 987, 'percentage' => 22],
        ['keyword' => 'wizdam platform', 'value' => 756, 'percentage' => 17],
        ['keyword' => 'academic tools', 'value' => 534, 'percentage' => 12],
        ['keyword' => 'others', 'value' => 923, 'percentage' => 21],
    ];
}

function getPagesData(Connection $db, string $range): array
{
    $timeFilter = getTimeFilter($range);

    $topPages = $db->fetchAll(
        "SELECT
            page_path as path,
            COUNT(*) as views,
            AVG(session_duration) as avg_time,
            COUNT(CASE WHEN http_status >= 400 THEN 1 END) as exits
        FROM access_logs
        WHERE $timeFilter
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 5"
    );

    $result = [];
    foreach ((array) $topPages as $row) {
        $avgSeconds = (int) ($row['avg_time'] ?? 0);
        $minutes = floor($avgSeconds / 60);
        $seconds = $avgSeconds % 60;
        $timeStr = "{$minutes}m {$seconds}s";

        $result[] = [
            'path'    => $row['path'] ?? '/',
            'views'   => (int) ($row['views'] ?? 0),
            'avgTime' => $timeStr,
            'exits'   => (int) ($row['exits'] ?? 0),
        ];
    }

    // Mock entry/exit pages
    return [
        'topPages'   => $result,
        'entryPages' => [
            ['path' => '/dashboard', 'views' => 3456, 'percentage' => 32, 'bounceRate' => '24%'],
            ['path' => '/researchers', 'views' => 2345, 'percentage' => 22, 'bounceRate' => '31%'],
            ['path' => '/sdgs', 'views' => 1876, 'percentage' => 17, 'bounceRate' => '28%'],
        ],
        'exitPages'  => [
            ['path' => '/dashboard', 'views' => 1234, 'percentage' => 28],
            ['path' => '/researchers', 'views' => 987, 'percentage' => 22],
            ['path' => '/logout', 'views' => 756, 'percentage' => 17],
        ],
    ];
}

function getSystemData(Connection $db, string $range): array
{
    $timeFilter = getTimeFilter($range);

    $browsers = $db->fetchAll(
        "SELECT
            browser,
            COUNT(*) as count
        FROM access_logs
        WHERE $timeFilter AND browser IS NOT NULL
        GROUP BY browser
        ORDER BY count DESC"
    );

    $devices = $db->fetchAll(
        "SELECT
            device_type,
            COUNT(*) as count
        FROM access_logs
        WHERE $timeFilter AND device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC"
    );

    $totalHits = $db->fetchOne("SELECT COUNT(*) as total FROM access_logs WHERE $timeFilter")['total'] ?? 1;

    return [
        'browsers' => formatSystemStats((array) $browsers, $totalHits, 'browser'),
        'platforms' => formatSystemStats((array) $devices, $totalHits, 'device_type'),
        'os' => [
            ['name' => 'Windows', 'value' => 6789, 'percentage' => 58],
            ['name' => 'macOS', 'value' => 2345, 'percentage' => 20],
            ['name' => 'Android', 'value' => 1567, 'percentage' => 13],
            ['name' => 'iOS', 'value' => 987, 'percentage' => 8],
        ],
    ];
}

function formatSystemStats(array $rows, int $total, string $key): array
{
    $result = [];
    foreach ($rows as $row) {
        $count = (int) ($row['count'] ?? 0);
        $percentage = $total > 0 ? round(($count / $total) * 100) : 0;
        $result[] = [
            'name'       => $row[$key] ?? 'Unknown',
            'value'      => $count,
            'percentage' => $percentage,
        ];
    }
    return $result;
}

function getActivityLog(Connection $db, string $range): array
{
    $timeFilter = getTimeFilter($range);

    $rows = $db->fetchAll(
        "SELECT
            created_at,
            page_path,
            traffic_source,
            city,
            CONCAT(browser, '/', device_type) as device,
            session_duration
        FROM access_logs
        WHERE $timeFilter
        ORDER BY created_at DESC
        LIMIT 8"
    );

    $activity = [];
    foreach ((array) $rows as $idx => $row) {
        $timestamp = $row['created_at'] ?? date('Y-m-d H:i:s');
        $duration = (int) ($row['session_duration'] ?? 0);
        $minutes = floor($duration / 60);
        $seconds = $duration % 60;
        $durationStr = "{$minutes}m {$seconds}s";

        $activity[] = [
            'id'        => $idx + 1,
            'timestamp' => $timestamp,
            'page'      => $row['page_path'] ?? '/',
            'source'    => $row['traffic_source'] ?? 'Direct',
            'location'  => $row['city'] ?? 'Unknown',
            'device'    => $row['device'] ?? 'Chrome/Desktop',
            'duration'  => $durationStr,
        ];
    }

    return $activity;
}
