<?php

declare(strict_types=1);

namespace Sciecola\Middleware;

use PDO;
use Sciecola\Analytics\VisitTracker;
use Sciecola\Database\Db;
use Sciecola\Geo\GeoLite2Service;

/**
 * @file src/Middleware/AccessLogger.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pencatat akses mencurigakan untuk keperluan keamanan (tabel security_events).
 *
 * Kunjungan halaman biasa dicatat oleh Sciecola\Analytics\VisitTracker (dari browser).
 * Class ini mencatat sisi lain yang hanya terlihat oleh server: permintaan yang tidak
 * lewat halaman utama, pemindaian celah keamanan, akses yang diblokir .htaccess, login
 * gagal / brute force, token admin salah, dan kunjungan bot. Hasilnya tampil di
 * Admin → Monitoring (peta: merah = bahaya, kuning = peringatan) dan bisa dipakai
 * untuk fitur keamanan berikutnya (pemblokiran IP otomatis, notifikasi admin, dsb.).
 *
 * Pemakaian:
 *   AccessLogger::inspectRequest();                         // di includes/bootstrap.php
 *   AccessLogger::record('login_failed', ['identifier' => 'a***@x.org']);
 *
 * Semua metode tidak pernah melempar exception: kegagalan pencatatan tidak boleh
 * mengganggu permintaan pengguna.
 */
final class AccessLogger
{
    /** Jenis peristiwa → tingkat. Tambahkan jenis baru di sini. */
    public const EVENTS = [
        'brute_force'         => 'danger',   // banyak login gagal dari IP yang sama
        'scanner_probe'       => 'danger',   // mencari celah: /.env, /wp-login.php, ../, union select, …
        'blocked_request'     => 'danger',   // ditolak .htaccess (file sensitif, user-agent/metode terlarang)
        'admin_token_invalid' => 'danger',   // header X-Admin-Token salah
        'login_failed'        => 'warning',  // satu kali login / kode 2FA gagal
        'direct_access'       => 'warning',  // membuka alamat selain halaman utama (aplikasi memakai /#/)
        'api_probe'           => 'warning',  // memanggil endpoint API yang tidak ada
        'bot_visit'           => 'warning',  // crawler / klien otomatis
    ];

    /** Login gagal dari satu IP dalam 15 menit yang dianggap brute force. */
    public const BRUTE_FORCE_THRESHOLD = 5;
    public const BRUTE_FORCE_WINDOW    = 900;

    /** Peristiwa sama dari IP sama dalam jendela ini digabung (kolom hits) agar tabel tidak membengkak. */
    private const MERGE_WINDOW = 600;

