<?php
declare(strict_types=1);

/**
 * @file api/admin/payments.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_admin
 * @brief Admin → Pembayaran: status gateway, pilihan gateway, pembayaran manual, daftar transaksi.
 *
 * GET  [?status=pending|paid|failed|expired&q=]   → { config, settings, payments[], totals }
 * POST { action: settings, values: { provider, manualEnabled } }
 * POST { action: sync, order_id }                 → tanya status terbaru ke gateway
 *
 * Kunci API tidak pernah dikirim; yang ditampilkan hanya "terpasang / belum" dan mode.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\AdminGuard;
use Sciecola\Auth\UserAuth;
use Sciecola\Database\Db;
use Sciecola\Payment\PaymentService as Pay;
use Sciecola\Support\AppSettings;

AdminGuard::require();

function padm2_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function padm2_config(): array
{
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'domain-anda');
    $base = 'https://' . $host . '/api/payment_webhook.php?provider=';
    return [
        'midtrans' => ['configured' => Pay::midtransConfigured(), 'production' => Pay::midtransProduction(), 'webhook_url' => $base . 'midtrans'],
        'xendit'   => ['configured' => Pay::xenditConfigured(), 'callback_token' => getenv('XENDIT_CALLBACK_TOKEN') !== false && getenv('XENDIT_CALLBACK_TOKEN') !== '', 'webhook_url' => $base . 'xendit'],
        'active'   => Pay::activeGateway(),
        'manual'   => Pay::manualAvailable(),
    ];
}

try {
    $pdo = Db::pdo();
    if (!$pdo) padm2_out(['status' => 'error', 'message' => 'Database tidak dapat dihubungi'], 503);
    Pay::ensure($pdo);
    $admin = UserAuth::current();

    if (AdminGuard::method() === 'GET') {
        $where = [];
        $params = [];
        $status = (string) ($_GET['status'] ?? '');
        if (in_array($status, ['pending', 'paid', 'failed', 'expired'], true)) { $where[] = 'p.status = ?'; $params[] = $status; }
        $q = trim((string) ($_GET['q'] ?? ''));
        if ($q !== '') { $where[] = '(p.order_id LIKE ? OR p.description LIKE ? OR u.email LIKE ?)'; array_push($params, "%{$q}%", "%{$q}%", "%{$q}%"); }
        $st = $pdo->prepare('SELECT p.*, u.email AS user_email, u.name AS user_name FROM payments p LEFT JOIN user_accounts u ON u.id = p.user_id'
                          . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY p.id DESC LIMIT 300');
        $st->execute($params);
        $rows = array_map(static function ($r) { unset($r['meta']); $r['amount'] = (float) $r['amount']; return $r; }, $st->fetchAll(PDO::FETCH_ASSOC));
        $totals = ['paid_count' => 0, 'paid_amount' => 0.0, 'pending_count' => 0];
        foreach ($pdo->query("SELECT status, COUNT(*) n, COALESCE(SUM(amount),0) s FROM payments WHERE currency = 'IDR' GROUP BY status") as $r) {
            if ($r['status'] === 'paid') { $totals['paid_count'] = (int) $r['n']; $totals['paid_amount'] = (float) $r['s']; }
            if ($r['status'] === 'pending') $totals['pending_count'] = (int) $r['n'];
        }
        padm2_out(['status' => 'success', 'config' => padm2_config(), 'settings' => Pay::settings(), 'payments' => $rows, 'totals' => $totals]);
    }
    if (AdminGuard::method() !== 'POST') padm2_out(['status' => 'error', 'message' => 'Method not allowed'], 405);

    $in = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($in['action'] ?? '');

    if ($action === 'settings') {
        $values = is_array($in['values'] ?? null) ? $in['values'] : [];
        $change = AppSettings::save('payments', $values, $admin ? (int) $admin['id'] : null);
        AppSettings::audit($admin, 'settings.payments', 'payments', $change['old'], $change['new']);
        padm2_out(['status' => 'success', 'settings' => Pay::settings(), 'config' => padm2_config()]);
    }

    if ($action === 'sync') {
        $p = Pay::find($pdo, (string) ($in['order_id'] ?? ''));
        if (!$p) padm2_out(['status' => 'error', 'message' => 'Transaksi tidak ditemukan'], 404);
        $p = Pay::sync($pdo, $p);
        padm2_out(['status' => 'success', 'payment' => ['order_id' => $p['order_id'], 'status' => $p['status'], 'last_event' => $p['last_event']]]);
    }

    padm2_out(['status' => 'error', 'message' => 'Tindakan tidak dikenal'], 400);
} catch (InvalidArgumentException $e) {
    padm2_out(['status' => 'error', 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('[admin/payments] ' . $e->getMessage());
    padm2_out(['status' => 'error', 'message' => 'Data pembayaran belum dapat dimuat.'], 503);
}
