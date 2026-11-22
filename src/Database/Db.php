<?php

declare(strict_types=1);

namespace Sciecola\Database;

use PDO;
use Throwable;

/**
 * @file src/Database/Db.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Koneksi PDO opsional: mengembalikan null bila database belum dikonfigurasi
 *        atau tidak terjangkau, sehingga halaman bisa memilih jalur lain tanpa error fatal.
 */
final class Db
{
    private static ?PDO $pdo = null;
    private static bool $failed = false;
    private static ?string $error = null;

    public static function pdo(): ?PDO
    {
        if (self::$pdo !== null || self::$failed) {
            return self::$pdo;
        }
        if (!defined('DB_HOST') || !DB_HOST || !defined('DB_DATABASE')) {
            self::$failed = true;
            self::$error  = 'database belum dikonfigurasi';
            return null;
        }
        try {
            $driver = defined('DB_DRIVER') ? DB_DRIVER : 'mysql';
            $port   = defined('DB_PORT') ? DB_PORT : '3306';
            $dsn = $driver === 'pgsql'
                ? sprintf('pgsql:host=%s;port=%s;dbname=%s', DB_HOST, $port, DB_DATABASE)
                : sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, $port, DB_DATABASE);
            self::$pdo = new PDO($dsn, DB_USERNAME, DB_PASSWORD, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (Throwable $e) {
            self::$failed = true;
            self::$error  = $e->getMessage();
        }
        return self::$pdo;
    }

    public static function lastError(): ?string
    {
        return self::$error;
    }

    /** Untuk pengujian: memakai koneksi yang sudah ada. */
    public static function use(PDO $pdo): void
    {
        self::$pdo    = $pdo;
        self::$failed = false;
    }
}
