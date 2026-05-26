<?php
declare(strict_types=1);
/**
 * @file api/TwoFactorAuth.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Implementation of two-factor authentication using TOTP (Time-Based One-Time Password).
 * 
 * TwoFactorAuth — TOTP-based 2FA implementation (RFC 6238 / Google Authenticator compatible)
 * Does NOT require any external library — uses pure PHP HMAC-SHA1 per the TOTP spec.
 * For production, you can replace this with the `pragmarx/google2fa` Composer package.
 *
 * Usage:
 *   $tfa = TwoFactorAuth::getInstance();
 *   $secret = $tfa->generateSecret();          // Store in DB per user
 *   $qrUrl  = $tfa->getQrCodeUrl($secret, 'user@example.com');
 *   $valid  = $tfa->verifyCode($secret, $userInputCode);
 */

class TwoFactorAuth {
    private static ?TwoFactorAuth $instance = null;
    private const ISSUER = 'Sciecola';
    private const DIGITS = 6;
    private const PERIOD = 30;   // seconds
    private const WINDOW = 1;    // ±1 period tolerance

    private function __construct() {}

    public static function getInstance(): self {
        if (!self::$instance) self::$instance = new self();
        return self::$instance;
    }

    // ─── Secret generation ───────────────────────────────────────────────

    public function generateSecret(int $bytes = 20): string {
        return $this->base32Encode(random_bytes($bytes));
    }

    // ─── QR Code URL (for Google Authenticator) ─────────────────────────

    public function getQrCodeUrl(string $secret, string $accountName, string $issuer = self::ISSUER): string {
        $label = rawurlencode("{$issuer}:{$accountName}");
        $params = http_build_query([
            'secret' => $secret,
            'issuer' => $issuer,
            'algorithm' => 'SHA1',
            'digits' => self::DIGITS,
            'period' => self::PERIOD,
        ]);
        return "otpauth://totp/{$label}?{$params}";
    }

    /**
     * Returns a URL to a QR code image via the Google Charts API.
     * For local testing only — use a server-side QR generator in production.
     */
    public function getQrImageUrl(string $secret, string $accountName): string {
        $otpauth = $this->getQrCodeUrl($secret, $accountName);
        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . rawurlencode($otpauth);
    }

    // ─── Code generation & verification ─────────────────────────────────

    public function getCurrentCode(string $secret): string {
        return $this->generateCode($secret, (int)floor(time() / self::PERIOD));
    }

    /**
     * @param string $secret   Base32-encoded secret
     * @param string $code     6-digit user input
     * @param int    $window   How many periods ± to check (tolerance for clock drift)
     */
    public function verifyCode(string $secret, string $code, int $window = self::WINDOW): bool {
        $code = preg_replace('/\s+/', '', $code);
        if (!preg_match('/^\d{' . self::DIGITS . '}$/', $code)) return false;

        $counter = (int)floor(time() / self::PERIOD);
        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals($this->generateCode($secret, $counter + $i), $code)) {
                return true;
            }
        }
        return false;
    }

    // ─── OTP email fallback ──────────────────────────────────────────────

    /**
     * Generate a numeric OTP for email 2FA (not TOTP — single-use).
     * Store the hash and expiry in your DB, verify on submission.
     */
    public function generateEmailOtp(int $digits = 6): array {
        $code   = str_pad((string)random_int(0, (10 ** $digits) - 1), $digits, '0', STR_PAD_LEFT);
        $hash   = password_hash($code, PASSWORD_BCRYPT);
        $expiry = time() + 600; // 10 minutes
        return ['code' => $code, 'hash' => $hash, 'expiry' => $expiry];
    }

    public function verifyEmailOtp(string $code, string $hash, int $expiry): bool {
        if (time() > $expiry) return false;
        return password_verify($code, $hash);
    }

    // ─── Private: TOTP algorithm ─────────────────────────────────────────

    private function generateCode(string $secret, int $counter): string {
        $key     = $this->base32Decode($secret);
        $message = pack('N*', 0) . pack('N*', $counter);
        $hash    = hash_hmac('sha1', $message, $key, true);
        $offset  = ord($hash[19]) & 0x0F;
        $otp     = (
            ((ord($hash[$offset])     & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8)  |
             (ord($hash[$offset + 3]) & 0xFF)
        ) % (10 ** self::DIGITS);
        return str_pad((string)$otp, self::DIGITS, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $data): string {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bin = '';
        foreach (str_split($data) as $c) $bin .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
        $out = '';
        foreach (str_split(str_pad($bin, (int)(ceil(strlen($bin) / 5) * 5), '0'), 5) as $chunk) {
            $out .= $alphabet[bindec($chunk)];
        }
        return rtrim($out, '=');
    }

    private function base32Decode(string $data): string {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $data = strtoupper($data);
        $bin  = '';
        foreach (str_split($data) as $c) {
            $pos  = strpos($alphabet, $c);
            if ($pos === false) continue;
            $bin .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }
        $out = '';
        foreach (str_split(substr($bin, 0, (int)(floor(strlen($bin) / 8) * 8)), 8) as $chunk) {
            $out .= chr(bindec($chunk));
        }
        return $out;
    }
}
