<?php
declare(strict_types=1);

/**
 * @file api/wrapper/feeds.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Feed komunitas: kiriman, suka, dan komentar antarpengguna.
 *
 * GET  ?action=list&limit=20&offset=0      kiriman yang boleh dilihat pengunjung ini
 * GET  ?action=get&id=N                     satu kiriman + komentar
 * POST { action:"create", content, title?, visibility: public|registered }   (login)
 *      "registered" disimpan sebagai "internal".
 * POST { action:"like", post_id }           (login) — suka/batal suka
 * POST { action:"comment", post_id, comment_text }                          (login)
 * POST { action:"delete", post_id }         (penulis atau admin)
 * POST { action:"delete_comment", comment_id } (penulis komentar atau admin)
 *
 * Pengunjung hanya melihat kiriman "public"; pengguna yang login juga melihat "registered".
 * ID penulis selalu diambil dari sesi. Versi sebelumnya memakai user_id dari permintaan,
 * kolom u.avatar_url yang tidak ada, dan hitungan suka yang tidak pernah bertambah.
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

const FEED_MAX_CONTENT = 5000;
const FEED_MAX_COMMENT = 2000;

function feed_respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function feed_visibilities(?array $user): array
{
    // "internal" = hanya pengguna terdaftar (nilai ENUM di db/schema_social_features.sql).
    return $user ? ['public', 'internal'] : ['public'];
}

function feed_post_row(array $r, ?array $user): array
{
    $uid = $user ? (int) $user['id'] : 0;
    return [
        'id'             => (int) $r['id'],
        'author_id'      => (int) $r['author_id'],
        'author_name'    => $r['author_name'] ?: '—',
        'author_orcid'   => $r['author_orcid'] ?: null,
        'title'          => $r['title'],
        'content'        => $r['content'],
        'visibility'     => $r['visibility'] === 'internal' ? 'registered' : $r['visibility'],
        'likes_count'    => (int) $r['likes_count'],
        'comments_count' => (int) $r['comments_count'],
        'liked_by_me'    => !empty($r['liked_by_me']),
        'is_pinned'      => (bool) $r['is_pinned'],
        'created_at'     => $r['created_at'],
        'can_delete'     => $user !== null && ((int) $r['author_id'] === $uid || UserAuth::isAdmin($user)),
    ];
}

try {
    $pdo = Db::pdo();
    if (!$pdo) {
        feed_respond(['status' => 'error', 'message' => 'Database tidak dapat dihubungi', 'posts' => []], 503);
    }
    CommunitySchema::ensure($pdo);
    $user   = UserAuth::current();
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if ($method === 'GET') {
        $vis = feed_visibilities($user);
        $in  = implode(',', array_fill(0, count($vis), '?'));
        $uid = $user ? (int) $user['id'] : 0;
        $action = (string) ($_GET['action'] ?? 'list');

        if ($action === 'get') {
            $stmt = $pdo->prepare(
                "SELECT fp.*, u.name AS author_name, u.orcid AS author_orcid,
                        (SELECT 1 FROM feed_post_likes l WHERE l.post_id = fp.id AND l.user_id = ?) AS liked_by_me
                   FROM feed_posts fp LEFT JOIN user_accounts u ON u.id = fp.author_id
                  WHERE fp.id = ? AND fp.is_deleted = 0 AND fp.visibility IN ($in)"
            );
            $stmt->execute(array_merge([$uid, (int) ($_GET['id'] ?? 0)], $vis));
            $post = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$post) feed_respond(['status' => 'error', 'message' => 'Kiriman tidak ditemukan'], 404);
            $c = $pdo->prepare(
                'SELECT c.id, c.author_id, c.comment_text, c.created_at, u.name AS author_name
                   FROM feed_post_comments c LEFT JOIN user_accounts u ON u.id = c.author_id
                  WHERE c.post_id = ? AND c.is_deleted = 0 ORDER BY c.created_at ASC LIMIT 200'
            );
            $c->execute([(int) $post['id']]);
            $comments = array_map(static fn ($r) => [
                'id' => (int) $r['id'], 'author_id' => (int) $r['author_id'], 'author_name' => $r['author_name'] ?: '—',
                'comment_text' => $r['comment_text'], 'created_at' => $r['created_at'],
                'can_delete' => $user !== null && ((int) $r['author_id'] === $uid || UserAuth::isAdmin($user)),
            ], $c->fetchAll(PDO::FETCH_ASSOC));
            feed_respond(['status' => 'success', 'post' => feed_post_row($post, $user), 'comments' => $comments]);
        }

        $limit  = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));
        $stmt = $pdo->prepare(
            "SELECT fp.id, fp.author_id, fp.title, fp.content, fp.visibility, fp.likes_count, fp.comments_count,
                    fp.is_pinned, fp.created_at, u.name AS author_name, u.orcid AS author_orcid,
                    (SELECT 1 FROM feed_post_likes l WHERE l.post_id = fp.id AND l.user_id = ?) AS liked_by_me
               FROM feed_posts fp LEFT JOIN user_accounts u ON u.id = fp.author_id
              WHERE fp.is_deleted = 0 AND fp.visibility IN ($in)
              ORDER BY fp.is_pinned DESC, fp.created_at DESC
              LIMIT $limit OFFSET $offset"
        );
        $stmt->execute(array_merge([$uid], $vis));
        $count = $pdo->prepare("SELECT COUNT(*) FROM feed_posts WHERE is_deleted = 0 AND visibility IN ($in)");
        $count->execute($vis);
        feed_respond([
            'status' => 'success',
            'posts'  => array_map(static fn ($r) => feed_post_row($r, $user), $stmt->fetchAll(PDO::FETCH_ASSOC)),
            'total'  => (int) $count->fetchColumn(),
        ]);
    }

    if ($method !== 'POST') {
        feed_respond(['status' => 'error', 'message' => 'Method not allowed'], 405);
    }

    $user  = UserAuth::requireUser();
    $uid   = (int) $user['id'];
    $input = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($input['action'] ?? '');
    $now = gmdate('Y-m-d H:i:s');

    switch ($action) {
        case 'create':
            $content = trim((string) ($input['content'] ?? ''));
            $title   = trim((string) ($input['title'] ?? ''));
            $vis     = in_array($input['visibility'] ?? 'public', ['registered', 'internal'], true) ? 'internal' : 'public';
            if ($content === '') feed_respond(['status' => 'error', 'message' => 'Isi kiriman tidak boleh kosong'], 400);
            if (mb_strlen($content) > FEED_MAX_CONTENT) feed_respond(['status' => 'error', 'message' => 'Kiriman maksimal ' . FEED_MAX_CONTENT . ' karakter'], 400);
            $pdo->prepare('INSERT INTO feed_posts (author_id, title, content, visibility, created_at) VALUES (?, ?, ?, ?, ?)')
                ->execute([$uid, $title !== '' ? mb_substr($title, 0, 255) : null, $content, $vis, $now]);
            feed_respond(['status' => 'success', 'post_id' => (int) $pdo->lastInsertId()], 201);

        case 'like':
            $postId = (int) ($input['post_id'] ?? 0);
            $exists = $pdo->prepare('SELECT 1 FROM feed_posts WHERE id = ? AND is_deleted = 0');
            $exists->execute([$postId]);
            if (!$exists->fetchColumn()) feed_respond(['status' => 'error', 'message' => 'Kiriman tidak ditemukan'], 404);
            $liked = $pdo->prepare('SELECT 1 FROM feed_post_likes WHERE post_id = ? AND user_id = ?');
            $liked->execute([$postId, $uid]);
            if ($liked->fetchColumn()) {
                $pdo->prepare('DELETE FROM feed_post_likes WHERE post_id = ? AND user_id = ?')->execute([$postId, $uid]);
                $nowLiked = false;
            } else {
                $pdo->prepare('INSERT INTO feed_post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)')->execute([$postId, $uid, $now]);
                $nowLiked = true;
            }
            // Hitungan dihitung ulang dari tabel suka agar selalu konsisten.
            $pdo->prepare('UPDATE feed_posts SET likes_count = (SELECT COUNT(*) FROM feed_post_likes WHERE post_id = ?) WHERE id = ?')
                ->execute([$postId, $postId]);
            $cnt = $pdo->prepare('SELECT likes_count FROM feed_posts WHERE id = ?');
            $cnt->execute([$postId]);
            feed_respond(['status' => 'success', 'liked' => $nowLiked, 'likes_count' => (int) $cnt->fetchColumn()]);

        case 'comment':
            $postId = (int) ($input['post_id'] ?? 0);
            $text   = trim((string) ($input['comment_text'] ?? ''));
            if ($text === '' || mb_strlen($text) > FEED_MAX_COMMENT) feed_respond(['status' => 'error', 'message' => 'Komentar kosong atau terlalu panjang'], 400);
            $exists = $pdo->prepare('SELECT 1 FROM feed_posts WHERE id = ? AND is_deleted = 0');
            $exists->execute([$postId]);
            if (!$exists->fetchColumn()) feed_respond(['status' => 'error', 'message' => 'Kiriman tidak ditemukan'], 404);
            $pdo->prepare('INSERT INTO feed_post_comments (post_id, author_id, comment_text, created_at) VALUES (?, ?, ?, ?)')
                ->execute([$postId, $uid, $text, $now]);
            $id = (int) $pdo->lastInsertId();
            $pdo->prepare('UPDATE feed_posts SET comments_count = (SELECT COUNT(*) FROM feed_post_comments WHERE post_id = ? AND is_deleted = 0) WHERE id = ?')
                ->execute([$postId, $postId]);
            feed_respond(['status' => 'success', 'comment_id' => $id], 201);

        case 'delete':
            $postId = (int) ($input['post_id'] ?? 0);
            $own = $pdo->prepare('SELECT author_id FROM feed_posts WHERE id = ? AND is_deleted = 0');
            $own->execute([$postId]);
            $author = $own->fetchColumn();
            if ($author === false) feed_respond(['status' => 'error', 'message' => 'Kiriman tidak ditemukan'], 404);
            if ((int) $author !== $uid && !UserAuth::isAdmin($user)) feed_respond(['status' => 'error', 'message' => 'Bukan kiriman Anda'], 403);
            $pdo->prepare('UPDATE feed_posts SET is_deleted = 1, updated_at = ? WHERE id = ?')->execute([$now, $postId]);
            if ((int) $author !== $uid) {
                \Sciecola\Support\AppSettings::audit($user, 'feed.delete_post', 'post #' . $postId);
            }
            feed_respond(['status' => 'success']);

        case 'delete_comment':
            $cid = (int) ($input['comment_id'] ?? 0);
            $own = $pdo->prepare('SELECT author_id, post_id FROM feed_post_comments WHERE id = ? AND is_deleted = 0');
            $own->execute([$cid]);
            $row = $own->fetch(PDO::FETCH_ASSOC);
            if (!$row) feed_respond(['status' => 'error', 'message' => 'Komentar tidak ditemukan'], 404);
            if ((int) $row['author_id'] !== $uid && !UserAuth::isAdmin($user)) feed_respond(['status' => 'error', 'message' => 'Bukan komentar Anda'], 403);
            $pdo->prepare('UPDATE feed_post_comments SET is_deleted = 1 WHERE id = ?')->execute([$cid]);
            $pdo->prepare('UPDATE feed_posts SET comments_count = (SELECT COUNT(*) FROM feed_post_comments WHERE post_id = ? AND is_deleted = 0) WHERE id = ?')
                ->execute([(int) $row['post_id'], (int) $row['post_id']]);
            feed_respond(['status' => 'success']);

        default:
            feed_respond(['status' => 'error', 'message' => 'Aksi tidak dikenali'], 400);
    }
} catch (Throwable $e) {
    error_log('[feeds] ' . $e->getMessage());
    feed_respond(['status' => 'error', 'message' => 'Feed belum dapat dimuat.', 'posts' => []], 503);
}
