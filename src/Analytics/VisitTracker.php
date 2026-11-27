<?php

declare(strict_types=1);

namespace Sciecola\Analytics;

use PDO;
use Sciecola\Geo\GeoLite2Service;

/**
 * @file src/Analytics/VisitTracker.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pencatatan kunjungan halaman nyata (dipakai api/wrapper/track.php dan monitoring).
 *
 * Aplikasi memakai HashRouter (/#/halaman), sehingga server tidak pernah tahu halaman
 * mana yang dibuka bila hanya mencatat permintaan HTML. Karena itu kunjungan dicatat
 * oleh frontend: satu baris per halaman yang dibuka (visit_type = 'pageview'), lalu
 * lama tampil halaman diperbarui saat pengguna pindah halaman atau menutup tab.
 *
 * Baris lama di access_logs (dari AccessLogger sisi server) tidak dipakai monitoring:
 * page_path-nya selalu "/" dan durasinya tidak pernah terisi.
 *
 * Waktu ditulis dari PHP (zona waktu aplikasi), bukan CURRENT_TIMESTAMP database,
 * agar rentang waktu di monitoring konsisten.
 */
final class VisitTracker
{
    public const TYPE = 'pageview';
    private const MAX_DURATION = 1800; // detik; tab yang ditinggal terbuka tidak dihitung berjam-jam

