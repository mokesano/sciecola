<?php

declare(strict_types=1);

namespace Sciecola\Auth;

/**
 * @file src/Auth/UserAuth.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Sesi pengguna: cookie HttpOnly, pengguna saat ini, dan penjaga endpoint pengguna.
 *
 * Sesi dibawa oleh cookie `sciecola_session` (HttpOnly, SameSite=Lax, Secure di HTTPS),
 * jadi semua fetch() ke /api/* dari aplikasi yang sama otomatis terautentikasi dan
 * JavaScript tidak bisa membaca tokennya. Header X-Auth-Token tetap diterima untuk
 * klien non-browser.
 *
 * Endpoint milik pengguna memakai:
 *   UserAuth::requireUser()  → akun yang login (401 bila tidak)
 *   UserAuth::requireOrcid() → ORCID akun yang login (409 bila belum ditautkan)
 * Nilai orcid/user_id dari parameter permintaan tidak lagi dipercaya.
 */
final class UserAuth
{
    public const COOKIE = 'sciecola_session';
    public const TTL_DEFAULT  = 86400;       // 1 hari
    public const TTL_REMEMBER = 2592000;     // 30 hari

    /** @var array<string,mixed>|null|false false = belum dicek */
    private static $current = false;
    private static ?string $currentSessionId = null;

    // =========================================================================
    // Current user
    // =========================================================================

    /** @return array<string,mixed>|null baris akun (dengan kolom keamanan) atau null */
    public static function current(): ?array
    {
        if (self::$current !== false) {
            return self::$current;
        }
        self::$current = null;
        $token = self::requestToken();
        if ($token === null) {
            return null;
        }
        try {
            $store   = AuthStore::get();
            $session = $store->findSession($token);
            if (!$session) {
                return null;
            }
            $user = $store->findUserById((int) $session['user_id']);
            if (!$user || (int) $user['is_active'] !== 1) {
                $store->deleteSessionById((string) $session['id']);
                return null;
            }
            // last_seen diperbarui paling sering tiap 5 menit.
            $seen = $session['last_seen_at'] ? strtotime($session['last_seen_at'] . ' UTC') : 0;
            if (time() - $seen > 300) {
                $store->touchSession((string) $session['id']);
            }
            self::$currentSessionId = (string) $session['id'];
            self::$current = $user;
        } catch (\Throwable $e) {
            error_log('[UserAuth] ' . $e->getMessage());
            self::$current = null;
        }
        return self::$current;
    }

    public static function currentSessionId(): ?string
    {
        self::current();
        return self::$currentSessionId;
    }

    /** @return array<string,mixed> */
    public static function requireUser(): array
    {
        self::checkSameOrigin();
        $user = self::current();
        if (!$user) {
            self::deny(401, 'UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.');
        }
        return $user;
    }

    /** ORCID milik akun yang login; permintaan ditolak bila akun belum menautkan ORCID. */
    public static function requireOrcid(): string
    {
        $user = self::requireUser();
        $orcid = (string) ($user['orcid'] ?? '');
        if ($orcid === '') {
            self::deny(409, 'ORCID_REQUIRED', 'Tautkan ORCID Anda di Pengaturan terlebih dahulu.');
        }
        return $orcid;
    }

    public static function isAdmin(?array $user = null): bool
    {
        $user ??= self::current();
        return $user !== null && self::roleOf($user) === 'admin';
    }

    /**
     * Peran efektif. Email di ADMIN_EMAILS (.env, dipisah koma) selalu admin; ini cara
     * menyiapkan admin pertama tanpa akses database.
     */
    public static function roleOf(array $user): string
    {
        $admins = array_filter(array_map(
            static fn ($e) => strtolower(trim($e)),
            explode(',', (string) (getenv('ADMIN_EMAILS') ?: ''))
        ));
        // Hanya email yang sudah diverifikasi, agar orang lain tidak bisa mendaftar
        // memakai alamat admin.
        if (!empty($user['email_verified']) && in_array(strtolower((string) $user['email']), $admins, true)) {
            return 'admin';
        }
        return (string) ($user['role'] ?? 'user') === 'admin' ? 'admin' : 'user';
    }

