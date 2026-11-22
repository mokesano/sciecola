<?php

declare(strict_types=1);

namespace Sciecola\Sdg;

use RuntimeException;

/**
 * @file src/Sdg/SdgEngine.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pintu tunggal untuk memanggil mesin SDG lokal (api/sdgs/SDG_Classification_API.php)
 *        dari dalam PHP, tanpa HTTP dan tanpa me-require ulang file mesin.
 *
 * Mesin SDG adalah skrip (bukan kelas): ia mendefinisikan konstanta & fungsi global lalu
 * langsung mengeksekusi main(). Me-require-nya lebih dari sekali dalam satu proses memicu
 * fatal error "Cannot redeclare ...". Kelas ini memuatnya tepat sekali, membuang output
 * main(), lalu memanggil fungsi handler-nya secara langsung berulang kali.
 */
final class SdgEngine
{
    private static bool $loaded = false;

    public static function engineFile(): string
    {
        $root = defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2);
        return $root . '/api/sdgs/SDG_Classification_API.php';
    }

    /** Memuat fungsi-fungsi mesin sekali per proses, tanpa menjalankan analisis apa pun. */
    public static function load(): void
    {
        if (self::$loaded) {
            return;
        }
        $file = self::engineFile();
        if (!is_file($file)) {
            throw new RuntimeException('Mesin SDG tidak ditemukan: api/sdgs/SDG_Classification_API.php');
        }

        $origGet    = $_GET;
        $origMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $_GET = ['_engine_load' => '1'];   // main() hanya mengembalikan error parameter
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $code = http_response_code();
        ob_start();
        try {
            require_once $file;
        } finally {
            ob_end_clean();
            $_GET = $origGet;
            $_SERVER['REQUEST_METHOD'] = $origMethod;
            if (!headers_sent()) {
                http_response_code(is_int($code) ? $code : 200);
                header('Content-Type: application/json; charset=utf-8');
            }
        }
        self::$loaded = true;
    }

    /** Info peneliti + daftar karya (tanpa SDG). */
    public static function orcidInit(string $orcid, bool $refresh = false): array
    {
        self::load();
        return self::call(static fn () => \handleOrcidInitRequest($orcid, $refresh));
    }

    /** Analisis SDG untuk sebagian karya ORCID. */
    public static function orcidBatch(string $orcid, int $offset, int $limit = 5, bool $refresh = false): array
    {
        self::load();
        return self::call(static fn () => \handleOrcidBatchRequest($orcid, $offset, max(1, min(10, $limit)), $refresh));
    }

    /** Metadata + analisis SDG satu DOI. */
    public static function doi(string $doi, bool $refresh = false): array
    {
        self::load();
        return self::call(static fn () => \handleDoiRequest($doi, $refresh));
    }

    private static function call(callable $fn): array
    {
        $code = http_response_code();
        try {
            $result = $fn();
        } finally {
            // Handler mesin mengubah kode HTTP saat error; pemanggil yang menentukan respons akhir.
            if (!headers_sent()) {
                http_response_code(is_int($code) ? $code : 200);
            }
        }
        if (!is_array($result) || ($result['status'] ?? '') !== 'success') {
            $message = is_array($result) ? (string) ($result['message'] ?? '') : '';
            throw new RuntimeException($message !== '' ? $message : 'Mesin SDG tidak mengembalikan hasil');
        }
        return $result;
    }
}
