<?php

declare(strict_types=1);

namespace Sciecola\Auth;

use RuntimeException;

/**
 * @file src/Auth/OAuthClient.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Login/penautan lewat ORCID dan Google (OAuth 2.0 authorization code).
 *
 * ORCID  : ORCID_CLIENT_ID, ORCID_CLIENT_SECRET; ORCID_SANDBOX=true memakai sandbox.orcid.org
 *          (atau ORCID_BASE_URL untuk alamat lain). Scope /authenticate.
 *          Respons token berisi iD ORCID yang sudah dibuktikan pemiliknya.
 * Google : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Scope "openid email profile".
 *
 * Redirect URI yang didaftarkan di kedua penyedia:
 *   {APP_URL}/api/auth.php?action=oauth_callback&provider=orcid
 *   {APP_URL}/api/auth.php?action=oauth_callback&provider=google
 */
final class OAuthClient
{
    public const PROVIDERS = ['orcid', 'google'];

    public static function configured(string $provider): bool
    {
        return match ($provider) {
            'orcid'  => self::env('ORCID_CLIENT_ID') !== '' && self::env('ORCID_CLIENT_SECRET') !== '',
            'google' => self::env('GOOGLE_CLIENT_ID') !== '' && self::env('GOOGLE_CLIENT_SECRET') !== '',
            default  => false,
        };
    }

    public static function redirectUri(string $provider): string
    {
        return rtrim(self::appUrl(), '/') . '/api/auth.php?action=oauth_callback&provider=' . $provider;
    }

    public static function authorizeUrl(string $provider, string $state): string
    {
        if ($provider === 'orcid') {
            return self::orcidBase() . '/oauth/authorize?' . http_build_query([
                'client_id'     => self::env('ORCID_CLIENT_ID'),
                'response_type' => 'code',
                'scope'         => '/authenticate',
                'redirect_uri'  => self::redirectUri('orcid'),
                'state'         => $state,
            ]);
        }
        if ($provider === 'google') {
            return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                'client_id'     => self::env('GOOGLE_CLIENT_ID'),
                'response_type' => 'code',
                'scope'         => 'openid email profile',
                'redirect_uri'  => self::redirectUri('google'),
                'state'         => $state,
                'prompt'        => 'select_account',
            ]);
        }
        throw new RuntimeException('Penyedia tidak dikenal');
    }

    /**
     * Menukar kode otorisasi dengan identitas pengguna.
     *
     * @return array{id:string,name:string,email:?string,email_verified:bool}
     */
    public static function exchange(string $provider, string $code): array
    {
        if ($provider === 'orcid') {
            $res = Http::postForm(self::orcidBase() . '/oauth/token', [
                'client_id'     => self::env('ORCID_CLIENT_ID'),
                'client_secret' => self::env('ORCID_CLIENT_SECRET'),
                'grant_type'    => 'authorization_code',
                'code'          => $code,
                'redirect_uri'  => self::redirectUri('orcid'),
            ]);
            $j = $res['json'];
            $orcid = is_array($j) ? strtoupper((string) ($j['orcid'] ?? '')) : '';
            if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
                throw new RuntimeException('ORCID menolak permintaan masuk (' . ($res['error'] ?? 'HTTP ' . $res['status']) . ').');
            }
            return ['id' => $orcid, 'name' => trim((string) ($j['name'] ?? '')), 'email' => null, 'email_verified' => false];
        }

        if ($provider === 'google') {
            $res = Http::postForm('https://oauth2.googleapis.com/token', [
                'client_id'     => self::env('GOOGLE_CLIENT_ID'),
                'client_secret' => self::env('GOOGLE_CLIENT_SECRET'),
                'grant_type'    => 'authorization_code',
                'code'          => $code,
                'redirect_uri'  => self::redirectUri('google'),
            ]);
            $idToken = is_array($res['json']) ? (string) ($res['json']['id_token'] ?? '') : '';
            $claims  = self::decodeJwtPayload($idToken);
            // Token diterima langsung dari endpoint Google lewat TLS, jadi tanda tangan
            // tidak wajib diverifikasi ulang (OpenID Connect Core §3.1.3.7), tetapi
            // penerbit, audiens, dan masa berlaku tetap diperiksa.
            $iss = (string) ($claims['iss'] ?? '');
            if (!in_array($iss, ['https://accounts.google.com', 'accounts.google.com'], true)
                || (string) ($claims['aud'] ?? '') !== self::env('GOOGLE_CLIENT_ID')
                || (int) ($claims['exp'] ?? 0) < time()
                || empty($claims['sub'])) {
                throw new RuntimeException('Google menolak permintaan masuk (' . ($res['error'] ?? 'HTTP ' . $res['status']) . ').');
            }
            return [
                'id'             => (string) $claims['sub'],
                'name'           => trim((string) ($claims['name'] ?? '')),
                'email'          => isset($claims['email']) ? strtolower((string) $claims['email']) : null,
                'email_verified' => !empty($claims['email_verified']) && $claims['email_verified'] !== 'false',
            ];
        }
        throw new RuntimeException('Penyedia tidak dikenal');
    }

    /** @return array<string,mixed> */
    private static function decodeJwtPayload(string $jwt): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return [];
        }
        $json = base64_decode(strtr($parts[1], '-_', '+/'), true);
        $data = $json !== false ? json_decode($json, true) : null;
        return is_array($data) ? $data : [];
    }

    private static function orcidBase(): string
    {
        if (self::env('ORCID_BASE_URL') !== '') {
            return rtrim(self::env('ORCID_BASE_URL'), '/');
        }
        $sandbox = in_array(strtolower(self::env('ORCID_SANDBOX')), ['1', 'true', 'yes', 'on'], true);
        return $sandbox ? 'https://sandbox.orcid.org' : 'https://orcid.org';
    }

    public static function appUrl(): string
    {
        $url  = defined('APP_URL') ? (string) APP_URL : (string) (getenv('APP_URL') ?: '');
        $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
        // APP_URL bawaan (localhost) di server live akan membuat tautan email dan
        // redirect OAuth mengarah ke localhost; pakai host permintaan sebagai gantinya.
        $isLocalDefault = $url === '' || preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?#i', $url);
        if ($isLocalDefault && $host !== '' && !preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $host)) {
            $url = (UserAuth::isHttps() ? 'https://' : 'http://') . $host;
        }
        return rtrim($url, '/');
    }

    private static function env(string $key): string
    {
        return (string) (getenv($key) ?: '');
    }
}
