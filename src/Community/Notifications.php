<?php

declare(strict_types=1);

namespace Sciecola\Community;

use PDO;

/**
 * @file src/Community/Notifications.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Notifikasi pengguna (tabel user_notifications, dibuat otomatis).
 *
 * Penerima dirujuk dengan user_accounts.id sehingga akun tanpa ORCID juga menerima
 * notifikasi. Notifikasi dibuat oleh peristiwa nyata di aplikasi:
 *  - pesan langsung baru            (api/wrapper/messages.php)
 *  - komentar / suka pada kiriman   (api/wrapper/feeds.php)
 *  - permintaan kolaborasi          (api/wrapper/collaboration.php)
 * Waktu disimpan dalam UTC.
 */
final class Notifications
{
    private static bool $ready = false;

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) {
            return;
        }
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.notifications_schema_v1';
        if ($driver === 'mysql' && is_file($marker)) {
            self::$ready = true;
            return;
        }
        $ai   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $uint = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $pdo->exec("CREATE TABLE IF NOT EXISTS user_notifications (
            id {$ai},
            user_id {$uint} NOT NULL,
            type VARCHAR(30) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NULL,
            link VARCHAR(512) NULL,
            actor_user_id {$uint} NULL,
            ref_key VARCHAR(100) NULL,
            is_read TINYINT NOT NULL DEFAULT 0,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ){$tail}");
        try {
            $pdo->exec($driver === 'sqlite'
                ? 'CREATE INDEX IF NOT EXISTS idx_un_user ON user_notifications (user_id, is_read, created_at)'
                : 'CREATE INDEX idx_un_user ON user_notifications (user_id, is_read, created_at)');
        } catch (\Throwable $e) {
            // sudah ada
        }
        if ($driver === 'mysql') {
            @file_put_contents($marker, date('c'));
        }
        self::$ready = true;
    }

    /**
     * Buat notifikasi. Tidak pernah melempar exception (kegagalan dicatat ke log) agar
     * aksi utama (kirim pesan, komentar, dll.) tetap berhasil.
     *
     * Dengan $refKey, notifikasi yang belum dibaca dengan kunci yang sama diperbarui
     * (mis. beberapa pesan dalam satu percakapan menjadi satu notifikasi).
     */
    public static function notify(
        PDO $pdo,
        int $userId,
        string $type,
        string $title,
        ?string $message = null,
        ?string $link = null,
        ?int $actorUserId = null,
        ?string $refKey = null
    ): void {
        if ($userId <= 0 || ($actorUserId !== null && $actorUserId === $userId)) {
            return;
        }
        try {
            self::ensure($pdo);
            $now = gmdate('Y-m-d H:i:s');
            $title = mb_substr($title, 0, 255);
            $message = $message !== null ? mb_substr($message, 0, 500) : null;
            if ($refKey !== null) {
                $st = $pdo->prepare('SELECT id FROM user_notifications WHERE user_id = ? AND ref_key = ? AND is_read = 0 ORDER BY id DESC LIMIT 1');
                $st->execute([$userId, $refKey]);
                $existing = $st->fetchColumn();
                if ($existing !== false) {
                    $pdo->prepare('UPDATE user_notifications SET title = ?, message = ?, link = ?, actor_user_id = ?, created_at = ? WHERE id = ?')
                        ->execute([$title, $message, $link, $actorUserId, $now, (int) $existing]);
                    return;
                }
            }
            $pdo->prepare(
                'INSERT INTO user_notifications (user_id, type, title, message, link, actor_user_id, ref_key, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([$userId, $type, $title, $message, $link, $actorUserId, $refKey, $now]);
        } catch (\Throwable $e) {
            error_log('[Notifications] ' . $e->getMessage());
        }
    }

    /** user_accounts.id untuk sebuah ORCID (null bila belum ada akun yang menautkannya). */
    public static function userIdForOrcid(PDO $pdo, string $orcid): ?int
    {
        try {
            $st = $pdo->prepare('SELECT id FROM user_accounts WHERE orcid = ? AND is_active = 1');
            $st->execute([strtoupper($orcid)]);
            $id = $st->fetchColumn();
            return $id === false ? null : (int) $id;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public static function displayName(PDO $pdo, int $userId): string
    {
        try {
            $st = $pdo->prepare('SELECT name, email FROM user_accounts WHERE id = ?');
            $st->execute([$userId]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            if ($r) {
                $name = trim((string) $r['name']);
                return $name !== '' ? $name : (string) strstr((string) $r['email'], '@', true);
            }
        } catch (\Throwable $e) {
            // abaikan
        }
        return 'Pengguna';
    }
}
