<?php

declare(strict_types=1);

namespace Sciecola\Payment;

use PDO;
use Sciecola\Community\Notifications;
use Sciecola\Premium\Premium;
use Sciecola\Support\AppSettings;
use Sciecola\Support\ResearcherRecord;

/**
 * @file src/Payment/PaymentService.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pembayaran: Midtrans Snap, Xendit Invoice, dan pembayaran manual sebagai cadangan.
 *
 * Kunci API dibaca dari .env (tidak pernah disimpan di database atau dikirim ke browser):
 *   MIDTRANS_SERVER_KEY, MIDTRANS_PRODUCTION=true|false
 *   XENDIT_SECRET_KEY, XENDIT_CALLBACK_TOKEN
 * Admin memilih gateway (auto|midtrans|xendit|manual) dan menyalakan/mematikan pembayaran
 * manual di Admin → Pembayaran (AppSettings grup `payments`).
 *
 * Alur gateway: create() membuat baris `payments` (pending) dan transaksi di gateway, lalu
 * pengguna diarahkan ke halaman bayar gateway. Status lunas datang dari webhook bertanda
 * tangan (Midtrans: SHA512, Xendit: x-callback-token) atau dari sync() saat pengguna kembali.
 * markPaid() idempoten dan menjalankan fulfil(): biaya verifikasi peluang → fee_status
 * 'paid'; keanggotaan premium → keanggotaan dibuat/diperpanjang.
 *
 * Bila tidak ada gateway yang dikonfigurasi, pembayaran manual selalu tersedia.
 */
final class PaymentService
{
    public const PURPOSES = ['opportunity_fee', 'membership'];
    private static bool $ready = false;

    // ── Konfigurasi ───────────────────────────────────────────────────────────

    private static function env(string $k): string
    {
        $v = getenv($k);
        return $v === false ? '' : trim((string) $v);
    }

    public static function midtransConfigured(): bool { return self::env('MIDTRANS_SERVER_KEY') !== ''; }
    public static function xenditConfigured(): bool   { return self::env('XENDIT_SECRET_KEY') !== ''; }
    public static function midtransProduction(): bool { return filter_var(self::env('MIDTRANS_PRODUCTION'), FILTER_VALIDATE_BOOLEAN); }

