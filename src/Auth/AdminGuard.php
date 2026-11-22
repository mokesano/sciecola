<?php

declare(strict_types=1);

namespace Sciecola\Auth;

/**
 * @file src/Auth/AdminGuard.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Penjaga server-side untuk endpoint admin.
 *
 * Halaman admin di React hanya menyembunyikan menu (const isAdmin = true), dan login
 * aplikasi masih menerima kredensial apa pun, sehingga pemeriksaan di browser tidak
 * bisa diandalkan. Setiap endpoint yang mengubah data admin atau membuka data internal
 * wajib memanggil AdminGuard::require(): permintaan harus membawa header
 * X-Admin-Token yang sama dengan ADMIN_TOOL_TOKEN di .env server.
 * Tanpa ADMIN_TOOL_TOKEN di .env, semua permintaan ditolak (fail closed).
 */
final class AdminGuard
{
    public static function configuredToken(): string
    {
        return (string) (getenv('ADMIN_TOOL_TOKEN') ?: ($_ENV['ADMIN_TOOL_TOKEN'] ?? ''));
    }

    public static function isAuthorized(): bool
    {
        $expected = self::configuredToken();
        $given    = (string) ($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
        return $expected !== '' && $given !== '' && hash_equals($expected, $given);
    }

    /** Menghentikan permintaan dengan JSON 401/503 bila token admin tidak valid. */
    public static function require(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
        if (self::configuredToken() === '') {
            self::deny(503, 'TOKEN_NOT_CONFIGURED',
                'ADMIN_TOOL_TOKEN belum diatur di file .env server. Fitur admin dinonaktifkan demi keamanan.');
        }
        if (!self::isAuthorized()) {
            self::deny(401, 'UNAUTHORIZED',
                'Token admin tidak valid atau belum diisi. Masukkan token di Admin → Cache & DB.');
        }
    }

    /**
     * Metode HTTP efektif. .htaccess memblokir PUT/DELETE, jadi frontend mengirim POST
     * dengan header X-HTTP-Method-Override: PUT|DELETE.
     */
    public static function method(): string
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        if ($method === 'POST') {
            $override = strtoupper(trim((string) ($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '')));
            if (in_array($override, ['PUT', 'DELETE', 'PATCH'], true)) {
                return $override;
            }
        }
        return $method;
    }

    private static function deny(int $code, string $errorCode, string $message): void
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
}
