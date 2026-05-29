<?php

declare(strict_types=1);

namespace Sciecola\Auth;

/**
 * @file src/Auth/TwoFactorAuth.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup src
 * @brief Implementation for two-factor authentication using TOTP.
 * TOTP-based 2FA (RFC 6238 / Google Authenticator compatible).
 *
 * No external library required — pure PHP HMAC-SHA1.
 */

class TwoFactorAuth
{
    private static ?self $instance = null;

    private const ISSUER = 'Sciecola';
    private const DIGITS = 6;
    private const PERIOD = 30;
    private const WINDOW = 1;

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    // -------------------------------------------------------------------------
    // Secret generation
    // -------------------------------------------------------------------------

    public function generateSecret(int $bytes = 20): string
    {
        return $this->base32Encode(random_bytes($bytes));
    }

    // -------------------------------------------------------------------------
    // QR Code URL
    // -------------------------------------------------------------------------

    public function getQrCodeUrl(
        string $secret,
        string $accountName,
        string $issuer = self::ISSUER
    ): string {
        $label  = rawurlencode("{$issuer}:{$accountName}");
        $params = http_build_query([
            'secret'    => $secret,
            'issuer'    => $issuer,
            'algorithm' => 'SHA1',
            'digits'    => self::DIGITS,
            'period'    => self::PERIOD,
        ]);

        return "otpauth://totp/{$label}?{$params}";
    }

    public function getQrImageUrl(string $secret, string $accountName): string
    {
        $otpauth = $this->getQrCodeUrl($secret, $accountName);

        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . rawurlencode($otpauth);
    }

    // -------------------------------------------------------------------------
    // Code generation & verification
    // -------------------------------------------------------------------------

    public function getCurrentCode(string $secret): string
    {
        return $this->generateCode($secret, (int) floor(time() / self::PERIOD));
    }

    public function verifyCode(string $secret, string $code, int $window = self::WINDOW): bool
    {
        $code = preg_replace('/\s+/', '', $code);

        if (!preg_match('/^\d{' . self::DIGITS . '}$/', $code)) {
            return false;
        }

        $counter = (int) floor(time() / self::PERIOD);

        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals($this->generateCode($secret, $counter + $i), $code)) {
                return true;
            }
        }

        return false;
    }

    // -------------------------------------------------------------------------
    // Email OTP fallback
    // -------------------------------------------------------------------------

    public function generateEmailOtp(int $digits = 6): array
    {
        $code   = str_pad((string) random_int(0, (10 ** $digits) - 1), $digits, '0', STR_PAD_LEFT);
        $hash   = password_hash($code, PASSWORD_BCRYPT);
        $expiry = time() + 600;

        return ['code' => $code, 'hash' => $hash, 'expiry' => $expiry];
    }

    public function verifyEmailOtp(string $code, string $hash, int $expiry): bool
    {
        if (time() > $expiry) {
            return false;
        }

        return password_verify($code, $hash);
    }

    // -------------------------------------------------------------------------
    // Private: TOTP algorithm
    // -------------------------------------------------------------------------

    private function generateCode(string $secret, int $counter): string
    {
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

        return str_pad((string) $otp, self::DIGITS, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bin      = '';

        foreach (str_split($data) as $c) {
            $bin .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
        }

        $out = '';

        foreach (str_split(str_pad($bin, (int) (ceil(strlen($bin) / 5) * 5), '0'), 5) as $chunk) {
            $out .= $alphabet[bindec($chunk)];
        }

        return rtrim($out, '=');
    }

    private function base32Decode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $data     = strtoupper($data);
        $bin      = '';

        foreach (str_split($data) as $c) {
            $pos = strpos($alphabet, $c);
            if ($pos === false) {
                continue;
            }
            $bin .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $out = '';

        foreach (str_split(substr($bin, 0, (int) (floor(strlen($bin) / 8) * 8)), 8) as $chunk) {
            $out .= chr(bindec($chunk));
        }

        return $out;
    }
}
