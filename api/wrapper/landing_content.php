<?php
/**
 * Public landing-page narrative content.
 * GET /api/landing_content.php?lang=id|en
 *
 * Mengembalikan JSON content untuk PublicHomePage. Frontend wajib
 * memiliki fallback (locale files) bila response tidak berisi konten —
 * endpoint ini TIDAK menyertakan teks bawaan/mock di sisi server.
 *
 * @author Claude Code
 * @version 1.0.0
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $lang = strtolower(trim($_GET['lang'] ?? 'id'));
    if (!in_array($lang, ['id', 'en'], true)) {
        $lang = 'id';
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        echo json_encode([
            'status'  => 'empty',
            'lang'    => $lang,
            'message' => 'Database not configured',
        ]);
        exit;
    }

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
        DB_USERNAME, DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare(
        'SELECT content, updated_at FROM landing_content WHERE lang = :lang LIMIT 1'
    );
    $stmt->execute([':lang' => $lang]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            'status' => 'empty',
            'lang'   => $lang,
        ]);
        exit;
    }

    $content = json_decode($row['content'], true);

    echo json_encode([
        'status'     => 'success',
        'lang'       => $lang,
        'content'    => $content,
        'updated_at' => $row['updated_at'],
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