    private const PROBE_PATTERN = '~(
          /\.(env|git|svn|hg|htaccess|htpasswd|ds_store|aws|ssh|vscode|idea)(/|$)
        | wp-(admin|login|content|includes|config)|xmlrpc\.php|wlwmanifest
        | phpmyadmin|/pma(/|$)|adminer|phpinfo|server-status|/cgi-bin/
        | \.(sql|bak|old|orig|swp|zip|tar|gz|tgz|7z|rar|log|ini|conf)$
        | vendor/phpunit|eval-stdin|/boaform|/hnap1|/actuator|/solr/|/owa/|/autodiscover
        | \.\./|%2e%2e|%00|<script|%3cscript|union(\s|%20|\+)+select|/etc/passwd|base64_decode|shell\.php|cmd=
    )~xi';

    private static bool $ready = false;
    private static array $geoCache = [];

    // ─── Skema ──────────────────────────────────────────────────────────────

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) {
            return;
        }
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.security_events_v1';
        if ($driver === 'mysql' && is_file($marker)) {
            self::$ready = true;
            return;
        }
        $ai   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $uint = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $pdo->exec("CREATE TABLE IF NOT EXISTS security_events (
            id {$ai},
            event_type VARCHAR(30) NOT NULL,
            severity VARCHAR(10) NOT NULL,
            ip_address VARCHAR(45) NOT NULL,
            http_method VARCHAR(10) NULL,
            path VARCHAR(512) NULL,
            user_agent VARCHAR(255) NULL,
            identifier VARCHAR(255) NULL,
            city VARCHAR(100) NULL,
            country VARCHAR(100) NULL,
            latitude DECIMAL(10,7) NULL,
            longitude DECIMAL(10,7) NULL,
            hits {$uint} NOT NULL DEFAULT 1,
            detail TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_seen_at TIMESTAMP NULL
        ){$tail}");
        foreach ([
            ['idx_se_seen', 'last_seen_at'],
            ['idx_se_ip_type', 'ip_address, event_type, last_seen_at'],
        ] as [$name, $cols]) {
            try {
                $pdo->exec($driver === 'sqlite'
                    ? "CREATE INDEX IF NOT EXISTS {$name} ON security_events ({$cols})"
                    : "CREATE INDEX {$name} ON security_events ({$cols})");
            } catch (\Throwable $e) {
                // sudah ada
            }
        }
        if ($driver === 'mysql') {
            @file_put_contents($marker, date('c'));
        }
        self::$ready = true;
    }

    private static function pdo(): ?PDO
    {
        try {
            if (!defined('DB_DATABASE') && defined('ROOT_PATH') && is_file(ROOT_PATH . '/config/config.php')) {
                require_once ROOT_PATH . '/config/config.php';
            }
            $pdo = Db::pdo();
            if ($pdo) {
                self::ensure($pdo);
            }
            return $pdo;
        } catch (\Throwable $e) {
            return null;
        }
    }

    // ─── Pencatatan ─────────────────────────────────────────────────────────

    /**
     * Catat satu peristiwa keamanan.
     * @param array{identifier?:string, path?:string, detail?:array, ip?:string} $ctx
     */
    public static function record(string $type, array $ctx = []): void
    {
        if (!isset(self::EVENTS[$type])) {
            return;
        }
        try {
            $pdo = self::pdo();
            if (!$pdo) {
                return;
            }
            $ip   = $ctx['ip'] ?? VisitTracker::clientIp();
            $now  = date('Y-m-d H:i:s');
            $path = mb_substr((string) ($ctx['path'] ?? self::requestPath()), 0, 512);

            // Gabungkan dengan peristiwa yang sama dari IP yang sama dalam 10 menit terakhir.
            $st = $pdo->prepare(
                'SELECT id FROM security_events WHERE ip_address = ? AND event_type = ? AND last_seen_at >= ?
                  ORDER BY id DESC LIMIT 1'
            );
            $st->execute([$ip, $type, date('Y-m-d H:i:s', time() - self::MERGE_WINDOW)]);
            $existing = $st->fetchColumn();
            if ($existing !== false) {
                $pdo->prepare('UPDATE security_events SET hits = hits + 1, last_seen_at = ?, path = ? WHERE id = ?')
                    ->execute([$now, $path, (int) $existing]);
                return;
            }

            $geo = self::geo($ip);
            $pdo->prepare(
                'INSERT INTO security_events
                   (event_type, severity, ip_address, http_method, path, user_agent, identifier,
                    city, country, latitude, longitude, hits, detail, created_at, last_seen_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)'
            )->execute([
                $type,
                self::EVENTS[$type],
                $ip,
                substr((string) ($_SERVER['REQUEST_METHOD'] ?? ''), 0, 10) ?: null,
                $path,
                mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255) ?: null,
                isset($ctx['identifier']) ? mb_substr((string) $ctx['identifier'], 0, 255) : null,
                $geo['city'] ?? null,
                $geo['country'] ?? null,
                !empty($geo['latitude']) ? $geo['latitude'] : null,
                !empty($geo['longitude']) ? $geo['longitude'] : null,
                !empty($ctx['detail']) ? json_encode($ctx['detail'], JSON_UNESCAPED_UNICODE) : null,
                $now,
                $now,
            ]);

            // Bersihkan peristiwa lebih dari 90 hari sesekali.
            if (random_int(1, 200) === 1) {
                $pdo->prepare('DELETE FROM security_events WHERE last_seen_at < ?')
                    ->execute([date('Y-m-d H:i:s', time() - 90 * 86400)]);
            }
        } catch (\Throwable $e) {
            error_log('[AccessLogger] ' . $e->getMessage());
        }
    }

    /**
     * Catat login gagal; naik menjadi brute_force bila IP yang sama sudah gagal
     * BRUTE_FORCE_THRESHOLD kali dalam 15 menit.
     */
    public static function loginFailed(string $identifier, int $failuresFromIp, string $stage = 'password'): void
    {
        $type = $failuresFromIp >= self::BRUTE_FORCE_THRESHOLD ? 'brute_force' : 'login_failed';
        self::record($type, [
            'identifier' => self::maskIdentifier($identifier),
            'detail'     => ['stage' => $stage, 'failures_15m' => $failuresFromIp],
        ]);
    }

    /**
     * Periksa permintaan non-API yang sampai ke PHP (dipanggil di includes/bootstrap.php).
     * Mengakhiri permintaan (403/404) untuk akses yang diblokir atau alamat yang tidak ada.
     */
    public static function inspectRequest(): void
    {
        $path = self::requestPath();

        // Ditolak .htaccess lalu diteruskan ke sini (E=SC_BLOCK:alasan) agar tercatat.
        $block = (string) ($_SERVER['REDIRECT_SC_BLOCK'] ?? $_SERVER['SC_BLOCK'] ?? getenv('SC_BLOCK') ?: '');
        if ($block !== '') {
            self::record('blocked_request', ['detail' => ['reason' => $block]]);
            self::deny(403);
        }

        $notFound = (string) ($_SERVER['REDIRECT_SC_NOTFOUND'] ?? $_SERVER['SC_NOTFOUND'] ?? getenv('SC_NOTFOUND') ?: '');
        $isEntry  = in_array($path, ['/', '/index.php', ''], true);
        if ($notFound !== '' || !$isEntry) {
            // Aplikasi memakai HashRouter: halaman sah selalu dibuka lewat "/" (#/…).
            $type = preg_match(self::PROBE_PATTERN, rawurldecode((string) ($_SERVER['REQUEST_URI'] ?? $path)))
                ? 'scanner_probe' : 'direct_access';
            self::record($type);
            self::deny(404);
        }

        // Halaman utama dibuka oleh crawler/klien otomatis.
        $ua = VisitTracker::parseUserAgent((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
        if ($ua['is_bot']) {
            self::record('bot_visit', ['detail' => ['user_agent_family' => self::botFamily()]]);
        }
    }

    /**
     * Dipanggil public/guard.php untuk permintaan yang ditolak atau tidak ditemukan oleh
     * .htaccess (guard.php?r=alasan). Selalu mengakhiri permintaan dengan 403/404.
     */
    public static function handleGuard(string $reason): void
    {
        $uri  = rawurldecode((string) ($_SERVER['REQUEST_URI'] ?? ''));
        $path = self::requestPath();
        $probe = (bool) preg_match(self::PROBE_PATTERN, $uri);

        if ($reason === 'notfound') {
            // Berkas aset yang hilang (mis. cache browser masih memakai build lama) bukan serangan.
            $harmless = (bool) preg_match('~^/(assets/|favicon|apple-touch-icon|robots\.txt|sitemap|manifest|\.well-known/)~i', $path);
            if (!$harmless) {
                self::record($probe ? 'scanner_probe' : 'direct_access');
            }
            self::deny(404);
        }

        $known = ['forbidden', 'sensitive_path', 'database_file', 'hidden_file', 'bad_user_agent', 'bad_method'];
        $reason = in_array($reason, $known, true) ? $reason : 'forbidden';
        self::record($probe && $reason !== 'bad_user_agent' ? 'scanner_probe' : 'blocked_request', [
            'detail' => ['reason' => $reason],
        ]);
        self::deny(403);
    }

    // ─── Bantuan ───────────────────────────────────────────────────────────

    public static function requestPath(): string
    {
        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $p = strpos($uri, '?');
        return $p === false ? $uri : substr($uri, 0, $p);
    }

    /** a***@domain.org — cukup untuk mengenali pola tanpa menyimpan email lengkap. */
    public static function maskIdentifier(string $id): string
    {
        $id = strtolower(trim($id));
        if (str_contains($id, '@')) {
            [$u, $d] = explode('@', $id, 2);
            return mb_substr($u, 0, 1) . '***@' . $d;
        }
        return mb_substr($id, 0, 3) . '***';
    }

    private static function botFamily(): string
    {
        $ua = strtolower((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
        foreach (['googlebot', 'bingbot', 'yandex', 'baiduspider', 'duckduckbot', 'applebot', 'ahrefsbot',
                  'semrushbot', 'mj12bot', 'gptbot', 'claudebot', 'ccbot', 'facebookexternalhit', 'petalbot'] as $b) {
            if (str_contains($ua, $b)) return $b;
        }
        return $ua === '' ? 'kosong' : 'lainnya';
    }

    private static function geo(string $ip): ?array
    {
        if (!array_key_exists($ip, self::$geoCache)) {
            try {
                self::$geoCache[$ip] = (new GeoLite2Service())->lookup($ip);
            } catch (\Throwable $e) {
                self::$geoCache[$ip] = null;
            }
        }
        return self::$geoCache[$ip];
    }

    private static function deny(int $code): void
    {
        http_response_code($code);
        header('Content-Type: text/html; charset=utf-8');
        header('X-Robots-Tag: noindex');
        $title = $code === 403 ? '403 – Akses Ditolak' : '404 – Halaman Tidak Ditemukan';
        $text  = $code === 403
            ? 'Anda tidak memiliki izin untuk mengakses alamat ini.'
            : 'Alamat yang Anda buka tidak tersedia.';
        echo '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<title>' . $title . '</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#0f172a}'
            . 'main{text-align:center;padding:2rem}h1{font-size:1.5rem}a{color:#ea580c}</style></head><body><main>'
            . '<h1>' . $title . '</h1><p>' . $text . '</p><p><a href="/">Kembali ke beranda</a></p></main></body></html>';
        exit;
    }
}
