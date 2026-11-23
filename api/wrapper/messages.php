<?php
declare(strict_types=1);

/**
 * @file api/wrapper/messages.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Pesan langsung antarpengguna. Semua aksi wajib login dan hanya untuk peserta percakapan.
 *
 * GET  ?action=conversations                      daftar percakapan milik pengguna
 * GET  ?action=list&conversation_id=N             pesan dalam percakapan (menandai sudah dibaca)
 * POST { action:"send", conversation_id, message_text }
 * POST { action:"start", recipient: email|ORCID, message_text }  → percakapan langsung baru
 *      (atau memakai percakapan langsung yang sudah ada dengan orang yang sama)
 * POST { action:"archive", conversation_id }      sembunyikan dari daftar (hanya untuk diri sendiri)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\UserAuth;
use Sciecola\Community\CommunitySchema;
use Sciecola\Database\Db;

const MSG_MAX = 4000;

function dm_respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function dm_is_participant(PDO $pdo, int $conversationId, int $uid): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?');
    $stmt->execute([$conversationId, $uid]);
    return (bool) $stmt->fetchColumn();
}

function dm_send(PDO $pdo, int $conversationId, int $uid, string $text): int
{
    $now = gmdate('Y-m-d H:i:s');
    $pdo->prepare('INSERT INTO messages (conversation_id, sender_id, message_text, created_at) VALUES (?, ?, ?, ?)')
        ->execute([$conversationId, $uid, $text, $now]);
    $id = (int) $pdo->lastInsertId();
    $pdo->prepare('UPDATE conversations SET last_message_at = ?, is_archived = 0 WHERE id = ?')->execute([$now, $conversationId]);
    $pdo->prepare('UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?')
        ->execute([$now, $conversationId, $uid]);
    return $id;
}

try {
    $pdo = Db::pdo();
    if (!$pdo) {
        dm_respond(['status' => 'error', 'message' => 'Database tidak dapat dihubungi', 'conversations' => []], 503);
    }
    $user = UserAuth::requireUser();
    $uid  = (int) $user['id'];
    CommunitySchema::ensure($pdo);
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if ($method === 'GET') {
        $action = (string) ($_GET['action'] ?? 'conversations');

        if ($action === 'list') {
            $cid = (int) ($_GET['conversation_id'] ?? 0);
            if (!dm_is_participant($pdo, $cid, $uid)) {
                dm_respond(['status' => 'error', 'message' => 'Anda bukan peserta percakapan ini'], 403);
            }
            $limit = min(200, max(1, (int) ($_GET['limit'] ?? 100)));
            $stmt = $pdo->prepare(
                "SELECT m.id, m.sender_id, m.message_text, m.created_at, u.name AS sender_name
                   FROM messages m LEFT JOIN user_accounts u ON u.id = m.sender_id
                  WHERE m.conversation_id = ? AND m.deleted_at IS NULL
                  ORDER BY m.id DESC LIMIT $limit"
            );
            $stmt->execute([$cid]);
            $rows = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            $pdo->prepare('UPDATE conversation_participants SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?')
                ->execute([gmdate('Y-m-d H:i:s'), $cid, $uid]);
            dm_respond(['status' => 'success', 'conversation_id' => $cid, 'messages' => array_map(static fn ($r) => [
                'id'           => (int) $r['id'],
                'sender_id'    => (int) $r['sender_id'],
                'sender_name'  => $r['sender_name'] ?: '—',
                'is_mine'      => (int) $r['sender_id'] === $uid,
                'message_text' => $r['message_text'],
                'created_at'   => $r['created_at'],
            ], $rows)]);
        }

        // Daftar percakapan: nama lawan bicara, pesan terakhir, jumlah belum dibaca.
        $stmt = $pdo->prepare(
            "SELECT c.id, c.conversation_type, c.name, c.last_message_at, c.created_at, me.last_read_at
               FROM conversations c
               JOIN conversation_participants me ON me.conversation_id = c.id AND me.user_id = ?
              WHERE c.is_archived = 0
              ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
              LIMIT 100"
        );
        $stmt->execute([$uid]);
        $convs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $others = $pdo->prepare(
            'SELECT u.id, u.name, u.orcid FROM conversation_participants p JOIN user_accounts u ON u.id = p.user_id
              WHERE p.conversation_id = ? AND p.user_id <> ?'
        );
        $last = $pdo->prepare('SELECT message_text, sender_id, created_at FROM messages WHERE conversation_id = ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 1');
        $unread = $pdo->prepare('SELECT COUNT(*) FROM messages WHERE conversation_id = ? AND sender_id <> ? AND deleted_at IS NULL AND (? IS NULL OR created_at > ?)');
        $out = [];
        foreach ($convs as $c) {
            $others->execute([(int) $c['id'], $uid]);
            $people = $others->fetchAll(PDO::FETCH_ASSOC);
            $last->execute([(int) $c['id']]);
            $lm = $last->fetch(PDO::FETCH_ASSOC) ?: null;
            $unread->execute([(int) $c['id'], $uid, $c['last_read_at'], $c['last_read_at']]);
            $out[] = [
                'id'              => (int) $c['id'],
                'type'            => $c['conversation_type'],
                'name'            => $c['name'] ?: implode(', ', array_map(static fn ($p) => $p['name'] ?: '—', $people)),
                'participants'    => array_map(static fn ($p) => ['id' => (int) $p['id'], 'name' => $p['name'], 'orcid' => $p['orcid']], $people),
                'last_message'    => $lm ? mb_substr((string) $lm['message_text'], 0, 120) : null,
                'last_message_at' => $c['last_message_at'],
                'unread'          => (int) $unread->fetchColumn(),
            ];
        }
        dm_respond(['status' => 'success', 'conversations' => $out]);
    }

    if ($method !== 'POST') {
        dm_respond(['status' => 'error', 'message' => 'Method not allowed'], 405);
    }

    $input  = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($input['action'] ?? '');
    $text   = trim((string) ($input['message_text'] ?? ''));

    if ($action === 'send') {
        $cid = (int) ($input['conversation_id'] ?? 0);
        if (!dm_is_participant($pdo, $cid, $uid)) dm_respond(['status' => 'error', 'message' => 'Anda bukan peserta percakapan ini'], 403);
        if ($text === '' || mb_strlen($text) > MSG_MAX) dm_respond(['status' => 'error', 'message' => 'Pesan kosong atau terlalu panjang'], 400);
        dm_respond(['status' => 'success', 'message_id' => dm_send($pdo, $cid, $uid, $text)], 201);
    }

    if ($action === 'start') {
        $recipient = trim((string) ($input['recipient'] ?? ''));
        if ($text === '' || mb_strlen($text) > MSG_MAX) dm_respond(['status' => 'error', 'message' => 'Tulis pesan pertama Anda'], 400);
        $find = preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $recipient)
            ? $pdo->prepare('SELECT id, is_active FROM user_accounts WHERE orcid = ?')
            : $pdo->prepare('SELECT id, is_active FROM user_accounts WHERE LOWER(email) = ?');
        $find->execute([preg_match('/@/', $recipient) ? strtolower($recipient) : strtoupper($recipient)]);
        $to = $find->fetch(PDO::FETCH_ASSOC);
        if (!$to || (int) $to['is_active'] !== 1) dm_respond(['status' => 'error', 'message' => 'Pengguna dengan email/ORCID tersebut tidak ditemukan'], 404);
        $toId = (int) $to['id'];
        if ($toId === $uid) dm_respond(['status' => 'error', 'message' => 'Tidak bisa mengirim pesan ke diri sendiri'], 400);

        // Pakai percakapan langsung yang sudah ada bila ada.
        $ex = $pdo->prepare(
            "SELECT c.id FROM conversations c
               JOIN conversation_participants a ON a.conversation_id = c.id AND a.user_id = ?
               JOIN conversation_participants b ON b.conversation_id = c.id AND b.user_id = ?
              WHERE c.conversation_type = 'direct' LIMIT 1"
        );
        $ex->execute([$uid, $toId]);
        $cid = (int) ($ex->fetchColumn() ?: 0);
        if ($cid === 0) {
            $pdo->beginTransaction();
            $pdo->prepare("INSERT INTO conversations (conversation_type, created_by, created_at) VALUES ('direct', ?, ?)")
                ->execute([$uid, gmdate('Y-m-d H:i:s')]);
            $cid = (int) $pdo->lastInsertId();
            $p = $pdo->prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)');
            $p->execute([$cid, $uid]);
            $p->execute([$cid, $toId]);
            $pdo->commit();
        }
        dm_send($pdo, $cid, $uid, $text);
        dm_respond(['status' => 'success', 'conversation_id' => $cid], 201);
    }

    if ($action === 'archive') {
        $cid = (int) ($input['conversation_id'] ?? 0);
        if (!dm_is_participant($pdo, $cid, $uid)) dm_respond(['status' => 'error', 'message' => 'Anda bukan peserta percakapan ini'], 403);
        // Keluar dari percakapan (percakapan tetap ada bagi peserta lain).
        $pdo->prepare('DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?')->execute([$cid, $uid]);
        dm_respond(['status' => 'success']);
    }

    dm_respond(['status' => 'error', 'message' => 'Aksi tidak dikenali'], 400);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('[messages] ' . $e->getMessage());
    dm_respond(['status' => 'error', 'message' => 'Pesan belum dapat dimuat.', 'conversations' => []], 503);
}