    private static function midtransSnapBase(): string
    {
        return rtrim(self::env('MIDTRANS_SNAP_BASE') ?: (self::midtransProduction() ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com'), '/');
    }

    private static function midtransApiBase(): string
    {
        return rtrim(self::env('MIDTRANS_API_BASE') ?: (self::midtransProduction() ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com'), '/');
    }

    private static function xenditBase(): string
    {
        return rtrim(self::env('XENDIT_API_BASE') ?: 'https://api.xendit.co', '/');
    }

    public static function settings(): array
    {
        return AppSettings::group('payments') + AppSettings::DEFAULTS['payments'];
    }

    /** Gateway yang dipakai sekarang: 'midtrans' | 'xendit' | null (tidak ada → manual). */
    public static function activeGateway(): ?string
    {
        $p = (string) self::settings()['provider'];
        if ($p === 'midtrans') return self::midtransConfigured() ? 'midtrans' : null;
        if ($p === 'xendit')   return self::xenditConfigured() ? 'xendit' : null;
        if ($p === 'manual')   return null;
        return self::midtransConfigured() ? 'midtrans' : (self::xenditConfigured() ? 'xendit' : null);
    }

    /** Pembayaran manual tersedia bila dinyalakan admin, atau selalu bila tidak ada gateway. */
    public static function manualAvailable(): bool
    {
        return !empty(self::settings()['manualEnabled']) || self::activeGateway() === null;
    }

    public static function publicConfig(): array
    {
        return ['gateway' => self::activeGateway(), 'manual' => self::manualAvailable()];
    }

    // ── Skema ─────────────────────────────────────────────────────────────────

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) return;
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.payments_v1';
        if ($driver === 'mysql' && is_file($marker)) { self::$ready = true; return; }
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $pk   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
              : ($driver === 'pgsql' ? 'SERIAL PRIMARY KEY' : 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY');
        $pdo->exec("CREATE TABLE IF NOT EXISTS payments (
            id {$pk},
            order_id VARCHAR(64) NOT NULL UNIQUE,
            purpose VARCHAR(30) NOT NULL,
            ref_id VARCHAR(64) NOT NULL,
            user_id INTEGER NULL,
            provider VARCHAR(12) NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
            status VARCHAR(12) NOT NULL DEFAULT 'pending',
            provider_ref VARCHAR(128) NULL,
            checkout_url VARCHAR(1024) NULL,
            description VARCHAR(255) NULL,
            meta TEXT NULL,
            last_event TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL,
            paid_at TIMESTAMP NULL
        ){$tail}");
        if ($driver === 'mysql') @file_put_contents($marker, date('c'));
        self::$ready = true;
    }

    public static function find(PDO $pdo, string $orderId): ?array
    {
        self::ensure($pdo);
        $st = $pdo->prepare('SELECT * FROM payments WHERE order_id = ?');
        $st->execute([$orderId]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    // ── Membuat transaksi ─────────────────────────────────────────────────────

    /**
     * @param array $user  akun pembayar (id, email, name)
     * @return array{order_id:string, checkout_url:string, provider:string, reused:bool}
     */
    public static function create(PDO $pdo, string $purpose, string $refId, array $user, float $amount,
                                  string $currency, string $description, string $returnUrl, array $meta = []): array
    {
        self::ensure($pdo);
        $gateway = self::activeGateway();
        if ($gateway === null) throw new PaymentException('Pembayaran online belum diaktifkan. Gunakan pembayaran manual.', 409);
        if ($amount <= 0) throw new PaymentException('Jumlah pembayaran tidak valid', 400);
        if ($gateway === 'midtrans' && $currency !== 'IDR') {
            throw new PaymentException('Midtrans hanya mendukung Rupiah (IDR). Ubah mata uang biaya menjadi IDR.', 409);
        }

        // Pakai lagi tagihan yang masih menunggu (hindari tagihan ganda saat tombol diklik ulang).
        $st = $pdo->prepare("SELECT * FROM payments WHERE purpose = ? AND ref_id = ? AND user_id = ? AND provider = ?
                              AND status = 'pending' AND amount = ? AND checkout_url IS NOT NULL AND created_at >= ?
                              ORDER BY id DESC LIMIT 1");
        $st->execute([$purpose, $refId, (int) $user['id'], $gateway, $amount, date('Y-m-d H:i:s', time() - 20 * 3600)]);
        if ($old = $st->fetch(PDO::FETCH_ASSOC)) {
            return ['order_id' => $old['order_id'], 'checkout_url' => $old['checkout_url'], 'provider' => $gateway, 'reused' => true];
        }

        $prefix = $purpose === 'membership' ? 'SCM' : 'SCO';
        $orderId = $prefix . '-' . preg_replace('/[^A-Za-z0-9]/', '', $refId) . '-' . date('ymdHis') . '-' . bin2hex(random_bytes(3));
        $now = date('Y-m-d H:i:s');
        $pdo->prepare('INSERT INTO payments (order_id, purpose, ref_id, user_id, provider, amount, currency, status, description, meta, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, \'pending\', ?, ?, ?, ?)')
            ->execute([$orderId, $purpose, $refId, (int) $user['id'], $gateway, $amount, $currency,
                       mb_substr($description, 0, 255), json_encode($meta, JSON_UNESCAPED_UNICODE), $now, $now]);

        try {
            [$url, $ref] = $gateway === 'midtrans'
                ? self::midtransCreate($orderId, $amount, $description, $user, $returnUrl)
                : self::xenditCreate($orderId, $amount, $currency, $description, $user, $returnUrl);
        } catch (\Throwable $e) {
            $pdo->prepare("UPDATE payments SET status = 'failed', last_event = ?, updated_at = ? WHERE order_id = ?")
                ->execute([mb_substr($e->getMessage(), 0, 2000), date('Y-m-d H:i:s'), $orderId]);
            error_log('[PaymentService] create ' . $gateway . ': ' . $e->getMessage());
            throw new PaymentException('Gateway pembayaran tidak dapat dihubungi. Coba lagi atau gunakan pembayaran manual.', 502);
        }
        $pdo->prepare('UPDATE payments SET checkout_url = ?, provider_ref = ?, updated_at = ? WHERE order_id = ?')
            ->execute([$url, $ref, date('Y-m-d H:i:s'), $orderId]);
        return ['order_id' => $orderId, 'checkout_url' => $url, 'provider' => $gateway, 'reused' => false];
    }

    private static function http(string $method, string $url, string $basicUser, ?array $body = null): array
    {
        $ch = curl_init($url);
        $headers = ['Accept: application/json', 'Content-Type: application/json',
                    'Authorization: Basic ' . base64_encode($basicUser . ':')];
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 25,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
        $raw  = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);
        if ($raw === false) throw new \RuntimeException('HTTP gagal: ' . $err);
        $json = json_decode((string) $raw, true);
        if ($code >= 400 || !is_array($json)) {
            throw new \RuntimeException('HTTP ' . $code . ': ' . mb_substr((string) $raw, 0, 500));
        }
        return $json;
    }

    private static function midtransCreate(string $orderId, float $amount, string $desc, array $user, string $returnUrl): array
    {
        $gross = (int) round($amount); // Midtrans: IDR tanpa desimal
        $res = self::http('POST', self::midtransSnapBase() . '/snap/v1/transactions', self::env('MIDTRANS_SERVER_KEY'), [
            'transaction_details' => ['order_id' => $orderId, 'gross_amount' => $gross],
            'item_details'        => [['id' => substr($orderId, 0, 50), 'price' => $gross, 'quantity' => 1, 'name' => mb_substr($desc, 0, 50)]],
            'customer_details'    => ['first_name' => mb_substr((string) ($user['name'] ?? 'Pengguna'), 0, 50), 'email' => (string) ($user['email'] ?? '')],
            'callbacks'           => ['finish' => $returnUrl],
        ]);
        if (empty($res['redirect_url'])) throw new \RuntimeException('Midtrans tidak mengembalikan redirect_url');
        return [(string) $res['redirect_url'], (string) ($res['token'] ?? '')];
    }

    private static function xenditCreate(string $orderId, float $amount, string $currency, string $desc, array $user, string $returnUrl): array
    {
        $res = self::http('POST', self::xenditBase() . '/v2/invoices', self::env('XENDIT_SECRET_KEY'), [
            'external_id'          => $orderId,
            'amount'               => $currency === 'IDR' ? (int) round($amount) : round($amount, 2),
            'currency'             => $currency,
            'description'          => mb_substr($desc, 0, 255),
            'payer_email'          => (string) ($user['email'] ?? ''),
            'invoice_duration'     => 86400,
            'success_redirect_url' => $returnUrl,
            'failure_redirect_url' => $returnUrl,
        ]);
        if (empty($res['invoice_url'])) throw new \RuntimeException('Xendit tidak mengembalikan invoice_url');
        return [(string) $res['invoice_url'], (string) ($res['id'] ?? '')];
    }

    // ── Webhook ───────────────────────────────────────────────────────────────

    /** @return array{ok:bool, code:int, message:string} */
    public static function handleMidtrans(PDO $pdo, array $n): array
    {
        $key = self::env('MIDTRANS_SERVER_KEY');
        if ($key === '') return ['ok' => false, 'code' => 503, 'message' => 'Midtrans belum dikonfigurasi'];
        $orderId = (string) ($n['order_id'] ?? '');
        $expected = hash('sha512', $orderId . (string) ($n['status_code'] ?? '') . (string) ($n['gross_amount'] ?? '') . $key);
        if (!hash_equals($expected, strtolower((string) ($n['signature_key'] ?? '')))) {
            return ['ok' => false, 'code' => 401, 'message' => 'Tanda tangan tidak valid'];
        }
        $p = self::find($pdo, $orderId);
        if (!$p) return ['ok' => true, 'code' => 200, 'message' => 'Order tidak dikenal (diabaikan)'];
        if ((int) round((float) ($n['gross_amount'] ?? 0)) !== (int) round((float) $p['amount'])) {
            self::note($pdo, $p, 'Jumlah tidak cocok: ' . ($n['gross_amount'] ?? ''));
            return ['ok' => false, 'code' => 400, 'message' => 'Jumlah tidak cocok'];
        }
        self::applyMidtransStatus($pdo, $p, $n);
        return ['ok' => true, 'code' => 200, 'message' => 'OK'];
    }

    private static function applyMidtransStatus(PDO $pdo, array $p, array $n): void
    {
        $ts = (string) ($n['transaction_status'] ?? '');
        $fraud = (string) ($n['fraud_status'] ?? 'accept');
        self::note($pdo, $p, json_encode(array_intersect_key($n, array_flip(['transaction_status', 'payment_type', 'fraud_status', 'status_code', 'transaction_id'])), JSON_UNESCAPED_UNICODE));
        if (($ts === 'capture' && $fraud === 'accept') || $ts === 'settlement') {
            self::markPaid($pdo, $p, 'Midtrans ' . ($n['payment_type'] ?? '') . ' ' . ($n['transaction_id'] ?? ''));
        } elseif (in_array($ts, ['deny', 'cancel', 'failure'], true)) {
            self::setStatus($pdo, $p, 'failed');
        } elseif ($ts === 'expire') {
            self::setStatus($pdo, $p, 'expired');
        }
    }

    /** @return array{ok:bool, code:int, message:string} */
    public static function handleXendit(PDO $pdo, array $body, string $token): array
    {
        $expected = self::env('XENDIT_CALLBACK_TOKEN');
        if ($expected === '') return ['ok' => false, 'code' => 503, 'message' => 'Token callback Xendit belum dikonfigurasi'];
        if ($token === '' || !hash_equals($expected, $token)) return ['ok' => false, 'code' => 401, 'message' => 'Token tidak valid'];
        $p = self::find($pdo, (string) ($body['external_id'] ?? ''));
        if (!$p) return ['ok' => true, 'code' => 200, 'message' => 'Order tidak dikenal (diabaikan)'];
        self::applyXenditStatus($pdo, $p, $body);
        return ['ok' => true, 'code' => 200, 'message' => 'OK'];
    }

    private static function applyXenditStatus(PDO $pdo, array $p, array $b): void
    {
        $status = strtoupper((string) ($b['status'] ?? ''));
        self::note($pdo, $p, json_encode(array_intersect_key($b, array_flip(['id', 'status', 'paid_amount', 'payment_method', 'payment_channel'])), JSON_UNESCAPED_UNICODE));
        if (in_array($status, ['PAID', 'SETTLED'], true)) {
            $paid = (float) ($b['paid_amount'] ?? $b['amount'] ?? 0);
            if ($paid + 0.009 < (float) $p['amount']) { self::note($pdo, $p, 'Dibayar kurang: ' . $paid); return; }
            self::markPaid($pdo, $p, 'Xendit ' . ($b['payment_channel'] ?? $b['payment_method'] ?? '') . ' ' . ($b['id'] ?? ''));
        } elseif ($status === 'EXPIRED') {
            self::setStatus($pdo, $p, 'expired');
        }
    }

    /** Tanyakan status langsung ke gateway (dipakai saat pengguna kembali dari halaman bayar). */
    public static function sync(PDO $pdo, array $p): array
    {
        if ($p['status'] !== 'pending') return $p;
        try {
            if ($p['provider'] === 'midtrans' && self::midtransConfigured()) {
                $n = self::http('GET', self::midtransApiBase() . '/v2/' . rawurlencode($p['order_id']) . '/status', self::env('MIDTRANS_SERVER_KEY'));
                if (isset($n['transaction_status'])) self::applyMidtransStatus($pdo, $p, $n);
            } elseif ($p['provider'] === 'xendit' && self::xenditConfigured() && $p['provider_ref']) {
                $b = self::http('GET', self::xenditBase() . '/v2/invoices/' . rawurlencode($p['provider_ref']), self::env('XENDIT_SECRET_KEY'));
                self::applyXenditStatus($pdo, $p, $b);
            }
        } catch (\Throwable $e) {
            error_log('[PaymentService] sync ' . $p['order_id'] . ': ' . $e->getMessage());
        }
        return self::find($pdo, $p['order_id']) ?? $p;
    }

    // ── Status & pemenuhan ────────────────────────────────────────────────────

    private static function note(PDO $pdo, array $p, string $text): void
    {
        $pdo->prepare('UPDATE payments SET last_event = ?, updated_at = ? WHERE id = ?')
            ->execute([mb_substr($text, 0, 2000), date('Y-m-d H:i:s'), (int) $p['id']]);
    }

    private static function setStatus(PDO $pdo, array $p, string $status): void
    {
        $pdo->prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ? AND status = 'pending'")
            ->execute([$status, date('Y-m-d H:i:s'), (int) $p['id']]);
    }

    /** Idempoten: hanya transisi pertama ke 'paid' yang menjalankan fulfil(). */
    public static function markPaid(PDO $pdo, array $p, string $reference): bool
    {
        $now = date('Y-m-d H:i:s');
        $st = $pdo->prepare("UPDATE payments SET status = 'paid', paid_at = ?, updated_at = ? WHERE id = ? AND status <> 'paid'");
        $st->execute([$now, $now, (int) $p['id']]);
        if ($st->rowCount() < 1) return false;
        try {
            self::fulfil($pdo, $p, trim($reference));
        } catch (\Throwable $e) {
            error_log('[PaymentService] fulfil ' . $p['order_id'] . ': ' . $e->getMessage());
            self::note($pdo, $p, 'Lunas, tetapi pemenuhan gagal: ' . $e->getMessage());
        }
        return true;
    }

    private static function fulfil(PDO $pdo, array $p, string $reference): void
    {
        $now = date('Y-m-d H:i:s');
        if ($p['purpose'] === 'opportunity_fee') {
            $id = (int) $p['ref_id'];
            $pdo->prepare("UPDATE innovation_opportunities SET fee_status = 'paid', fee_reference = ?, fee_submitted_at = COALESCE(fee_submitted_at, ?),
                             fee_confirmed_at = ?, updated_at = ? WHERE id = ?")
                ->execute([mb_substr($reference . ' · ' . $p['order_id'], 0, 255), $now, $now, $now, $id]);
            $st = $pdo->prepare('SELECT id, title, posted_by_orcid FROM innovation_opportunities WHERE id = ?');
            $st->execute([$id]);
            if (($o = $st->fetch(PDO::FETCH_ASSOC)) && $p['user_id']) {
                Notifications::notify($pdo, (int) $p['user_id'], 'system', 'Pembayaran diterima: "' . mb_substr((string) $o['title'], 0, 100) . '"',
                    'Biaya penayangan lunas. Peluang menunggu persetujuan akhir admin.', '/innovation-marketplace?opp=' . $id, null);
            }
            return;
        }
        if ($p['purpose'] === 'membership') {
            $meta = json_decode((string) $p['meta'], true) ?: [];
            $tier = (string) $p['ref_id'];
            $st = $pdo->prepare('SELECT id, name, email, orcid FROM user_accounts WHERE id = ?');
            $st->execute([(int) $p['user_id']]);
            $u = $st->fetch(PDO::FETCH_ASSOC);
            if (!$u) throw new \RuntimeException('Akun pembayar tidak ditemukan');
            $until = Premium::grantMembership($pdo, $u, $tier, (int) ($meta['months'] ?? 12), (string) ($meta['display_name'] ?? ''), 'Pembayaran ' . $p['order_id']);
            Notifications::notify($pdo, (int) $u['id'], 'system', 'Keanggotaan ' . ucfirst($tier) . ' aktif',
                'Terima kasih! Keanggotaan premium Anda aktif hingga ' . $until . '.', '/premium', null);
        }
    }
}
