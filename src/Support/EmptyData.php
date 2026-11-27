<?php

declare(strict_types=1);

namespace Sciecola\Support;

/**
 * @file src/Support/EmptyData.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Mengosongkan data contoh (sample/mock) dengan tetap mempertahankan bentuknya.
 *
 * Banyak endpoint dulu mengembalikan data karangan (institusi, peneliti, angka statistik)
 * saat database kosong atau tidak terjangkau, sehingga pengunjung melihat data palsu
 * seolah-olah data asli. EmptyData::like() mengubah keluaran fungsi sample menjadi
 * versi kosong dengan struktur yang sama: daftar menjadi [], angka menjadi 0, teks
 * menjadi '' — kecuali kunci teknis seperti status/message/type — sehingga frontend
 * tetap bisa merender keadaan kosong tanpa error.
 */
final class EmptyData
{
    /** Kunci yang nilainya teknis (bukan data karangan) dan dipertahankan apa adanya. */
    private const KEEP_KEYS = [
        'status', 'message', 'type', 'sort', 'period', 'range', 'group_by', 'groupBy',
        'timestamp', 'generated_at', 'api_version', 'version', 'currency', 'unit', 'lang',
        'page', 'limit', 'per_page',
    ];

    public static function like(mixed $value): mixed
    {
        $out = self::walk($value, null);
        if (is_array($out) && $out !== [] && !array_is_list($out) && !isset($out['data_source'])) {
            $out['data_source'] = 'unavailable';
        }
        return $out;
    }

    private static function walk(mixed $value, string|int|null $key): mixed
    {
        if (is_string($key) && in_array($key, self::KEEP_KEYS, true) && !is_array($value)) {
            return $value;
        }
        if (is_array($value)) {
            if ($value === [] || array_is_list($value)) {
                return [];
            }
            $out = [];
            foreach ($value as $k => $v) {
                $out[$k] = self::walk($v, $k);
            }
            return $out;
        }
        return match (true) {
            is_int($value)    => 0,
            is_float($value)  => 0.0,
            is_string($value) => '',
            is_bool($value)   => false,
            default           => null,
        };
    }
}
