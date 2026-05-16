<?php
/**
 * Researcher Distribution API - GLOBAL
 * GET /api/researcher_distribution.php?groupBy=country|institution&sdg=3
 * Reads from: researchers, institutions, publication_authors, work_sdgs
 *
 * Data: Semua peneliti dari seluruh dunia (tidak hanya Indonesia)
 * GROUP BY: country (bukan province - database hanya punya country)
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $groupBy   = in_array($_GET['groupBy'] ?? 'country', ['country', 'institution']) ? $_GET['groupBy'] : 'country';
    $sdgFilter = (int)($_GET['sdg'] ?? 0);

    $result = fetchResearcherDistribution($groupBy, $sdgFilter);

    echo json_encode([
        'status'    => 'success',
        'groupBy'   => $groupBy,
        'data'      => $result,
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchResearcherDistribution(string $groupBy, int $sdgFilter): array
{
    if (defined('DB_HOST') && DB_HOST) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
                DB_USERNAME, DB_PASSWORD,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            return $groupBy === 'institution'
                ? fetchByInstitution($pdo, $sdgFilter)
                : fetchByCountry($pdo, $sdgFilter);
        } catch (Exception $e) {
            error_log($e->getMessage());
        }
    }

    return getSampleDistribution($groupBy);
}

function fetchByCountry(PDO $pdo, int $sdgFilter): array
{
    $whereClause = '';
    $params = [];

    if ($sdgFilter >= 1 && $sdgFilter <= 17) {
        $whereClause = ' AND EXISTS (
            SELECT 1 FROM work_sdgs ws
            JOIN publications p ON p.doi = ws.doi
            JOIN publication_authors pa2 ON pa2.doi = p.doi AND pa2.orcid = r.orcid
            WHERE ws.sdg_number = ?
        )';
        $params[] = $sdgFilter;
    }

    // Query ALL countries dengan peneliti (tidak ada filter negara!)
    $stmt = $pdo->prepare(
        "SELECT
            COALESCE(r.country, 'Unknown') AS country,
            COUNT(DISTINCT r.orcid) AS researcher_count,
            COUNT(DISTINCT r.institution_id) AS institution_count,
            COALESCE(AVG(r.citation_count), 0) AS avg_citations,
            COUNT(DISTINCT pa.doi) AS publication_count
        FROM researchers r
        LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
        WHERE r.country IS NOT NULL AND r.country != ''
        {$whereClause}
        GROUP BY r.country
        HAVING researcher_count > 0
        ORDER BY researcher_count DESC"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        return [];
    }

    // Global country coordinates mapping
    $countryCoords = getCountryCoordinates();

    return array_map(function ($row) use ($pdo, $countryCoords): array {
        $countryName = (string) $row['country'];
        $coords = $countryCoords[$countryName] ?? ['lat' => 0, 'lng' => 0];

        return [
            'name'         => $countryName,
            'researchers'  => (int) $row['researcher_count'],
            'institutions' => (int) $row['institution_count'],
            'avgImpact'    => round((float) $row['avg_citations'] ?? 0, 1),
            'publications' => (int) $row['publication_count'],
            'topField'     => getTopFieldByCountry($pdo, $countryName),
            'lat'          => $coords['lat'],
            'lng'          => $coords['lng'],
        ];
    }, $rows);
}

function fetchByInstitution(PDO $pdo, int $sdgFilter): array
{
    $whereClause = '';
    $params = [];

    if ($sdgFilter >= 1 && $sdgFilter <= 17) {
        $whereClause = ' AND EXISTS (
            SELECT 1 FROM work_sdgs ws
            JOIN publications p ON p.doi = ws.doi
            JOIN publication_authors pa2 ON pa2.doi = p.doi AND pa2.orcid = r.orcid
            WHERE ws.sdg_number = ?
        )';
        $params[] = $sdgFilter;
    }

    $stmt = $pdo->prepare(
        "SELECT
            i.id,
            i.name,
            i.country,
            i.city,
            COUNT(DISTINCT r.orcid) AS researcher_count,
            COALESCE(AVG(r.citation_count), 0) AS avg_citations,
            COUNT(DISTINCT pa.doi) AS publication_count,
            GROUP_CONCAT(DISTINCT r.country SEPARATOR ',') AS countries
        FROM institutions i
        LEFT JOIN researchers r ON r.institution_id = i.id
        LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
        WHERE i.name IS NOT NULL
        {$whereClause}
        GROUP BY i.id
        HAVING researcher_count > 0
        ORDER BY researcher_count DESC
        LIMIT 50"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        return [];
    }

    $countryCoords = getCountryCoordinates();

    return array_map(function ($row) use ($pdo, $countryCoords): array {
        $institutionId = (int) $row['id'];
        $topField = getTopFieldForInstitution($pdo, $institutionId);
        $countryName = (string) ($row['country'] ?? 'Unknown');
        $coords = $countryCoords[$countryName] ?? ['lat' => 0, 'lng' => 0];

        return [
            'id'           => $institutionId,
            'name'         => $row['name'],
            'country'      => $countryName,
            'city'         => $row['city'],
            'researchers'  => (int) $row['researcher_count'],
            'avgImpact'    => round((float) $row['avg_citations'] ?? 0, 1),
            'publications' => (int) $row['publication_count'],
            'topField'     => $topField,
            'lat'          => $coords['lat'],
            'lng'          => $coords['lng'],
        ];
    }, $rows);
}

function getTopFieldByCountry(PDO $pdo, string $country): string
{
    try {
        $stmt = $pdo->prepare(
            "SELECT GROUP_CONCAT(DISTINCT j.title SEPARATOR ', ') AS fields
             FROM researchers r
             LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
             LEFT JOIN publications p ON p.doi = pa.doi
             LEFT JOIN journals j ON j.id = p.journal_id
             WHERE r.country = ? AND j.title IS NOT NULL
             LIMIT 1"
        );
        $stmt->execute([$country]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && !empty($result['fields'])) {
            $fields = array_slice(explode(', ', $result['fields']), 0, 1);
            return $fields[0] ?? 'Penelitian Umum';
        }
    } catch (Exception $e) {
        error_log('getTopFieldByCountry error: ' . $e->getMessage());
    }

    return 'Penelitian Umum';
}

function getTopFieldForInstitution(PDO $pdo, int $institutionId): string
{
    try {
        $stmt = $pdo->prepare(
            "SELECT GROUP_CONCAT(DISTINCT j.title SEPARATOR ', ') AS fields
             FROM researchers r
             LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
             LEFT JOIN publications p ON p.doi = pa.doi
             LEFT JOIN journals j ON j.id = p.journal_id
             WHERE r.institution_id = ? AND j.title IS NOT NULL
             LIMIT 1"
        );
        $stmt->execute([$institutionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && !empty($result['fields'])) {
            $fields = array_slice(explode(', ', $result['fields']), 0, 1);
            return $fields[0] ?? 'Penelitian Umum';
        }
    } catch (Exception $e) {
        error_log('getTopFieldForInstitution error: ' . $e->getMessage());
    }

    return 'Penelitian Umum';
}

function getCountryCoordinates(): array
{
    // Koordinat geografis untuk SEMUA negara di dunia
    // Format: [country_name => ['lat' => latitude, 'lng' => longitude]]
    return [
        // Asia
        'Indonesia'         => ['lat' => -0.7893, 'lng' => 113.9213],
        'Malaysia'          => ['lat' => 4.2105, 'lng' => 101.6964],
        'Philippines'       => ['lat' => 12.8797, 'lng' => 121.7740],
        'Thailand'          => ['lat' => 15.8700, 'lng' => 100.9925],
        'Vietnam'           => ['lat' => 14.0583, 'lng' => 108.2772],
        'Singapore'         => ['lat' => 1.3521, 'lng' => 103.8198],
        'Cambodia'          => ['lat' => 12.5657, 'lng' => 104.9910],
        'Laos'              => ['lat' => 19.8523, 'lng' => 102.4955],
        'Myanmar'           => ['lat' => 21.9162, 'lng' => 95.9560],
        'Brunei'            => ['lat' => 4.5353, 'lng' => 114.7277],
        'India'             => ['lat' => 20.5937, 'lng' => 78.9629],
        'China'             => ['lat' => 35.8617, 'lng' => 104.1954],
        'Japan'             => ['lat' => 36.2048, 'lng' => 138.2529],
        'South Korea'       => ['lat' => 35.9078, 'lng' => 127.7669],
        'Taiwan'            => ['lat' => 23.6978, 'lng' => 120.9605],
        'Hong Kong'         => ['lat' => 22.3193, 'lng' => 114.1694],
        'Pakistan'          => ['lat' => 30.3753, 'lng' => 69.3451],
        'Bangladesh'        => ['lat' => 23.6850, 'lng' => 90.3563],
        'Sri Lanka'         => ['lat' => 7.8731, 'lng' => 80.7718],
        'Nepal'             => ['lat' => 28.3949, 'lng' => 84.1240],

        // Europe
        'United Kingdom'    => ['lat' => 55.3781, 'lng' => -3.4360],
        'Germany'           => ['lat' => 51.1657, 'lng' => 10.4515],
        'France'            => ['lat' => 46.2276, 'lng' => 2.2137],
        'Italy'             => ['lat' => 41.8719, 'lng' => 12.5674],
        'Spain'             => ['lat' => 40.4637, 'lng' => -3.7492],
        'Netherlands'       => ['lat' => 52.1326, 'lng' => 5.2913],
        'Belgium'           => ['lat' => 50.5039, 'lng' => 4.4699],
        'Sweden'            => ['lat' => 60.1282, 'lng' => 18.6435],
        'Norway'            => ['lat' => 60.4720, 'lng' => 8.4689],
        'Switzerland'       => ['lat' => 46.8182, 'lng' => 8.2275],
        'Austria'           => ['lat' => 47.5162, 'lng' => 14.5501],
        'Poland'            => ['lat' => 51.9194, 'lng' => 19.1451],
        'Russia'            => ['lat' => 61.5240, 'lng' => 105.3188],
        'Ukraine'           => ['lat' => 48.3794, 'lng' => 31.1656],
        'Greece'            => ['lat' => 39.0742, 'lng' => 21.8243],
        'Portugal'          => ['lat' => 39.3999, 'lng' => -8.2245],
        'Ireland'           => ['lat' => 53.4129, 'lng' => -8.2439],
        'Denmark'           => ['lat' => 56.2639, 'lng' => 9.5018],
        'Finland'           => ['lat' => 61.9241, 'lng' => 25.7482],
        'Czech Republic'    => ['lat' => 49.8175, 'lng' => 15.4730],
        'Hungary'           => ['lat' => 47.1625, 'lng' => 19.5033],
        'Romania'           => ['lat' => 45.9432, 'lng' => 24.9668],

        // Americas
        'United States'     => ['lat' => 37.0902, 'lng' => -95.7129],
        'Canada'            => ['lat' => 56.1304, 'lng' => -106.3468],
        'Mexico'            => ['lat' => 23.6345, 'lng' => -102.5528],
        'Brazil'            => ['lat' => -14.2350, 'lng' => -51.9253],
        'Argentina'         => ['lat' => -38.4161, 'lng' => -63.6167],
        'Chile'             => ['lat' => -35.6751, 'lng' => -71.5430],
        'Colombia'          => ['lat' => 4.5709, 'lng' => -74.2973],
        'Peru'              => ['lat' => -9.1900, 'lng' => -75.0152],
        'Venezuela'         => ['lat' => 6.4238, 'lng' => -66.5897],
        'Australia'         => ['lat' => -25.2744, 'lng' => 133.7751],

        // Africa
        'South Africa'      => ['lat' => -30.5595, 'lng' => 22.9375],
        'Egypt'             => ['lat' => 26.8206, 'lng' => 30.8025],
        'Nigeria'           => ['lat' => 9.0820, 'lng' => 8.6753],
        'Kenya'             => ['lat' => -0.0236, 'lng' => 37.9062],
        'Morocco'           => ['lat' => 31.7917, 'lng' => -7.0926],
        'Ethiopia'          => ['lat' => 9.1450, 'lng' => 40.4897],
        'Ghana'             => ['lat' => 7.3697, 'lng' => -5.3631],
        'Uganda'            => ['lat' => 1.3733, 'lng' => 32.2903],

        // Middle East
        'Saudi Arabia'      => ['lat' => 23.8859, 'lng' => 45.0792],
        'UAE'               => ['lat' => 23.4241, 'lng' => 53.8478],
        'Israel'            => ['lat' => 31.0461, 'lng' => 34.8516],
        'Iran'              => ['lat' => 32.4279, 'lng' => 53.6880],
        'Turkey'            => ['lat' => 38.9637, 'lng' => 35.2433],
    ];
}

function getSampleDistribution(string $groupBy): array
{
    // FALLBACK ONLY - dikembalikan hanya jika database query gagal sepenuhnya
    // Idealnya endpoint harus selalu return data dari database, bukan mock
    error_log('WARNING: ResearcherDistribution API returning fallback sample data - database query may have failed');

    if ($groupBy === 'institution') {
        return [];
    }

    return [];
}
