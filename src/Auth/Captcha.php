<?php

declare(strict_types=1);

namespace Sciecola\Auth;

/**
 * @file src/Auth/Captcha.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Verifikasi Cloudflare Turnstile di server.
 *
 * Aktif bila TURNSTILE_SITE_KEY dan TURNSTILE_SECRET_KEY diisi di .env. Bila tidak
 * diisi, captcha dilewati (formulir tetap dilindungi pembatasan laju di AuthStore).
 * Sebelumnya halaman login/daftar memuat kunci contoh "YOUR_..." sehingga widget gagal
 * dan tombol masuk tidak pernah aktif.
 */
final class Captcha
{
    public static function siteKey(): string
    {
        return (string) (getenv('TURNSTILE_SITE_KEY') ?: '');
    }

    public static function enabled(): bool
    {
        return self::siteKey() !== '' && (string) (getenv('TURNSTILE_SECRET_KEY') ?: '') !== '';
    }

    public static function verify(?string $token): bool
    {
        if (!self::enabled()) {
            return true;
        }
        $token = trim((string) $token);
        if ($token === '') {
            return false;
        }
        $res = Http::postForm('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret'   => (string) getenv('TURNSTILE_SECRET_KEY'),
            'response' => $token,
            'remoteip' => AuthStore::clientIp(),
        ]);
        return is_array($res['json']) && !empty($res['json']['success']);
    }
}
