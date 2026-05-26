<?php
declare(strict_types=1);
// =============================================================
// WIZDAM API KEY GENERATOR
// Membuat API key untuk sdgs-mapper agar bisa memanggil wizdam-apis
// =============================================================
// Jalankan sekali dari CLI:
//   php tools/generate-api-key.php
//
// Atau via browser (admin-protected):
//   https://yourdomain.com/tools/generate-api-key.php
// =============================================================

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}

$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Database\Connection;

$isCli = PHP_SAPI === 'cli';

// ─── Auth untuk akses web ────────────────────────────────────
if (!$isCli) {
    session_start();
    $adminToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    $envToken   = defined('ADMIN_TOOL_TOKEN') ? ADMIN_TOOL_TOKEN : getenv('ADMIN_TOOL_TOKEN');
    $isAdmin    = (!empty($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin')
               || ($envToken && hash_equals($envToken, $adminToken));

    if (!$isAdmin) {
        http_response_code(403);
        die('<h1>403 Forbidden</h1>');
    }
}

// ─── Generate key ─────────────────────────────────────────────
function generate_wizdam_key(string $userId, string $sharedSecret): array
{
    $ts     = (string) time();
    $hmac16 = substr(hash_hmac('sha256', $userId . ':' . $ts, $sharedSecret), 0, 16);
    $rawKey = 'wz_' . $userId . '_' . $ts . '_' . $hmac16;
    $hash   = hash('sha256', $rawKey);

    return ['raw' => $rawKey, 'hash' => $hash, 'user_id' => $userId];
}

$action = $_POST['action'] ?? $_GET['action'] ?? ($isCli ? 'generate' : null);

if ($action === 'generate') {
    $userId       = $_POST['user_id'] ?? 'sdgsmapper';
    $sharedSecret = defined('WIZDAM_SHARED_SECRET')
                  ? WIZDAM_SHARED_SECRET
                  : (getenv('WIZDAM_SHARED_SECRET') ?: '');

    if (empty($sharedSecret)) {
        $msg = 'ERROR: WIZDAM_SHARED_SECRET belum di-set di .env';
        if ($isCli) { echo $msg . PHP_EOL; exit(1); }
        else        { http_response_code(500); echo json_encode(['error' => $msg]); exit; }
    }

    $key = generate_wizdam_key($userId, $sharedSecret);

    try {
        $db = Connection::getInstance();

        // Nonaktifkan key lama untuk user yang sama
        $db->query(
            'UPDATE api_keys SET is_active = 0 WHERE user_id = ?',
            [$userId]
        );

        // Simpan key baru
        $db->insert('api_keys', [
            'key_hash'  => $key['hash'],
            'user_id'   => $key['user_id'],
            'is_active' => 1,
        ]);

        if ($isCli) {
            echo "═══════════════════════════════════════════════" . PHP_EOL;
            echo "  Wizdam API Key Generated" . PHP_EOL;
            echo "═══════════════════════════════════════════════" . PHP_EOL;
            echo "  User ID  : " . $key['user_id'] . PHP_EOL;
            echo "  Raw Key  : " . $key['raw'] . PHP_EOL;
            echo "  Key Hash : " . $key['hash'] . PHP_EOL;
            echo "═══════════════════════════════════════════════" . PHP_EOL;
            echo PHP_EOL . "Tambahkan baris berikut ke .env:" . PHP_EOL;
            echo "WIZDAM_API_KEY=" . $key['raw'] . PHP_EOL;
        } else {
            header('Content-Type: application/json');
            echo json_encode([
                'status'   => 'ok',
                'user_id'  => $key['user_id'],
                'raw_key'  => $key['raw'],
                'key_hash' => $key['hash'],
                'note'     => 'Tambahkan WIZDAM_API_KEY=' . $key['raw'] . ' ke file .env',
            ]);
        }

    } catch (Throwable $e) {
        $msg = 'DB Error: ' . $e->getMessage();
        if ($isCli) { echo $msg . PHP_EOL; exit(1); }
        else        { http_response_code(500); echo json_encode(['error' => $msg]); exit; }
    }
    exit;
}

// ─── Web UI ──────────────────────────────────────────────────
if (!$isCli):
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Wizdam API Key Generator</title>
    <style>
        body { font-family: monospace; background: #0f0f0f; color: #ccc; padding: 24px; }
        .wrap { max-width: 600px; margin: 0 auto; }
        h2 { color: #fff; margin-bottom: 16px; }
        label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
        input { width: 100%; padding: 10px; background: #1e1e1e; border: 1px solid #444; color: #fff; border-radius: 4px; font-family: monospace; margin-bottom: 14px; }
        button { padding: 10px 24px; background: #e84393; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        button:hover { background: #c73379; }
        pre { background: #000; padding: 16px; border-radius: 6px; font-size: 13px; overflow-x: auto; margin-top: 16px; color: #2ed573; min-height: 60px; }
    </style>
</head>
<body>
<div class="wrap">
    <h2>🔑 Wizdam API Key Generator</h2>
    <form id="form">
        <label>User ID (nama aplikasi)</label>
        <input type="text" id="userId" value="sdgsmapper">
        <button type="submit">Generate Key</button>
    </form>
    <pre id="result">Tekan Generate untuk membuat key baru...</pre>
</div>
<script>
document.getElementById('form').addEventListener('submit', e => {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    fetch('?action=generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'user_id=' + encodeURIComponent(userId)
    })
    .then(r => r.json())
    .then(d => {
        if (d.error) {
            document.getElementById('result').style.color = '#ff4757';
            document.getElementById('result').textContent = 'Error: ' + d.error;
        } else {
            document.getElementById('result').style.color = '#2ed573';
            document.getElementById('result').textContent =
                'Raw Key  : ' + d.raw_key + '\n' +
                'Key Hash : ' + d.key_hash + '\n\n' +
                '.env:\nWIZDAM_API_KEY=' + d.raw_key;
        }
    })
    .catch(e => {
        document.getElementById('result').style.color = '#ff4757';
        document.getElementById('result').textContent = 'Error: ' + e.message;
    });
});
</script>
</body>
</html>
<?php
endif;