    /** Data akun yang aman dikirim ke browser. */
    public static function publicUser(array $user): array
    {
        return [
            'id'                 => (int) $user['id'],
            'email'              => (string) $user['email'],
            'name'               => (string) $user['name'],
            'orcid'              => $user['orcid'] ?: null,
            'orcid_verified'     => (bool) ($user['orcid_verified'] ?? false),
            'role'               => self::roleOf($user),
            'email_verified'     => (bool) $user['email_verified'],
            'two_factor_enabled' => (bool) ($user['totp_enabled'] ?? false),
            'has_password'       => !empty($user['password_hash']),
            'google_linked'      => !empty($user['google_sub']),
            'created_at'         => $user['created_at'] ?? null,
            'last_login_at'      => $user['last_login_at'] ?? null,
        ];
    }

    // =========================================================================
    // Session lifecycle
    // =========================================================================

    public static function startSession(array $user, bool $remember): void
    {
        $store = AuthStore::get();
        $token = AuthStore::randomToken();
        // Lama sesi tanpa "ingat saya" diatur di Admin → Sistem (default 1 hari).
        $minutes = (int) \Sciecola\Support\AppSettings::get('system', 'sessionTimeoutMinutes', self::TTL_DEFAULT / 60);
        $ttl   = $remember ? self::TTL_REMEMBER : max(900, $minutes * 60);
        $store->createSession((int) $user['id'], $token, $remember, $ttl);
        $store->updateUser((int) $user['id'], ['last_login_at' => gmdate('Y-m-d H:i:s')]);
        self::setCookie($token, $remember ? time() + $ttl : 0);
        self::$current = $store->findUserById((int) $user['id']);
        self::$currentSessionId = AuthStore::hash($token);
    }

    public static function endSession(): void
    {
        $token = self::requestToken();
        if ($token !== null) {
            try {
                $store = AuthStore::get();
                $store->deleteSessionById(AuthStore::hash($token));
            } catch (\Throwable $e) {
                error_log('[UserAuth] logout: ' . $e->getMessage());
            }
        }
        self::setCookie('', time() - 3600);
        self::$current = null;
        self::$currentSessionId = null;
    }

    /** Memaksa pembacaan ulang data akun (setelah perubahan). */
    public static function refresh(): ?array
    {
        $id = self::$current ? (int) self::$current['id'] : null;
        if ($id === null) {
            return null;
        }
        self::$current = AuthStore::get()->findUserById($id);
        return self::$current;
    }

    // =========================================================================
    // Request helpers
    // =========================================================================

    public static function requestToken(): ?string
    {
        $h = trim((string) ($_SERVER['HTTP_X_AUTH_TOKEN'] ?? ''));
        if ($h === '' && isset($_SERVER['HTTP_AUTHORIZATION']) && stripos($_SERVER['HTTP_AUTHORIZATION'], 'Bearer ') === 0) {
            $h = trim(substr($_SERVER['HTTP_AUTHORIZATION'], 7));
        }
        if ($h === '') {
            $h = (string) ($_COOKIE[self::COOKIE] ?? '');
        }
        return preg_match('/^[a-f0-9]{64}$/', $h) ? $h : null;
    }

    public static function isHttps(): bool
    {
        if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
            return true;
        }
        if (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https') {
            return true;
        }
        return (string) ($_SERVER['SERVER_PORT'] ?? '') === '443';
    }

    private static function setCookie(string $value, int $expires): void
    {
        if (headers_sent()) {
            return;
        }
        setcookie(self::COOKIE, $value, [
            'expires'  => $expires,
            'path'     => '/',
            'secure'   => self::isHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    /**
     * Perlindungan CSRF tambahan di samping SameSite=Lax: permintaan yang mengubah data
     * dan membawa header Origin dari situs lain ditolak.
     */
    public static function checkSameOrigin(): void
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
        if ($origin === '' || $origin === 'null') {
            return;
        }
        $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
        $host       = strtolower((string) preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')));
        $allowed    = [$host];
        $appHost    = parse_url((string) (defined('APP_URL') ? APP_URL : (getenv('APP_URL') ?: '')), PHP_URL_HOST);
        if ($appHost) {
            $allowed[] = strtolower($appHost);
        }
        if ($originHost === '' || !in_array($originHost, $allowed, true)) {
            self::deny(403, 'CROSS_ORIGIN', 'Permintaan dari situs lain ditolak.');
        }
    }

    public static function deny(int $code, string $errorCode, string $message): void
    {
        while (ob_get_level()) {
            ob_end_clean();
        }
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['status' => 'error', 'code' => $errorCode, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** Untuk pengujian. */
    public static function forget(): void
    {
        self::$current = false;
        self::$currentSessionId = null;
    }
}
