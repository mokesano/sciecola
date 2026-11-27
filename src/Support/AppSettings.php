<?php

declare(strict_types=1);

namespace Sciecola\Support;

use PDO;
use Sciecola\Database\Db;

/**
 * @file src/Support/AppSettings.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pengaturan aplikasi yang diubah dari halaman Admin (tabel app_settings) dan log audit admin.
 *
 * Setiap grup disimpan sebagai satu baris JSON. Nilai yang tidak ada di database
 * memakai DEFAULTS, jadi aplikasi tetap berjalan sebelum admin menyimpan apa pun.
 * Kunci rahasia (SMTP, OAuth, API key) TIDAK disimpan di sini: tetap di file .env.
 *
 * Grup dan pemakainya:
 *   system  → auth.php (pendaftaran, verifikasi email), UserAuth (lama sesi),
 *             frontend (mode pemeliharaan)
 *   content → frontend (sembunyikan halaman jurnal/institusi/peneliti dari pengunjung)
 *   ui      → frontend (warna utama/sekunder, jenis huruf)
 *   impact  → SangiaApiClient::impact (bobot Wizdam Impact Score dikirim ke wizdam-apis)
 */
final class AppSettings
{
    public const DEFAULTS = [
        'system' => [
            'maintenanceMode'          => false,
            'maintenanceMessage'       => '',
            'allowNewRegistrations'    => true,
            'requireEmailVerification' => true,
            'sessionTimeoutMinutes'    => 1440,
        ],
        'content' => [
            'showJournalsMain'     => true,
            'showInstitutionsMain' => true,
            'showResearchersMain'  => true,
        ],
        'ui' => [
            'primaryColor'     => '#6366f1',
            'secondaryColor'   => '#8b5cf6',
            'fontFamily'       => 'Inter',
        ],
        // Pasar Inovasi: kurasi publik + biaya penayangan (persetujuan admin menunggu pembayaran).
        'marketplace' => [
            'feeEnabled'           => true,
            'feeAmount'            => 0,          // 0 = gratis (biaya dianggap dibebaskan)
            'feeCurrency'          => 'IDR',
            'feeInstructions'      => '',         // cara membayar (rekening, dsb.), tampil ke pemasang
            'autoHideReports'      => 3,          // laporan dari orang berbeda sebelum disembunyikan otomatis
            'curatorsRequireOrcid' => true,       // hanya akun ber-ORCID yang boleh menilai
            'allowApplyInReview'   => true,       // boleh melamar peluang yang belum diverifikasi
        ],
        'impact' => [
            'academic' => 0.40,
            'social'   => 0.25,
            'economic' => 0.20,
            'sdg'      => 0.15,
        ],
    ];

    /** Grup yang boleh dibaca siapa pun (dipakai frontend sebelum login). */
    public const PUBLIC_GROUPS = ['system', 'content', 'ui', 'marketplace'];

    /** @var array<string,array<string,mixed>>|null */
    private static ?array $cache = null;
    private static bool $schemaReady = false;

