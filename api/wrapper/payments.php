<?php
declare(strict_types=1);

/**
 * @file api/wrapper/payments.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Pembayaran pengguna (Midtrans/Xendit) — lihat src/Payment/PaymentService.php.
 *
 * GET  ?action=config                     → { gateway: midtrans|xendit|null, manual: bool }
 * GET  ?action=status&order_id=...        → status transaksi milik pengguna (disinkronkan ke gateway bila masih pending)
 * GET  ?action=mine                       → riwayat pembayaran pengguna
 * POST { action: create, purpose: opportunity_fee, opportunity_id, return_url }
 * POST { action: create, purpose: membership, tier, display_name?, return_url }
 *      → { order_id, checkout_url }  (frontend mengarahkan pengguna ke checkout_url)
 */

use Sciecola\Auth\UserAuth;
use Sciecola\Database\Db;
use Sciecola\Marketplace\OpportunityCuration;
use Sciecola\Payment\PaymentException;
use Sciecola\Payment\PaymentService as Pay;
use Sciecola\Premium\Premium;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

function pay_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** URL kembali hanya boleh ke host yang sama dengan permintaan ini (cegah open redirect). */
function pay_return_url(string $url, string $fallbackPath): string
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
    $p = parse_url($url);
    if ($url !== '' && $p && in_array($p['scheme'] ?? '', ['http', 'https'], true) && strtolower($p['host'] ?? '') . (isset($p['port']) ? ':' . $p['port'] : '') === $host) {
        return $url;
    }
    return $scheme . '://' . $host . '/#' . $fallbackPath;
}

function pay_public(array $p): array
{
    return [
        'order_id' => $p['order_id'], 'purpose' => $p['purpose'], 'ref_id' => $p['ref_id'], 'provider' => $p['provider'],
        'amount' => (float) $p['amount'], 'currency' => $p['currency'], 'status' => $p['status'],
        'description' => $p['description'], 'created_at' => $p['created_at'], 'paid_at' => $p['paid_at'],
        'checkout_url' => $p['status'] === 'pending' ? $p['checkout_url'] : null,
    ];
}

try {
    $pdo = Db::pdo();
    if (!$pdo) pay_out(['status' => 'error', 'message' => 'Database tidak dapat dihubungi'], 503);
    Pay::ensure($pdo);
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = (string) ($_GET['action'] ?? '');

    if ($method === 'GET' && ($action === 'config' || $action === '')) {
        pay_out(['status' => 'success'] + Pay::publicConfig());
    }

    $me = UserAuth::requireUser();

    if ($method === 'GET' && $action === 'status') {
        $p = Pay::find($pdo, (string) ($_GET['order_id'] ?? ''));
        if (!$p || (int) $p['user_id'] !== (int) $me['id']) pay_out(['status' => 'error', 'message' => 'Transaksi tidak ditemukan'], 404);
        $p = Pay::sync($pdo, $p);
        pay_out(['status' => 'success', 'payment' => pay_public($p)]);
    }

    if ($method === 'GET' && $action === 'mine') {
        $st = $pdo->prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 50');
        $st->execute([(int) $me['id']]);
        pay_out(['status' => 'success', 'payments' => array_map('pay_public', $st->fetchAll(PDO::FETCH_ASSOC))]);
    }

    if ($method !== 'POST') pay_out(['status' => 'error', 'message' => 'Method not allowed'], 405);
    $in = json_decode((string) file_get_contents('php://input'), true) ?: [];
    if (($in['action'] ?? '') !== 'create') pay_out(['status' => 'error', 'message' => 'Tindakan tidak dikenal'], 400);
    $purpose = (string) ($in['purpose'] ?? '');

    if ($purpose === 'opportunity_fee') {
        OpportunityCuration::ensure($pdo);
        $o = OpportunityCuration::find($pdo, (int) ($in['opportunity_id'] ?? 0));
        if (!$o || empty($me['orcid']) || strtoupper((string) $o['posted_by_orcid']) !== strtoupper((string) $me['orcid'])) {
            pay_out(['status' => 'error', 'message' => 'Peluang tidak ditemukan'], 404);
        }
        if (in_array($o['fee_status'], ['paid', 'waived'], true)) pay_out(['status' => 'error', 'message' => 'Biaya penayangan sudah lunas'], 409);
        if (!OpportunityCuration::feeActive()) pay_out(['status' => 'error', 'message' => 'Verifikasi saat ini gratis; tidak ada yang perlu dibayar'], 409);
        $amount = (float) ($o['fee_amount'] ?? 0);
        $r = Pay::create($pdo, 'opportunity_fee', (string) $o['id'], $me, $amount, (string) ($o['fee_currency'] ?: 'IDR'),
            'Biaya verifikasi peluang: ' . mb_substr((string) $o['title'], 0, 120),
            pay_return_url((string) ($in['return_url'] ?? ''), '/innovation-marketplace?opp=' . (int) $o['id']));
        pay_out(['status' => 'success'] + $r);
    }

    if ($purpose === 'membership') {
        $tier = (string) ($in['tier'] ?? '');
        if (!in_array($tier, Premium::TIERS, true)) pay_out(['status' => 'error', 'message' => 'Pilih paket keanggotaan'], 400);
        if (!Premium::enabled()) pay_out(['status' => 'error', 'message' => 'Layanan premium belum diberlakukan; semua layanan gratis'], 409);
        $price = Premium::price($tier);
        if ($price <= 0) pay_out(['status' => 'error', 'message' => 'Paket ini belum dijual online. Silakan hubungi admin.'], 409);
        $months = (int) Premium::settings()['membershipMonths'];
        $display = mb_substr(trim(strip_tags((string) ($in['display_name'] ?? ''))), 0, 255);
        $r = Pay::create($pdo, 'membership', $tier, $me, (float) $price, 'IDR',
            'Keanggotaan ' . ucfirst($tier) . ' Sciecola ' . $months . ' bulan',
            pay_return_url((string) ($in['return_url'] ?? ''), '/premium'),
            ['months' => $months, 'display_name' => $display]);
        pay_out(['status' => 'success'] + $r);
    }

    pay_out(['status' => 'error', 'message' => 'Jenis pembayaran tidak dikenal'], 400);
} catch (PaymentException $e) {
    pay_out(['status' => 'error', 'message' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
    error_log('[payments] ' . $e->getMessage());
    pay_out(['status' => 'error', 'message' => 'Pembayaran belum dapat diproses.'], 503);
}
