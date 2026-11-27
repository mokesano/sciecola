<?php

declare(strict_types=1);

namespace Sciecola\Auth;

use PDO;
use RuntimeException;
use Sciecola\Database\Db;

/**
 * @file src/Auth/AuthStore.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Penyimpanan akun, sesi, token sekali pakai, dan pengaturan keamanan pengguna.
 *
 * Tabel (dibuat otomatis bila belum ada, sehingga tidak perlu impor SQL manual di cPanel):
 *   user_accounts   — akun (sudah ada di db/schema.sql)
 *   user_security   — 2FA (TOTP), kode pemulihan, status verifikasi ORCID, ID Google
 *   auth_sessions   — sesi login; yang disimpan hanya hash SHA-256 token
 *   auth_tokens     — token sekali pakai: verifikasi email, reset sandi, tantangan 2FA,
 *                     state OAuth, klaim ORCID; disimpan sebagai hash
 *   auth_attempts   — catatan percobaan untuk pembatasan laju (rate limit)
 *
 * Token mentah tidak pernah disimpan di database: kebocoran database tidak
 * memberi penyerang sesi atau tautan reset yang bisa dipakai.
 */
final class AuthStore
{
    private const SCHEMA_VERSION = 1;

    private static ?self $instance = null;
    private PDO $pdo;
    private string $driver;

    private function __construct(PDO $pdo)
    {
        $this->pdo    = $pdo;
        $this->driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $this->ensureSchema();
    }

    public static function get(): self
    {
        if (self::$instance === null) {
            $pdo = Db::pdo();
            if (!$pdo) {
                throw new RuntimeException('Database tidak dapat dihubungi: ' . (Db::lastError() ?? 'tidak diketahui'));
            }
            self::$instance = new self($pdo);
        }
        return self::$instance;
    }

