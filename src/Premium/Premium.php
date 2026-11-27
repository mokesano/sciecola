<?php

declare(strict_types=1);

namespace Sciecola\Premium;

use PDO;
use Sciecola\Auth\UserAuth;
use Sciecola\Support\AppSettings;

/**
 * @file src/Premium/Premium.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Layanan premium: saklar utama, daftar fitur, keanggotaan Sponsor/Partner/Collaborator.
 *
 * Aturan inti:
 *  - Saklar utama AppSettings premium.enabled MATI → semua layanan gratis untuk semua orang,
 *    lencana premium dan etalase mitra disembunyikan. Tidak ada pemeriksaan keanggotaan.
 *  - Saklar menyala → setiap fitur yang dicentang (premium.f_<fitur>) menjadi layanan premium:
 *    hanya anggota aktif (dan admin) yang mendapatkannya, atau dibayar per penggunaan
 *    (verifikasi peluang).
 *
 * Keanggotaan disimpan di premium_memberships, dikelola dari Admin → Premium. Satu
 * keanggotaan dapat ditautkan ke akun (user_id), ORCID, dan/atau ID institusi.
 */
final class Premium
{
    public const TIERS = ['sponsor', 'partner', 'collaborator'];
    public const FEATURES = [
        'verified_listing', 'featured_listing', 'partner_showcase', 'institution_report',
        'data_export', 'priority_matching', 'analysis_quota',
    ];
    /** Urutan tampil etalase & peringkat prioritas. */
    public const TIER_RANK = ['sponsor' => 3, 'partner' => 2, 'collaborator' => 1];

    private static bool $ready = false;
    /** @var array<string,?array> */
    private static array $memberCache = [];

    // ── Saklar ────────────────────────────────────────────────────────────────

    public static function settings(): array
    {
        return AppSettings::group('premium') + AppSettings::DEFAULTS['premium'];
    }

    public static function enabled(): bool
    {
        return !empty(self::settings()['enabled']);
    }

    /** Fitur ini sedang berlaku sebagai layanan premium? */
    public static function active(string $feature): bool
    {
        $s = self::settings();
        return !empty($s['enabled']) && !empty($s['f_' . $feature]);
    }

    /** @return array<string,bool> */
    public static function featureMap(): array
    {
        $out = [];
        foreach (self::FEATURES as $f) $out[$f] = self::active($f);
        return $out;
    }

