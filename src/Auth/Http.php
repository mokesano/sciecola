<?php

declare(strict_types=1);

namespace Sciecola\Auth;

/**
 * @file src/Auth/Http.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Permintaan HTTP kecil (cURL) untuk captcha dan OAuth.
 */
final class Http
{
    /**
     * @param array<string,string> $fields
     * @param array<int,string> $headers
     * @return array{status:int,json:mixed,body:string,error:?string}
     */
    public static function postForm(string $url, array $fields, array $headers = []): array
    {
        return self::request('POST', $url, http_build_query($fields), array_merge([
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: application/json',
        ], $headers));
    }

    /**
     * @param array<int,string> $headers
     * @return array{status:int,json:mixed,body:string,error:?string}
     */
    public static function get(string $url, array $headers = []): array
    {
        return self::request('GET', $url, null, array_merge(['Accept: application/json'], $headers));
    }

    /**
     * @param array<int,string> $headers
     * @return array{status:int,json:mixed,body:string,error:?string}
     */
    private static function request(string $method, string $url, ?string $body, array $headers): array
    {
        if (!function_exists('curl_init')) {
            return ['status' => 0, 'json' => null, 'body' => '', 'error' => 'cURL tidak tersedia'];
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_CUSTOMREQUEST  => $method,
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $raw    = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error  = curl_error($ch) ?: null;
        curl_close($ch);
        $raw = is_string($raw) ? $raw : '';
        return ['status' => $status, 'json' => json_decode($raw, true), 'body' => $raw, 'error' => $error];
    }
}