    /** Untuk pengujian. */
    public static function reset(): void
    {
        self::$instance = null;
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    public function driver(): string
    {
        return $this->driver;
    }

    // =========================================================================
    // Schema
    // =========================================================================

    private function ensureSchema(): void
    {
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.auth_schema_v' . self::SCHEMA_VERSION;
        if ($this->driver === 'mysql' && is_file($marker)) {
            return;
        }

        $ai   = $this->driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $bai  = $this->driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $uint = $this->driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
        $tail = $this->driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $ts   = 'TIMESTAMP NULL';

        // user_accounts biasanya sudah dibuat oleh db/schema.sql (dengan FK ke researchers).
        // Bila belum ada, buat tanpa FK agar login tetap berjalan.
        $stmts = [
            "CREATE TABLE IF NOT EXISTS user_accounts (
                id {$ai},
                orcid VARCHAR(20) NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                is_active TINYINT NOT NULL DEFAULT 1,
                email_verified TINYINT NOT NULL DEFAULT 0,
                last_login_at {$ts},
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS user_security (
                user_id {$uint} NOT NULL PRIMARY KEY,
                totp_secret VARCHAR(64) NULL,
                totp_pending_secret VARCHAR(64) NULL,
                totp_enabled TINYINT NOT NULL DEFAULT 0,
                totp_last_counter BIGINT NULL,
                recovery_codes TEXT NULL,
                orcid_verified TINYINT NOT NULL DEFAULT 0,
                google_sub VARCHAR(64) NULL UNIQUE,
                password_changed_at {$ts},
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS auth_sessions (
                id CHAR(64) NOT NULL PRIMARY KEY,
                user_id {$uint} NOT NULL,
                remember TINYINT NOT NULL DEFAULT 0,
                ip VARCHAR(45) NULL,
                user_agent VARCHAR(255) NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen_at {$ts},
                expires_at TIMESTAMP NOT NULL
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS auth_tokens (
                id {$bai},
                user_id {$uint} NULL,
                purpose VARCHAR(30) NOT NULL,
                token_hash CHAR(64) NOT NULL UNIQUE,
                code_hash CHAR(64) NULL,
                attempts {$uint} NOT NULL DEFAULT 0,
                data_json TEXT NULL,
                expires_at TIMESTAMP NOT NULL,
                used_at {$ts},
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS auth_attempts (
                id {$bai},
                scope VARCHAR(20) NOT NULL,
                identifier VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ){$tail}",
        ];
        foreach ($stmts as $sql) {
            $this->pdo->exec($sql);
        }
        $indexes = [
            ['auth_sessions', 'idx_auth_sessions_user', 'user_id'],
            ['auth_tokens', 'idx_auth_tokens_user_purpose', 'user_id, purpose'],
            ['auth_attempts', 'idx_auth_attempts_lookup', 'scope, identifier, created_at'],
        ];
        foreach ($indexes as [$table, $name, $cols]) {
            try {
                if ($this->driver === 'sqlite') {
                    $this->pdo->exec("CREATE INDEX IF NOT EXISTS {$name} ON {$table} ({$cols})");
                } else {
                    $this->pdo->exec("CREATE INDEX {$name} ON {$table} ({$cols})");
                }
            } catch (\Throwable $e) {
                // indeks sudah ada
            }
        }
        if ($this->driver === 'mysql') {
            @file_put_contents($marker, date('c'));
        }
    }

    // =========================================================================
    // Users
    // =========================================================================

    /** @return array<string,mixed>|null */
    public function findUserById(int $id): ?array
    {
        return $this->fetchUser('u.id = ?', [$id]);
    }

    /** @return array<string,mixed>|null */
    public function findUserByEmail(string $email): ?array
    {
        return $this->fetchUser('LOWER(u.email) = ?', [self::normalizeEmail($email)]);
    }

    /** @return array<string,mixed>|null */
    public function findUserByOrcid(string $orcid): ?array
    {
        return $this->fetchUser('u.orcid = ?', [strtoupper($orcid)]);
    }

    /** @return array<string,mixed>|null */
    public function findUserByGoogleSub(string $sub): ?array
    {
        return $this->fetchUser('s.google_sub = ?', [$sub]);
    }

    /** @return array<string,mixed>|null */
    private function fetchUser(string $where, array $params): ?array
    {
        $stmt = $this->pdo->prepare(
            "SELECT u.id, u.orcid, u.email, u.password_hash, u.name, u.role, u.is_active, u.email_verified,
                    u.last_login_at, u.created_at,
                    s.totp_secret, s.totp_pending_secret, s.totp_enabled, s.totp_last_counter,
                    s.recovery_codes, s.orcid_verified, s.google_sub, s.password_changed_at
               FROM user_accounts u
               LEFT JOIN user_security s ON s.user_id = u.id
              WHERE {$where}
              LIMIT 1"
        );
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function createUser(string $email, ?string $passwordHash, string $name, bool $emailVerified): int
    {
        $this->pdo->prepare(
            'INSERT INTO user_accounts (email, password_hash, name, email_verified) VALUES (?, ?, ?, ?)'
        )->execute([self::normalizeEmail($email), $passwordHash, mb_substr($name, 0, 255), $emailVerified ? 1 : 0]);
        $id = (int) $this->pdo->lastInsertId();
        $this->ensureSecurityRow($id);
        return $id;
    }

    public function ensureSecurityRow(int $userId): void
    {
        $sql = $this->driver === 'mysql'
            ? 'INSERT IGNORE INTO user_security (user_id) VALUES (?)'
            : 'INSERT INTO user_security (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING';
        $this->pdo->prepare($sql)->execute([$userId]);
    }

    /** @param array<string,mixed> $fields kolom user_accounts */
    public function updateUser(int $userId, array $fields): void
    {
        $allowed = ['orcid', 'email', 'password_hash', 'name', 'role', 'is_active', 'email_verified', 'last_login_at'];
        $sets = [];
        $params = [];
        foreach ($fields as $col => $val) {
            if (!in_array($col, $allowed, true)) {
                throw new RuntimeException("Kolom tidak diizinkan: {$col}");
            }
            $sets[] = "{$col} = ?";
            $params[] = $val;
        }
        if (!$sets) {
            return;
        }
        $sets[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $userId;
        $this->pdo->prepare('UPDATE user_accounts SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
    }

    /** @param array<string,mixed> $fields kolom user_security */
    public function updateSecurity(int $userId, array $fields): void
    {
        $allowed = ['totp_secret', 'totp_pending_secret', 'totp_enabled', 'totp_last_counter', 'recovery_codes',
                    'orcid_verified', 'google_sub', 'password_changed_at'];
        $this->ensureSecurityRow($userId);
        $sets = [];
        $params = [];
        foreach ($fields as $col => $val) {
            if (!in_array($col, $allowed, true)) {
                throw new RuntimeException("Kolom tidak diizinkan: {$col}");
            }
            $sets[] = "{$col} = ?";
            $params[] = $val;
        }
        if (!$sets) {
            return;
        }
        $sets[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $userId;
        $this->pdo->prepare('UPDATE user_security SET ' . implode(', ', $sets) . ' WHERE user_id = ?')->execute($params);
    }

    public function deleteUser(int $userId): void
    {
        $this->pdo->prepare('DELETE FROM auth_sessions WHERE user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM user_security WHERE user_id = ?')->execute([$userId]);
        $this->pdo->prepare('DELETE FROM user_accounts WHERE id = ?')->execute([$userId]);
    }

    /**
     * user_accounts.orcid punya FK ke researchers(orcid) di db/schema.sql; pastikan
     * barisnya ada sebelum ORCID ditautkan ke akun.
     */
    public function ensureResearcherStub(string $orcid, string $name): void
    {
        try {
            $exists = $this->pdo->prepare('SELECT 1 FROM researchers WHERE orcid = ?');
            $exists->execute([$orcid]);
            if ($exists->fetchColumn()) {
                return;
            }
            $this->pdo->prepare('INSERT INTO researchers (orcid, name) VALUES (?, ?)')
                ->execute([$orcid, mb_substr($name !== '' ? $name : $orcid, 0, 255)]);
        } catch (\Throwable $e) {
            // tabel researchers belum ada → tidak ada FK yang perlu dipenuhi
        }
    }

    // =========================================================================
    // Sessions
    // =========================================================================

    public function createSession(int $userId, string $token, bool $remember, int $ttlSeconds): void
    {
        $this->pdo->prepare(
            'INSERT INTO auth_sessions (id, user_id, remember, ip, user_agent, last_seen_at, expires_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)'
        )->execute([
            self::hash($token), $userId, $remember ? 1 : 0, self::clientIp(),
            mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
            gmdate('Y-m-d H:i:s', time() + $ttlSeconds),
        ]);
    }

    /** @return array<string,mixed>|null */
    public function findSession(string $token): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM auth_sessions WHERE id = ? LIMIT 1');
        $stmt->execute([self::hash($token)]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }
        if (strtotime($row['expires_at'] . ' UTC') < time()) {
            $this->deleteSessionById((string) $row['id']);
            return null;
        }
        return $row;
    }

    public function touchSession(string $id): void
    {
        $this->pdo->prepare('UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$id]);
    }

    public function deleteSessionById(string $id): void
    {
        $this->pdo->prepare('DELETE FROM auth_sessions WHERE id = ?')->execute([$id]);
    }

    public function deleteSessionsForUser(int $userId, ?string $exceptId = null): int
    {
        if ($exceptId !== null) {
            $stmt = $this->pdo->prepare('DELETE FROM auth_sessions WHERE user_id = ? AND id <> ?');
            $stmt->execute([$userId, $exceptId]);
        } else {
            $stmt = $this->pdo->prepare('DELETE FROM auth_sessions WHERE user_id = ?');
            $stmt->execute([$userId]);
        }
        return $stmt->rowCount();
    }

    /** @return array<int,array<string,mixed>> */
    public function listSessions(int $userId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id, remember, ip, user_agent, created_at, last_seen_at, expires_at
               FROM auth_sessions WHERE user_id = ? ORDER BY last_seen_at DESC LIMIT 50'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // =========================================================================
    // One-time tokens
    // =========================================================================

    /**
     * Membuat token sekali pakai. Mengembalikan token mentah (hanya hash yang disimpan).
     *
     * @param array<string,mixed> $data
     */
    public function createToken(?int $userId, string $purpose, int $ttlSeconds, array $data = [], ?string $code = null): string
    {
        // Satu token aktif per pengguna per tujuan: token lama dibatalkan.
        if ($userId !== null) {
            $this->pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ? AND used_at IS NULL')
                ->execute([$userId, $purpose]);
        }
        $token = self::randomToken();
        $this->pdo->prepare(
            'INSERT INTO auth_tokens (user_id, purpose, token_hash, code_hash, data_json, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([
            $userId, $purpose, self::hash($token), $code !== null ? self::hash($code) : null,
            $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null,
            gmdate('Y-m-d H:i:s', time() + $ttlSeconds),
        ]);
        return $token;
    }

    /** @return array<string,mixed>|null token yang masih berlaku (belum dipakai, belum kedaluwarsa) */
    public function findToken(string $token, string $purpose): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM auth_tokens WHERE token_hash = ? AND purpose = ? LIMIT 1');
        $stmt->execute([self::hash($token), $purpose]);
        return $this->validTokenRow($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
    }

    /** @return array<string,mixed>|null token aktif terbaru milik pengguna untuk tujuan tertentu */
    public function findActiveTokenForUser(int $userId, string $purpose): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM auth_tokens WHERE user_id = ? AND purpose = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1'
        );
        $stmt->execute([$userId, $purpose]);
        return $this->validTokenRow($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
    }

    /** @param array<string,mixed>|null $row */
    private function validTokenRow(?array $row): ?array
    {
        if (!$row || $row['used_at'] !== null || strtotime($row['expires_at'] . ' UTC') < time()) {
            return null;
        }
        $row['data'] = $row['data_json'] ? (json_decode((string) $row['data_json'], true) ?: []) : [];
        return $row;
    }

    public function markTokenUsed(int $id): void
    {
        $this->pdo->prepare('UPDATE auth_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$id]);
    }

    public function incrementTokenAttempts(int $id): int
    {
        $this->pdo->prepare('UPDATE auth_tokens SET attempts = attempts + 1 WHERE id = ?')->execute([$id]);
        $stmt = $this->pdo->prepare('SELECT attempts FROM auth_tokens WHERE id = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn();
    }

    public function setTokenCode(int $id, string $code, int $ttlSeconds): void
    {
        $this->pdo->prepare('UPDATE auth_tokens SET code_hash = ?, attempts = 0, expires_at = ? WHERE id = ?')
            ->execute([self::hash($code), gmdate('Y-m-d H:i:s', time() + $ttlSeconds), $id]);
    }

    /** @param array<string,mixed> $data */
    public function setTokenData(int $id, array $data): void
    {
        $this->pdo->prepare('UPDATE auth_tokens SET data_json = ? WHERE id = ?')
            ->execute([json_encode($data, JSON_UNESCAPED_UNICODE), $id]);
    }

    // =========================================================================
    // Rate limiting
    // =========================================================================

    public function recordAttempt(string $scope, string $identifier): void
    {
        // Waktu ditulis eksplisit dalam UTC agar perbandingan jendela waktu tidak
        // bergantung pada zona waktu sesi MySQL.
        $this->pdo->prepare('INSERT INTO auth_attempts (scope, identifier, created_at) VALUES (?, ?, ?)')
            ->execute([$scope, mb_substr(strtolower($identifier), 0, 255), gmdate('Y-m-d H:i:s')]);
        // Bersihkan catatan lama sesekali.
        if (random_int(1, 50) === 1) {
            $this->pdo->prepare('DELETE FROM auth_attempts WHERE created_at < ?')
                ->execute([gmdate('Y-m-d H:i:s', time() - 86400)]);
            $this->pdo->prepare('DELETE FROM auth_tokens WHERE expires_at < ?')
                ->execute([gmdate('Y-m-d H:i:s', time() - 86400)]);
            $this->pdo->prepare('DELETE FROM auth_sessions WHERE expires_at < ?')
                ->execute([gmdate('Y-m-d H:i:s')]);
        }
    }

    public function countAttempts(string $scope, string $identifier, int $windowSeconds): int
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM auth_attempts WHERE scope = ? AND identifier = ? AND created_at >= ?'
        );
        $stmt->execute([$scope, mb_substr(strtolower($identifier), 0, 255), gmdate('Y-m-d H:i:s', time() - $windowSeconds)]);
        return (int) $stmt->fetchColumn();
    }

    public function clearAttempts(string $scope, string $identifier): void
    {
        $this->pdo->prepare('DELETE FROM auth_attempts WHERE scope = ? AND identifier = ?')
            ->execute([$scope, mb_substr(strtolower($identifier), 0, 255)]);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    public static function hash(string $value): string
    {
        return hash('sha256', $value);
    }

    public static function randomToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public static function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    public static function clientIp(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    }
}