    // ── Skema ─────────────────────────────────────────────────────────────────

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) return;
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.premium_v1';
        if ($driver === 'mysql' && is_file($marker)) {
            self::$ready = true;
            return;
        }
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $pk   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
              : ($driver === 'pgsql' ? 'SERIAL PRIMARY KEY' : 'INT UNSIGNED AUTO_INCREMENT PRIMARY KEY');
        $pdo->exec("CREATE TABLE IF NOT EXISTS premium_memberships (
            id {$pk},
            tier VARCHAR(20) NOT NULL,
            display_name VARCHAR(255) NOT NULL,
            user_id INTEGER NULL,
            orcid VARCHAR(20) NULL,
            institution_id VARCHAR(191) NULL,
            logo_url VARCHAR(512) NULL,
            website VARCHAR(512) NULL,
            starts_on DATE NOT NULL,
            ends_on DATE NULL,
            status VARCHAR(12) NOT NULL DEFAULT 'active',
            note TEXT NULL,
            created_by INTEGER NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL
        ){$tail}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS premium_usage (
            usage_key VARCHAR(80) NOT NULL,
            feature VARCHAR(40) NOT NULL,
            period VARCHAR(10) NOT NULL,
            uses INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (usage_key, feature, period)
        ){$tail}");
        if ($driver === 'mysql') @file_put_contents($marker, date('c'));
        self::$ready = true;
    }

    // ── Keanggotaan ───────────────────────────────────────────────────────────

    private static function activeWhere(): string
    {
        return "status = 'active' AND starts_on <= ? AND (ends_on IS NULL OR ends_on >= ?)";
    }

    /** Keanggotaan aktif milik pengguna (lewat akun atau ORCID). Tidak memeriksa saklar. */
    public static function membershipFor(PDO $pdo, ?array $user): ?array
    {
        if (!$user) return null;
        $key = (int) ($user['id'] ?? 0) . '|' . strtoupper((string) ($user['orcid'] ?? ''));
        if (array_key_exists($key, self::$memberCache)) return self::$memberCache[$key];
        self::ensure($pdo);
        $today = date('Y-m-d');
        $orcid = strtoupper((string) ($user['orcid'] ?? ''));
        $st = $pdo->prepare('SELECT * FROM premium_memberships WHERE ' . self::activeWhere() . '
                              AND (user_id = ? OR (orcid IS NOT NULL AND orcid <> \'\' AND UPPER(orcid) = ?))');
        $st->execute([$today, $today, (int) ($user['id'] ?? 0), $orcid !== '' ? $orcid : '#']);
        $best = null;
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $m) {
            if (!$best || (self::TIER_RANK[$m['tier']] ?? 0) > (self::TIER_RANK[$best['tier']] ?? 0)) $best = $m;
        }
        return self::$memberCache[$key] = $best;
    }

    /**
     * Tingkat keanggotaan per ORCID, untuk lencana. Kosong bila saklar utama mati.
     * @param string[] $orcids
     * @return array<string,string> ORCID (huruf besar) → tier
     */
    public static function tiersForOrcids(PDO $pdo, array $orcids): array
    {
        if (!self::enabled()) return [];
        $orcids = array_values(array_unique(array_filter(array_map(static fn ($o) => strtoupper(trim((string) $o)), $orcids))));
        if (!$orcids) return [];
        self::ensure($pdo);
        $today = date('Y-m-d');
        $out = [];
        foreach (array_chunk($orcids, 200) as $chunk) {
            $in = implode(',', array_fill(0, count($chunk), '?'));
            // Akun yang ditautkan lewat user_id juga dihitung (ORCID diambil dari user_accounts).
            $sql = 'SELECT UPPER(COALESCE(NULLIF(m.orcid, \'\'), u.orcid)) AS o, m.tier
                      FROM premium_memberships m
                      LEFT JOIN user_accounts u ON u.id = m.user_id
                     WHERE m.status = \'active\' AND m.starts_on <= ? AND (m.ends_on IS NULL OR m.ends_on >= ?)
                       AND UPPER(COALESCE(NULLIF(m.orcid, \'\'), u.orcid)) IN (' . $in . ')';
            try {
                $st = $pdo->prepare($sql);
                $st->execute(array_merge([$today, $today], $chunk));
                foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
                    $o = (string) $r['o'];
                    if (!isset($out[$o]) || self::TIER_RANK[$r['tier']] > self::TIER_RANK[$out[$o]]) $out[$o] = $r['tier'];
                }
            } catch (\Throwable $e) {
                error_log('[Premium] tiersForOrcids: ' . $e->getMessage());
            }
        }
        return $out;
    }

    /** Daftar anggota aktif untuk etalase (hanya bila fitur etalase berlaku). */
    public static function showcase(PDO $pdo): array
    {
        if (!self::active('partner_showcase')) return [];
        self::ensure($pdo);
        $today = date('Y-m-d');
        $st = $pdo->prepare('SELECT id, tier, display_name, logo_url, website, institution_id
                               FROM premium_memberships WHERE ' . self::activeWhere() . ' ORDER BY starts_on ASC, id ASC');
        $st->execute([$today, $today]);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);
        usort($rows, static fn ($a, $b) => (self::TIER_RANK[$b['tier']] ?? 0) <=> (self::TIER_RANK[$a['tier']] ?? 0));
        return array_map(static fn ($r) => [
            'id' => (int) $r['id'], 'tier' => $r['tier'], 'name' => $r['display_name'],
            'logo_url' => $r['logo_url'], 'website' => $r['website'], 'institution_id' => $r['institution_id'],
        ], $rows);
    }

    // ── Akses fitur ───────────────────────────────────────────────────────────

    /**
     * Boleh memakai fitur? Selalu true bila fitur tidak sedang premium.
     * $ctx['institution'] dipakai untuk institution_report.
     */
    public static function canUse(PDO $pdo, string $feature, ?array $user, array $ctx = []): bool
    {
        if (!self::active($feature)) return true;
        if ($user && UserAuth::isAdmin($user)) return true;
        $m = self::membershipFor($pdo, $user);
        if (!$m) return false;
        if ($feature === 'institution_report') {
            $inst = trim((string) ($ctx['institution'] ?? ''));
            return $m['institution_id'] === null || $m['institution_id'] === '' || strcasecmp((string) $m['institution_id'], $inst) === 0;
        }
        return true;
    }

    /** Kuota verifikasi peluang gratis per tahun untuk tingkat keanggotaan. */
    public static function verifiedQuota(?array $membership): int
    {
        if (!$membership) return 0;
        $s = self::settings();
        return (int) ($s['quotaVerified' . ucfirst((string) $membership['tier'])] ?? 0);
    }

    public static function usage(PDO $pdo, string $key, string $feature, string $period): int
    {
        self::ensure($pdo);
        $st = $pdo->prepare('SELECT uses FROM premium_usage WHERE usage_key = ? AND feature = ? AND period = ?');
        $st->execute([$key, $feature, $period]);
        return (int) $st->fetchColumn();
    }

    /** Tambah pemakaian bila masih di bawah batas. true = berhasil (masih dalam kuota). */
    public static function consume(PDO $pdo, string $key, string $feature, string $period, int $limit): bool
    {
        self::ensure($pdo);
        if (self::usage($pdo, $key, $feature, $period) >= $limit) return false;
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $sql = $driver === 'mysql'
            ? 'INSERT INTO premium_usage (usage_key, feature, period, uses) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE uses = uses + 1'
            : 'INSERT INTO premium_usage (usage_key, feature, period, uses) VALUES (?, ?, ?, 1)
               ON CONFLICT (usage_key, feature, period) DO UPDATE SET uses = premium_usage.uses + 1';
        $pdo->prepare($sql)->execute([$key, $feature, $period]);
        return true;
    }

    /**
     * Kuota analisis ulang SDG (parameter refresh). Anggota & admin tanpa batas.
     * @return array{allowed:bool, used:int, limit:?int}
     */
    public static function checkAnalysisRefresh(PDO $pdo, ?array $user, string $ip): array
    {
        if (!self::active('analysis_quota')) return ['allowed' => true, 'used' => 0, 'limit' => null];
        if ($user && (UserAuth::isAdmin($user) || self::membershipFor($pdo, $user))) {
            return ['allowed' => true, 'used' => 0, 'limit' => null];
        }
        $limit = (int) self::settings()['freeAnalysisRefreshPerDay'];
        $key = $user ? 'u:' . (int) $user['id'] : 'ip:' . substr(hash('sha256', $ip), 0, 32);
        $day = date('Y-m-d');
        $ok = self::consume($pdo, $key, 'analysis_refresh', $day, $limit);
        return ['allowed' => $ok, 'used' => self::usage($pdo, $key, 'analysis_refresh', $day), 'limit' => $limit];
    }
}
