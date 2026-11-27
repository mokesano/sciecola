<?php
declare(strict_types=1);

/**
 * @file api/wrapper/payment_webhook.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Notifikasi pembayaran dari gateway (server-ke-server).
 *
 * Daftarkan di dasbor gateway:
 *   Midtrans → Settings → Payment → Notification URL:
 *       https://<domain>/api/payment_webhook.php?provider=midtrans
 *   Xendit   → Settings → Webhooks → Invoices paid (dan expired):
 *       https://<domain>/api/payment_webhook.php?provider=xendit
 *
 * Keaslian diperiksa di PaymentService: Midtrans dengan signature_key SHA512
 * (order_id + status_code + gross_amount + server key), Xendit dengan header
 * x-callback-token. Permintaan palsu dicatat ke log keamanan.
 */

use Sciecola\Database\Db;
use Sciecola\Middleware\AccessLogger;
use Sciecola\Payment\PaymentService as Pay;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

function hook_out(array $r): void
{
    http_response_code($r['code']);
    echo json_encode(['status' => $r['ok'] ? 'success' : 'error', 'message' => $r['message']], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    hook_out(['ok' => false, 'code' => 405, 'message' => 'Method not allowed']);
}

try {
    $pdo = Db::pdo();
    if (!$pdo) hook_out(['ok' => false, 'code' => 503, 'message' => 'Database tidak dapat dihubungi']);
    Pay::ensure($pdo);
    $raw = (string) file_get_contents('php://input');
    $body = json_decode($raw, true);
    if (!is_array($body)) hook_out(['ok' => false, 'code' => 400, 'message' => 'Body JSON tidak valid']);

    $provider = (string) ($_GET['provider'] ?? '');
    if ($provider === 'midtrans') {
        $r = Pay::handleMidtrans($pdo, $body);
    } elseif ($provider === 'xendit') {
        $r = Pay::handleXendit($pdo, $body, (string) ($_SERVER['HTTP_X_CALLBACK_TOKEN'] ?? ''));
    } else {
        $r = ['ok' => false, 'code' => 400, 'message' => 'provider harus midtrans atau xendit'];
    }
    if ($r['code'] === 401) {
        try {
            AccessLogger::record('blocked_request', ['reason' => 'payment_webhook_' . $provider . '_bad_signature']);
        } catch (\Throwable $e) { /* pencatatan tidak boleh menggagalkan respons */ }
    }
    hook_out($r);
} catch (Throwable $e) {
    error_log('[payment_webhook] ' . $e->getMessage());
    // 500 → gateway akan mencoba ulang nanti.
    hook_out(['ok' => false, 'code' => 500, 'message' => 'Gagal memproses notifikasi']);
}
