<?php
/**
 * Researcher Distribution API
 * GET /api/researcher_distribution.php?groupBy=country|institution&sdg=3
 * Reads from: researchers, institutions, publication_authors, work_sdgs
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

            if ($groupBy === 'institution') {
                return fetchByInstitution($pdo, $sdgFilter);
            } else {
                return fetchByCountry($pdo, $sdgFilter);
            }
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

    $stmt = $pdo->prepare(
        "SELECT
            r.country,
            COUNT(DISTINCT r.orcid) AS researcher_count,
            COUNT(DISTINCT r.institution_id) AS institution_count,
            COALESCE(AVG(r.citation_count), 0) AS avg_citations,
            COUNT(DISTINCT pa.doi) AS publication_count
        FROM researchers r
        LEFT JOIN publication_authors pa ON pa.orcid = r.orcid
        WHERE r.country IS NOT NULL AND r.country != ''
        {$whereClause}
        GROUP BY r.country
        ORDER BY researcher_count DESC"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        return [];
    }

    return array_map(function ($row) use ($pdo): array {
        return [
            'name'         => $row['country'] ?? 'Unknown',
            'researchers'  => (int) $row['researcher_count'],
            'institutions' => (int) $row['institution_count'],
            'avgImpact'    => round((float) $row['avg_citations'] ?? 0, 1),
            'publications' => (int) $row['publication_count'],
            'topField'     => getTopFieldByCountry($pdo, (string) $row['country']),
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

    return array_map(function ($row) use ($pdo): array {
        $institutionId = (int) $row['id'];
        $topField = getTopFieldForInstitution($pdo, $institutionId);

        return [
            'id'           => $institutionId,
            'name'         => $row['name'],
            'country'      => $row['country'] ?? 'Indonesia',
            'city'         => $row['city'],
            'researchers'  => (int) $row['researcher_count'],
            'avgImpact'    => round((float) $row['avg_citations'] ?? 0, 1),
            'publications' => (int) $row['publication_count'],
            'topField'     => $topField,
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
