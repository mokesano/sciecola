<?php
/**
 * Admin API: Landing-page content management
 *
 * GET    /api/admin/landing_content.php?lang=id|en  — fetch current content for editing
 * POST   /api/admin/landing_content.php             — upsert content for a language
 *
 * POST body: { "lang": "id"|"en", "content": { ... }, "updated_by": "<admin id>" }
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    if (!defined('DB_HOST') || !DB_HOST) {
        http_response_code(503);
        echo json_encode(['status' => 'error', 'message' => 'Database not configured']);
        exit;
    }

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
        DB_USERNAME, DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            $lang = strtolower(trim((string) ($_GET['lang'] ?? 'id')));
            echo json_encode(fetchContent($pdo, $lang));
            break;
        case 'POST':
        case 'PUT':
            $body = json_decode(file_get_contents('php://input'), true);
            echo json_encode(upsertContent($pdo, is_array($body) ? $body : []));
            break;
        default:
            http_response_code(405);
            echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/**
 * Fetch landing page content for a given language
 *
 * @param PDO $pdo
 * @param string $lang 'id' or 'en'
 * @return array
 */
function fetchContent(PDO $pdo, string $lang): array
{
    if (!in_array($lang, ['id', 'en'], true)) {
        return ['status' => 'error', 'message' => 'Invalid lang'];
    }

    $stmt = $pdo->prepare(
        'SELECT content, updated_at, updated_by FROM landing_content WHERE lang = :lang LIMIT 1'
    );
    $stmt->execute([':lang' => $lang]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return ['status' => 'empty', 'lang' => $lang];
    }

    return [
        'status'     => 'success',
        'lang'       => $lang,
        'content'    => json_decode($row['content'], true),
        'updated_at' => $row['updated_at'],
        'updated_by' => $row['updated_by'],
    ];
}

/**
 * Upsert landing page content for a given language
 *
 * @param PDO $pdo
 * @param array $input
 * @return array
 */
function upsertContent(PDO $pdo, array $input): array
{
    if (empty($input)) {
        return ['status' => 'error', 'message' => 'Invalid JSON body'];
    }

    $lang = strtolower(trim((string) ($input['lang'] ?? '')));
    if (!in_array($lang, ['id', 'en'], true)) {
        return ['status' => 'error', 'message' => 'Invalid lang'];
    }

    if (!isset($input['content']) || !is_array($input['content'])) {
        return ['status' => 'error', 'message' => 'Missing content object'];
    }

    $contentJson = json_encode($input['content'], JSON_UNESCAPED_UNICODE);
    $updatedBy   = isset($input['updated_by']) ? substr((string) $input['updated_by'], 0, 64) : null;

    $stmt = $pdo->prepare(
        'INSERT INTO landing_content (lang, content, updated_by)
         VALUES (:lang, :content, :updated_by)
         ON DUPLICATE KEY UPDATE
            content    = VALUES(content),
            updated_by = VALUES(updated_by)'
    );
    $stmt->execute([
        ':lang'       => $lang,
        ':content'    => $contentJson,
        ':updated_by' => $updatedBy,
    ]);

    return [
        'status' => 'success',
        'lang'   => $lang,
        'saved'  => true,
    ];
}