    /** @return array<string,array<string,mixed>> */
    public static function all(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }
        $out = self::DEFAULTS;
        $pdo = Db::pdo();
        if ($pdo) {
            try {
                self::ensureSchema($pdo);
                foreach ($pdo->query('SELECT setting_group, value_json FROM app_settings') as $row) {
                    $g = (string) $row['setting_group'];
                    if (!isset($out[$g])) {
                        continue;
                    }
                    $stored = json_decode((string) $row['value_json'], true);
                    if (is_array($stored)) {
                        $out[$g] = array_merge($out[$g], array_intersect_key($stored, $out[$g]));
                    }
                }
            } catch (\Throwable $e) {
                error_log('[AppSettings] ' . $e->getMessage());
            }
        }
        return self::$cache = $out;
    }

    /** @return array<string,mixed> */
    public static function group(string $group): array
    {
        return self::all()[$group] ?? [];
    }

    public static function get(string $group, string $key, $default = null)
    {
        return self::all()[$group][$key] ?? $default;
    }

    /** @return array<string,array<string,mixed>> */
    public static function publicSettings(): array
    {
        $all = self::all();
        $out = array_intersect_key($all, array_flip(self::PUBLIC_GROUPS));
        unset($out['system']['sessionTimeoutMinutes']);
        return $out;
    }

    /**
     * Menyimpan satu grup setelah divalidasi. Mengembalikan nilai lama dan baru untuk audit.
     *
     * @param array<string,mixed> $values
     * @return array{old:array<string,mixed>,new:array<string,mixed>}
     */
    public static function save(string $group, array $values, ?int $userId): array
    {
        if (!isset(self::DEFAULTS[$group])) {
            throw new \InvalidArgumentException('Grup pengaturan tidak dikenal');
        }
        $old = self::group($group);
        $new = $old;
        foreach (self::DEFAULTS[$group] as $key => $default) {
            if (!array_key_exists($key, $values)) {
                continue;
            }
            $new[$key] = self::sanitize($group, $key, $values[$key], $default);
        }
        if ($group === 'impact') {
            $sum = array_sum(array_map('floatval', $new));
            if (abs($sum - 1.0) > 0.011) {
                throw new \InvalidArgumentException('Total bobot harus 100%.');
            }
        }
        $pdo = Db::pdo();
        if (!$pdo) {
            throw new \RuntimeException('Database tidak dapat dihubungi');
        }
        self::ensureSchema($pdo);
        $json = json_encode($new, JSON_UNESCAPED_UNICODE);
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $sql = $driver === 'mysql'
            ? 'INSERT INTO app_settings (setting_group, value_json, updated_by, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
               ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_by = VALUES(updated_by), updated_at = CURRENT_TIMESTAMP'
            : 'INSERT INTO app_settings (setting_group, value_json, updated_by, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT (setting_group) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP';
        $pdo->prepare($sql)->execute([$group, $json, $userId]);
        self::$cache = null;
        return ['old' => $old, 'new' => $new];
    }

    private static function sanitize(string $group, string $key, $value, $default)
    {
        if (is_bool($default)) {
            return filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }
        if ($group === 'impact') {
            return round(max(0.0, min(1.0, (float) $value)), 2);
        }
        if ($key === 'sessionTimeoutMinutes') {
            return max(15, min(43200, (int) $value));
        }
        if (in_array($key, ['primaryColor', 'secondaryColor'], true)) {
            return preg_match('/^#[0-9a-fA-F]{6}$/', (string) $value) ? strtolower((string) $value) : $default;
        }
        if ($key === 'fontFamily') {
            return in_array($value, ['Inter', 'Roboto', 'Open Sans', 'Nunito'], true) ? $value : $default;
        }
        if ($key === 'feeAmount') {
            return max(0, min(1000000000, (int) round((float) $value)));
        }
        if ($key === 'feeCurrency') {
            return in_array($value, ['IDR', 'USD'], true) ? $value : $default;
        }
        if ($key === 'feeInstructions') {
            return mb_substr(trim(strip_tags((string) $value)), 0, 1500);
        }
        if ($key === 'autoHideReports') {
            return max(1, min(50, (int) $value));
        }
        if ($key === 'maintenanceMessage') {
            return mb_substr(trim(strip_tags((string) $value)), 0, 500);
        }
        return $default;
    }

    // =========================================================================
    // Audit log
    // =========================================================================

    /** Mencatat tindakan admin. Gagal mencatat tidak menggagalkan tindakan. */
    public static function audit(?array $admin, string $action, string $target, $before = null, $after = null): void
    {
        $pdo = Db::pdo();
        if (!$pdo) {
            return;
        }
        try {
            self::ensureSchema($pdo);
            $pdo->prepare(
                'INSERT INTO admin_audit_log (admin_user_id, admin_email, action, target, before_json, after_json, ip, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $admin ? (int) $admin['id'] : null,
                $admin ? (string) $admin['email'] : 'token-admin',
                mb_substr($action, 0, 60),
                mb_substr($target, 0, 255),
                $before !== null ? json_encode($before, JSON_UNESCAPED_UNICODE) : null,
                $after !== null ? json_encode($after, JSON_UNESCAPED_UNICODE) : null,
                (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
                gmdate('Y-m-d H:i:s'),
            ]);
        } catch (\Throwable $e) {
            error_log('[AppSettings] audit: ' . $e->getMessage());
        }
    }

    /** @return array<int,array<string,mixed>> */
    public static function auditLog(int $limit = 100, int $offset = 0): array
    {
        $pdo = Db::pdo();
        if (!$pdo) {
            return [];
        }
        self::ensureSchema($pdo);
        $stmt = $pdo->prepare(
            'SELECT id, admin_email, action, target, before_json, after_json, ip, created_at
               FROM admin_audit_log ORDER BY id DESC LIMIT ' . max(1, min(500, $limit)) . ' OFFSET ' . max(0, $offset)
        );
        $stmt->execute();
        return array_map(static function ($r) {
            $r['before'] = $r['before_json'] ? json_decode((string) $r['before_json'], true) : null;
            $r['after']  = $r['after_json'] ? json_decode((string) $r['after_json'], true) : null;
            unset($r['before_json'], $r['after_json']);
            return $r;
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    private static function ensureSchema(PDO $pdo): void
    {
        if (self::$schemaReady) {
            return;
        }
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $ai   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $pdo->exec("CREATE TABLE IF NOT EXISTS app_settings (
            setting_group VARCHAR(40) NOT NULL PRIMARY KEY,
            value_json TEXT NOT NULL,
            updated_by INT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ){$tail}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS admin_audit_log (
            id {$ai},
            admin_user_id INT NULL,
            admin_email VARCHAR(255) NULL,
            action VARCHAR(60) NOT NULL,
            target VARCHAR(255) NOT NULL DEFAULT '',
            before_json TEXT NULL,
            after_json TEXT NULL,
            ip VARCHAR(45) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ){$tail}");
        self::$schemaReady = true;
    }

    /** Untuk pengujian. */
    public static function forget(): void
    {
        self::$cache = null;
        self::$schemaReady = false;
    }
}