    private static bool $ready = false;

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) {
            return;
        }
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.visit_tracker_v1';
        if ($driver === 'mysql' && is_file($marker)) {
            self::$ready = true;
            return;
        }
        $ai   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        // Struktur sama dengan db/schema.sql (tanpa FK) untuk instalasi yang belum punya tabelnya.
        $pdo->exec("CREATE TABLE IF NOT EXISTS access_logs (
            id {$ai},
            user_orcid VARCHAR(20) NULL,
            ip_address VARCHAR(45) NOT NULL,
            page_path VARCHAR(512) NOT NULL,
            http_method VARCHAR(10) NOT NULL,
            http_status SMALLINT NOT NULL,
            device_type VARCHAR(50) NULL,
            browser VARCHAR(100) NULL,
            os VARCHAR(100) NULL,
            city VARCHAR(100) NULL,
            country VARCHAR(100) NULL,
            latitude DECIMAL(10,7) NULL,
            longitude DECIMAL(10,7) NULL,
            session_id VARCHAR(64) NULL,
            session_duration INT NULL,
            referrer VARCHAR(512) NULL,
            traffic_source VARCHAR(50) NULL,
            utm_source VARCHAR(100) NULL,
            utm_medium VARCHAR(100) NULL,
            utm_campaign VARCHAR(100) NULL,
            is_bot TINYINT NOT NULL DEFAULT 0,
            visit_type VARCHAR(20) NOT NULL DEFAULT 'normal',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ){$tail}");
        self::addColumn($pdo, $driver, 'visitor_id', 'VARCHAR(40) NULL');
        try {
            $pdo->exec($driver === 'sqlite'
                ? 'CREATE INDEX IF NOT EXISTS idx_al_type_date ON access_logs (visit_type, created_at)'
                : 'CREATE INDEX idx_al_type_date ON access_logs (visit_type, created_at)');
        } catch (\Throwable $e) {
            // sudah ada
        }
        if ($driver === 'mysql') {
            @file_put_contents($marker, date('c'));
        }
        self::$ready = true;
    }

    private static function addColumn(PDO $pdo, string $driver, string $column, string $definition): void
    {
        try {
            if ($driver === 'sqlite') {
                $cols = array_column($pdo->query('PRAGMA table_info(access_logs)')->fetchAll(PDO::FETCH_ASSOC), 'name');
                $exists = in_array($column, $cols, true);
            } else {
                $st = $pdo->prepare('SHOW COLUMNS FROM access_logs LIKE ?');
                $st->execute([$column]);
                $exists = (bool) $st->fetch();
            }
            if (!$exists) {
                $pdo->exec("ALTER TABLE access_logs ADD COLUMN {$column} {$definition}");
            }
        } catch (\Throwable $e) {
            error_log('[VisitTracker] addColumn ' . $column . ': ' . $e->getMessage());
        }
    }

    /** Path SPA yang aman disimpan, atau null bila tidak dicatat. */
    public static function normalizePath(string $path): ?string
    {
        $path = trim($path);
        if ($path === '' || $path[0] !== '/') {
            return null;
        }
        $path = preg_replace('/[?#].*$/', '', $path) ?? '/';
        $path = preg_replace('#/{2,}#', '/', $path) ?? '/';
        if (strlen($path) > 1) {
            $path = rtrim($path, '/');
        }
        // Halaman admin tidak dihitung sebagai kunjungan publik.
        if (preg_match('#^/(admin|monitoring)(/|$)#', $path)) {
            return null;
        }
        return mb_substr($path, 0, 255);
    }

    /** @return array{browser:string, os:string, device_type:string, is_bot:bool} */
    public static function parseUserAgent(string $ua): array
    {
        $l = strtolower($ua);
        $isBot = $ua === '' || (bool) preg_match('/bot|crawl|spider|slurp|scrap|headless|lighthouse|pingdom|uptime|python-requests|curl|wget|httpclient|facebookexternalhit|preview/', $l);

        $browser = 'Other';
        if (str_contains($l, 'edg/'))                                     $browser = 'Edge';
        elseif (str_contains($l, 'opr/') || str_contains($l, 'opera'))   $browser = 'Opera';
        elseif (str_contains($l, 'firefox/') || str_contains($l, 'fxios')) $browser = 'Firefox';
        elseif (str_contains($l, 'samsungbrowser'))                       $browser = 'Samsung Internet';
        elseif (str_contains($l, 'chrome/') || str_contains($l, 'crios')) $browser = 'Chrome';
        elseif (str_contains($l, 'safari/'))                              $browser = 'Safari';

        $os = 'Other';
        if (str_contains($l, 'windows'))                                   $os = 'Windows';
        elseif (str_contains($l, 'iphone') || str_contains($l, 'ipad'))    $os = 'iOS';
        elseif (str_contains($l, 'android'))                               $os = 'Android';
        elseif (str_contains($l, 'mac os x') || str_contains($l, 'macintosh')) $os = 'macOS';
        elseif (str_contains($l, 'cros'))                                  $os = 'ChromeOS';
        elseif (str_contains($l, 'linux'))                                 $os = 'Linux';

        $device = 'desktop';
        if (str_contains($l, 'ipad') || str_contains($l, 'tablet') || (str_contains($l, 'android') && !str_contains($l, 'mobile'))) {
            $device = 'tablet';
        } elseif (str_contains($l, 'mobile') || str_contains($l, 'iphone')) {
            $device = 'mobile';
        }
        return ['browser' => $browser, 'os' => $os, 'device_type' => $device, 'is_bot' => $isBot];
    }

    /** Sumber trafik dari referrer luar dan parameter UTM. */
    public static function classifySource(?string $referrer, ?string $utmMedium, string $ownHost): string
    {
        $m = strtolower((string) $utmMedium);
        if ($m === 'email' || $m === 'newsletter') return 'email';
        if (in_array($m, ['social', 'social-media', 'sosmed'], true)) return 'social';
        if (in_array($m, ['cpc', 'ppc', 'paid'], true)) return 'paid';
        $host = strtolower((string) parse_url((string) $referrer, PHP_URL_HOST));
        $host = preg_replace('/^www\./', '', $host) ?? $host;
        if ($host === '' || $host === strtolower($ownHost)) return 'direct';
        foreach (['google.', 'bing.com', 'yahoo.', 'duckduckgo.com', 'baidu.com', 'yandex.', 'ecosia.org'] as $s) {
            if (str_contains($host, $s)) return 'organic';
        }
        foreach (['facebook.com', 'fb.com', 'twitter.com', 'x.com', 't.co', 'linkedin.com', 'lnkd.in', 'instagram.com',
                  'youtube.com', 'whatsapp.com', 'wa.me', 't.me', 'telegram.org', 'reddit.com', 'tiktok.com'] as $s) {
            if ($host === $s || str_ends_with($host, '.' . $s)) return 'social';
        }
        return 'referral';
    }

    public static function clientIp(): string
    {
        // Cloudflare menulis alamat asli di CF-Connecting-IP; selain itu pakai REMOTE_ADDR
        // (X-Forwarded-For mudah dipalsukan bila server tidak di belakang proxy tepercaya).
        foreach (['HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR'] as $k) {
            $ip = trim((string) ($_SERVER[$k] ?? ''));
            if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
        return '0.0.0.0';
    }

    /**
     * Catat satu tampilan halaman. @return int|null id baris (untuk pembaruan durasi)
     *
     * @param array{path:string, sid:string, vid:string, referrer:?string, utm_source:?string,
     *              utm_medium:?string, utm_campaign:?string, user_orcid:?string, ua:string} $v
     */
    public static function recordView(PDO $pdo, array $v): ?int
    {
        self::ensure($pdo);
        $ua  = self::parseUserAgent($v['ua']);
        if ($ua['is_bot']) {
            return null;
        }
        $ip  = self::clientIp();
        $geo = null;
        try {
            $geo = (new GeoLite2Service())->lookup($ip);
        } catch (\Throwable $e) {
            $geo = null;
        }
        $ownHost = (string) parse_url((defined('SITE_URL') ? SITE_URL : ''), PHP_URL_HOST) ?: (string) ($_SERVER['HTTP_HOST'] ?? '');
        $row = [
            'user_orcid'     => $v['user_orcid'] ?: null,
            'ip_address'     => $ip,
            'page_path'      => $v['path'],
            'http_method'    => 'GET',
            'http_status'    => 200,
            'device_type'    => $ua['device_type'],
            'browser'        => $ua['browser'],
            'os'             => $ua['os'],
            'city'           => $geo['city'] ?? null,
            'country'        => $geo['country'] ?? null,
            'latitude'       => isset($geo['latitude']) && $geo['latitude'] ? $geo['latitude'] : null,
            'longitude'      => isset($geo['longitude']) && $geo['longitude'] ? $geo['longitude'] : null,
            'session_id'     => $v['sid'],
            'session_duration' => null,
            'referrer'       => $v['referrer'] ? mb_substr($v['referrer'], 0, 512) : null,
            'traffic_source' => self::classifySource($v['referrer'], $v['utm_medium'], $ownHost),
            'utm_source'     => $v['utm_source'] ? mb_substr($v['utm_source'], 0, 100) : null,
            'utm_medium'     => $v['utm_medium'] ? mb_substr($v['utm_medium'], 0, 100) : null,
            'utm_campaign'   => $v['utm_campaign'] ? mb_substr($v['utm_campaign'], 0, 100) : null,
            'is_bot'         => 0,
            'visit_type'     => self::TYPE,
            'visitor_id'     => $v['vid'],
            'created_at'     => date('Y-m-d H:i:s'),
        ];
        $insert = static function (array $row) use ($pdo): int {
            $cols = array_keys($row);
            $sql = 'INSERT INTO access_logs (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')';
            $pdo->prepare($sql)->execute(array_values($row));
            return (int) $pdo->lastInsertId();
        };
        try {
            return $insert($row);
        } catch (\Throwable $e) {
            // user_orcid punya FK ke researchers; ORCID yang belum ada di sana ditolak.
            if ($row['user_orcid'] !== null) {
                $row['user_orcid'] = null;
                return $insert($row);
            }
            throw $e;
        }
    }

    /** Perbarui lama tampil halaman (detik) untuk baris milik sesi yang sama. */
    public static function recordDuration(PDO $pdo, int $id, string $sid, int $seconds): bool
    {
        self::ensure($pdo);
        $seconds = max(0, min(self::MAX_DURATION, $seconds));
        $st = $pdo->prepare(
            "UPDATE access_logs SET session_duration = ?
              WHERE id = ? AND session_id = ? AND visit_type = ? AND created_at >= ?"
        );
        $st->execute([$seconds, $id, $sid, self::TYPE, date('Y-m-d H:i:s', time() - 6 * 3600)]);
        return $st->rowCount() > 0;
    }
}
