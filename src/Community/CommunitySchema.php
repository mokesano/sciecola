<?php

declare(strict_types=1);

namespace Sciecola\Community;

use PDO;

/**
 * @file src/Community/CommunitySchema.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Tabel Pesan dan Feed (dibuat otomatis bila belum ada).
 *
 * conversations, conversation_participants, messages      → api/wrapper/messages.php
 * feed_posts, feed_post_likes, feed_post_comments         → api/wrapper/feeds.php
 * Semua ID pengguna merujuk ke user_accounts.id. Kompatibel dengan tabel yang dibuat dari
 * db/schema_social_features.sql (visibilitas "internal" = hanya pengguna terdaftar).
 */
final class CommunitySchema
{
    private static bool $ready = false;

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) {
            return;
        }
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.community_schema_v1';
        if ($driver === 'mysql' && is_file($marker)) {
            self::$ready = true;
            return;
        }
        $ai   = $driver === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY';
        $uint = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
        $big  = $driver === 'sqlite' ? 'INTEGER' : 'BIGINT UNSIGNED';
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';

        $tables = [
            "CREATE TABLE IF NOT EXISTS conversations (
                id {$ai},
                conversation_type VARCHAR(10) NOT NULL DEFAULT 'direct',
                name VARCHAR(255) NULL,
                created_by {$uint} NOT NULL,
                is_archived TINYINT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_message_at TIMESTAMP NULL
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS conversation_participants (
                conversation_id {$big} NOT NULL,
                user_id {$uint} NOT NULL,
                last_read_at TIMESTAMP NULL,
                joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (conversation_id, user_id)
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS messages (
                id {$ai},
                conversation_id {$big} NOT NULL,
                sender_id {$uint} NOT NULL,
                message_text TEXT NOT NULL,
                message_type VARCHAR(20) NOT NULL DEFAULT 'text',
                file_url VARCHAR(512) NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'sent',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                edited_at TIMESTAMP NULL,
                deleted_at TIMESTAMP NULL
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS feed_posts (
                id {$ai},
                author_id {$uint} NOT NULL,
                post_type VARCHAR(20) NOT NULL DEFAULT 'text',
                title VARCHAR(255) NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(512) NULL,
                visibility VARCHAR(20) NOT NULL DEFAULT 'public',
                likes_count {$uint} NOT NULL DEFAULT 0,
                comments_count {$uint} NOT NULL DEFAULT 0,
                is_pinned TINYINT NOT NULL DEFAULT 0,
                is_deleted TINYINT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS feed_post_likes (
                post_id {$big} NOT NULL,
                user_id {$uint} NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (post_id, user_id)
            ){$tail}",
            "CREATE TABLE IF NOT EXISTS feed_post_comments (
                id {$ai},
                post_id {$big} NOT NULL,
                author_id {$uint} NOT NULL,
                parent_comment_id {$big} NULL,
                comment_text TEXT NOT NULL,
                likes_count {$uint} NOT NULL DEFAULT 0,
                is_deleted TINYINT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ){$tail}",
        ];
        foreach ($tables as $sql) {
            $pdo->exec($sql);
        }
        // Bila tabel sudah dibuat sebelumnya dari db/schema_social_features.sql, kolom
        // berikut belum ada di sana: tambahkan tanpa mengubah kolom lain.
        self::addColumn($pdo, $driver, 'conversations', 'last_message_at', 'TIMESTAMP NULL');
        self::addColumn($pdo, $driver, 'conversation_participants', 'last_read_at', 'TIMESTAMP NULL');
        foreach ([
            ['messages', 'idx_messages_conv', 'conversation_id, created_at'],
            ['conversation_participants', 'idx_cp_user', 'user_id'],
            ['feed_posts', 'idx_feed_created', 'is_deleted, created_at'],
            ['feed_post_comments', 'idx_fpc_post', 'post_id'],
        ] as [$t, $n, $c]) {
            try {
                $pdo->exec($driver === 'sqlite' ? "CREATE INDEX IF NOT EXISTS {$n} ON {$t} ({$c})" : "CREATE INDEX {$n} ON {$t} ({$c})");
            } catch (\Throwable $e) {
                // sudah ada
            }
        }
        if ($driver === 'mysql') {
            @file_put_contents($marker, date('c'));
        }
        self::$ready = true;
    }

    private static function addColumn(PDO $pdo, string $driver, string $table, string $column, string $definition): void
    {
        try {
            if ($driver === 'sqlite') {
                $cols = array_column($pdo->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC), 'name');
                $exists = in_array($column, $cols, true);
            } else {
                $stmt = $pdo->prepare("SHOW COLUMNS FROM {$table} LIKE ?");
                $stmt->execute([$column]);
                $exists = (bool) $stmt->fetch();
            }
            if (!$exists) {
                $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
            }
        } catch (\Throwable $e) {
            error_log('[CommunitySchema] ' . $table . '.' . $column . ': ' . $e->getMessage());
        }
    }
}
