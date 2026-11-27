<?php

declare(strict_types=1);

namespace Sciecola\Integration;

/**
 * @file src/Integration/SangiaApiClient.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Klien server-side untuk wizdam-apis / sangia-apis (SANGIA_API_BASE + SANGIA_API_KEY).
 *
 * Mengikuti kontrak wizdam-apis:
 *   - data dari database Sciecola dikirim sebagai supplied_works / supplied_person
 *     agar API tidak mengambil ulang dari ORCID;
 *   - endpoint ber-batch (impact/calculate) mengembalikan status "processing" + next_offset
 *     dan harus dipanggil ulang sampai "success".
 * Semua metode mengembalikan null bila API key belum diatur atau API gagal.
 */
final class SangiaApiClient
{
    public static function configured(): bool
    {
        return self::apiKey() !== '';
    }

    /**
     * Sangia Impact Score (POST /api/v1/impact/calculate), dengan loop batch.
     *
     * @param list<array<string,mixed>> $works  Karya Sciecola (title, doi, year, journal, contributors, …)
     */
    public static function impact(string $orcid, ?string $scopusId, array $works, array $person, float $timeBudget = 25.0): ?array
    {
        if (!self::configured()) {
            return null;
        }
        $supplied = [];
        foreach (array_slice($works, 0, 200) as $w) {
            $authors = array_map(static fn ($c) => is_array($c) ? (string) ($c['name'] ?? '') : (string) $c, $w['contributors'] ?? $w['authors'] ?? []);
            $supplied[] = [
                'title'            => (string) ($w['title'] ?? ''),
                'doi'              => $w['doi'] ?? null,
                'publication_year' => isset($w['year']) ? (int) $w['year'] : null,
                'type'             => $w['work_type'] ?? $w['type'] ?? null,
                'journal_title'    => $w['journal'] ?? null,
                'authors_string'   => implode(', ', array_filter($authors)),
            ];
        }
        if ($supplied === []) {
            return null;
        }

        $body = [
            'orcid'           => $orcid,
            'scopus_id'       => $scopusId,
            'batch_size'      => 50,
            // Bobot Wizdam Impact Score dari Admin → Konfigurasi WIS.
            'weights'         => \Sciecola\Support\AppSettings::group('impact'),
            'supplied_works'  => $supplied,
            'supplied_person' => [
                'name'        => $person['name'] ?? null,
                'given_names' => $person['given_names'] ?? null,
                'family_name' => $person['family_name'] ?? null,
            ],
        ];

        $deadline = microtime(true) + $timeBudget;
        $offset   = 0;
        for ($i = 0; $i < 10 && microtime(true) < $deadline; $i++) {
            $res = self::request('POST', '/api/v1/impact/calculate', $body + ['offset' => $offset]);
            if ($res === null) {
                return null;
            }
            if (($res['status'] ?? '') === 'success') {
                return $res;
            }
            if (($res['status'] ?? '') !== 'processing' || !isset($res['next_offset'])) {
                return null;
            }
            $offset = (int) $res['next_offset'];
        }
        return null;
    }

    /** Metrik jurnal Scopus (GET /api/v1/journal/metrics?issn=). */
    public static function journalMetrics(string $issn): ?array
    {
        if (!self::configured() || $issn === '') {
            return null;
        }
        $res = self::request('GET', '/api/v1/journal/metrics', null, ['issn' => $issn]);
        return ($res['status'] ?? '') === 'success' ? $res : null;
    }

    /** @return array<string,mixed>|null */
    public static function request(string $method, string $endpoint, ?array $body = null, array $query = [], int $timeout = 60): ?array
    {
        $url = rtrim(self::baseUrl(), '/') . $endpoint . ($query ? '?' . http_build_query($query) : '');
        $ch  = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $timeout,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'X-API-Key: ' . self::apiKey(),
            ],
        ];
        if ($method === 'POST') {
            $opts[CURLOPT_POST]       = true;
            $opts[CURLOPT_POSTFIELDS] = json_encode($body ?? [], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        }
        curl_setopt_array($ch, $opts);
        $resp = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (!is_string($resp) || $resp === '' || $code >= 400) {
            return null;
        }
        $data = json_decode($resp, true);
        return is_array($data) ? $data : null;
    }

    private static function apiKey(): string
    {
        return defined('SANGIA_API_KEY') ? (string) SANGIA_API_KEY : (string) (getenv('SANGIA_API_KEY') ?: '');
    }

    private static function baseUrl(): string
    {
        return defined('SANGIA_API_BASE') ? (string) SANGIA_API_BASE : (string) (getenv('SANGIA_API_BASE') ?: 'https://api.sangia.org');
    }
}
