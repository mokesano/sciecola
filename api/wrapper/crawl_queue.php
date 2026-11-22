<?php
declare(strict_types=1);

/**
 * @file api/wrapper/crawl_queue.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Antrean crawl ORCID/DOI untuk halaman Admin → Crawl Queue.
 *
 * Dipanggil lewat front controller: /api/crawl_queue.php → api/wrapper/crawl_queue.php
 *
 *   GET  /api/crawl_queue.php?action=status
 *   GET  /api/crawl_queue.php?action=list[&status=pending]
 *   POST /api/crawl_queue.php { "action": "enqueue", "type": "orcid"|"doi", "identifier": "..." }
 *   POST /api/crawl_queue.php { "action": "process" }
 *   POST /api/crawl_queue.php { "action": "clear_finished" }
 *
 * Wajib header X-Admin-Token (= ADMIN_TOOL_TOKEN di .env).
 *
 * Alur "process": mesin SDG lokal (api/sdgs/SDG_Classification_API.php) dijalankan
 * di proses yang sama untuk ORCID (init → batch per 3 karya) atau DOI, lalu setiap
 * hasilnya langsung disimpan ke database lewat CacheMigrator::migrateData().
 * Pekerjaan ORCID yang panjang dilanjutkan pada panggilan berikutnya (progress disimpan).
 * Antrean disimpan di ROOT/cache/crawl_queue.json (src/Sdg/CrawlQueue.php; diabaikan oleh migrasi cache).
 */

ob_start();

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__, 2));
}
if (!defined('DB_DATABASE')) {
    require_once ROOT_PATH . '/config/config.php';
}
if (!class_exists(\Sciecola\Cache\CacheMigrator::class)) {
    require_once ROOT_PATH . '/includes/autoload.php';
}

use Sciecola\Cache\CacheMigrator;
use Sciecola\Sdg\CrawlQueue;
use Sciecola\Sdg\SdgEngine;

const CQ_BATCH_LIMIT  = 3;     // karya per langkah batch ORCID
const CQ_TIME_BUDGET  = 20.0;  // detik per permintaan "process"
const CQ_MAX_ATTEMPTS = 3;

function cq_respond(array $payload, int $code = 200): void
{
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ── Autentikasi admin ────────────────────────────────────────────────────────
$expected = (string) (getenv('ADMIN_TOOL_TOKEN') ?: ($_ENV['ADMIN_TOOL_TOKEN'] ?? ''));
if ($expected === '') {
    cq_respond(['status' => 'error', 'code' => 'TOKEN_NOT_CONFIGURED',
        'message' => 'ADMIN_TOOL_TOKEN belum diatur di file .env server. Antrean crawl dinonaktifkan.'], 503);
}
$given = (string) ($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
if ($given === '' || !hash_equals($expected, $given)) {
    cq_respond(['status' => 'error', 'code' => 'UNAUTHORIZED', 'message' => 'Token admin tidak valid.'], 401);
}

// ── Input ────────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body   = [];
if ($method === 'POST') {
    $body = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = $_POST;
    }
}
$action = (string) ($body['action'] ?? $_GET['action'] ?? 'status');

if (in_array($action, ['enqueue', 'process', 'clear_finished'], true) && $method !== 'POST') {
    cq_respond(['status' => 'error', 'message' => "Aksi '{$action}' harus memakai POST."], 405);
}

// ── Penyimpanan antrean ──────────────────────────────────────────────────────

function cq_read(): array
{
    return CrawlQueue::read();
}

function cq_write(array $queue): void
{
    CrawlQueue::write($queue);
}

function cq_counts(array $queue): array
{
    $c = ['total' => count($queue), 'pending' => 0, 'running' => 0, 'completed' => 0, 'failed' => 0];
    foreach ($queue as $job) {
        $s = $job['status'] ?? 'pending';
        if (isset($c[$s])) {
            $c[$s]++;
        }
    }
    return $c;
}

// ── Mesin SDG & database ─────────────────────────────────────────────────────

function cq_pdo(): PDO
{
    $driver = defined('DB_DRIVER') ? DB_DRIVER : 'mysql';
    $dsn = $driver === 'pgsql'
        ? sprintf('pgsql:host=%s;port=%s;dbname=%s', DB_HOST, DB_PORT, DB_DATABASE)
        : sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_DATABASE);
    return new PDO($dsn, DB_USERNAME, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

function cq_add_result(array &$job, array $migrated, bool $countPublications = true): void
{
    $job['result'] = $job['result'] ?? ['publications' => 0, 'sdg_rows' => 0, 'researchers' => 0];
    $keys = $countPublications ? ['publications', 'sdg_rows', 'researchers'] : ['sdg_rows', 'researchers'];
    foreach ($keys as $k) {
        $job['result'][$k] += (int) ($migrated['records'][$k] ?? 0);
    }
    if ($migrated['status'] === 'failed') {
        throw new RuntimeException('Gagal menyimpan ke database: ' . $migrated['message']);
    }
}

/**
 * Memajukan satu pekerjaan selama waktu masih tersedia.
 * @return bool true bila pekerjaan selesai (completed/failed)
 */
function cq_advance(array &$job, CacheMigrator $migrator, float $deadline): bool
{
    $id = (string) $job['identifier'];

    if ($job['type'] === 'doi') {
        $res = SdgEngine::doi($id);
        cq_add_result($job, $migrator->migrateData($res, 'crawl:doi:' . $id));
        $job['status'] = 'completed';
        return true;
    }

    // ORCID: init sekali, lalu batch bertahap
    if (!isset($job['progress']['total'])) {
        $init = SdgEngine::orcidInit($id);
        // Daftar awal (stub) tidak dihitung: karya yang sama dihitung saat batch berSDG-nya tersimpan.
        cq_add_result($job, $migrator->migrateData($init, 'crawl:orcid_init:' . $id), false);
        $job['progress'] = ['offset' => 0, 'total' => (int) ($init['total_works'] ?? 0)];
    }

    while ($job['progress']['offset'] < $job['progress']['total']) {
        if (microtime(true) > $deadline) {
            return false; // lanjutkan di panggilan berikutnya
        }
        $offset = (int) $job['progress']['offset'];
        $batch  = SdgEngine::orcidBatch($id, $offset, CQ_BATCH_LIMIT);
        cq_add_result($job, $migrator->migrateData($batch, "crawl:orcid_batch:{$id}:{$offset}"));
        $next = (int) ($batch['next_offset'] ?? ($offset + CQ_BATCH_LIMIT));
        $job['progress']['offset'] = max($next, $offset + 1);
        $job['updated_at'] = date('c');
        if (!empty($batch['is_done'])) {
            break;
        }
    }

    $job['progress']['offset'] = $job['progress']['total'];
    $job['status'] = 'completed';
    return true;
}

// ── Aksi ─────────────────────────────────────────────────────────────────────
switch ($action) {

    case 'status':
        cq_respond(['status' => 'success'] + cq_counts(cq_read()));

    case 'list':
        $queue  = cq_read();
        $filter = (string) ($_GET['status'] ?? '');
        if ($filter !== '') {
            $queue = array_values(array_filter($queue, static fn ($j) => ($j['status'] ?? '') === $filter));
        }
        cq_respond(['status' => 'success', 'total' => count($queue), 'jobs' => array_slice($queue, 0, 100)]);

    case 'enqueue':
        $raw  = trim((string) ($body['identifier'] ?? ''));
        $type = (string) ($body['type'] ?? '');
        if ($type === '') {
            $type = preg_match('/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i', $raw) ? 'orcid' : 'doi';
        }
        if ($type === 'orcid') {
            if (!preg_match('/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i', $raw, $m)) {
                cq_respond(['status' => 'error', 'message' => 'Format ORCID tidak valid (XXXX-XXXX-XXXX-XXXX).'], 400);
            }
            $identifier = strtoupper($m[1]);
        } elseif ($type === 'doi') {
            $identifier = CacheMigrator::normalizeDoi($raw);
            if ($identifier === '') {
                cq_respond(['status' => 'error', 'message' => 'Format DOI tidak valid (harus diawali 10.).'], 400);
            }
        } else {
            cq_respond(['status' => 'error', 'message' => "Tipe '{$type}' tidak didukung. Gunakan orcid atau doi."], 400);
        }

        $r = CrawlQueue::enqueue($type, $identifier, (int) ($body['priority'] ?? 5));
        cq_respond([
            'status'    => 'success',
            'duplicate' => $r['duplicate'],
            'job_id'    => $r['job_id'],
            'message'   => $r['duplicate']
                ? "{$identifier} sudah ada di antrean."
                : strtoupper($type) . " {$identifier} ditambahkan ke antrean.",
        ]);

    case 'process':
        @set_time_limit(120);
        $deadline = microtime(true) + CQ_TIME_BUDGET;
        try {
            $pdo = cq_pdo();
            $migrator = new CacheMigrator($pdo, ROOT_PATH . '/cache');
            SdgEngine::load();
        } catch (Throwable $e) {
            cq_respond(['status' => 'error', 'message' => 'Tidak bisa memulai proses: ' . $e->getMessage()], 503);
        }

        $queue   = cq_read();
        $touched = [];
        foreach ($queue as $i => &$job) {
            if (!in_array($job['status'] ?? '', ['pending', 'running'], true)) {
                continue;
            }
            if (microtime(true) > $deadline) {
                break;
            }
            $job['status']     = 'running';
            $job['updated_at'] = date('c');
            cq_write($queue);

            try {
                cq_advance($job, $migrator, $deadline);
                $job['error'] = null;
            } catch (Throwable $e) {
                $job['attempts'] = (int) ($job['attempts'] ?? 0) + 1;
                $job['error']    = mb_substr($e->getMessage(), 0, 300);
                $job['status']   = $job['attempts'] >= CQ_MAX_ATTEMPTS ? 'failed' : 'pending';
            }
            $job['updated_at'] = date('c');
            cq_write($queue);
            $touched[] = [
                'id'         => $job['id'],
                'identifier' => $job['identifier'],
                'status'     => $job['status'],
                'progress'   => $job['progress'],
                'result'     => $job['result'],
                'error'      => $job['error'],
            ];
        }
        unset($job);

        $counts    = cq_counts($queue);
        $remaining = $counts['pending'] + $counts['running'];
        $done      = count(array_filter($touched, static fn ($t) => $t['status'] === 'completed'));
        cq_respond([
            'status'    => 'success',
            'message'   => sprintf('%d pekerjaan diproses, %d selesai. Sisa %d di antrean.', count($touched), $done, $remaining),
            'jobs'      => $touched,
            'remaining' => $remaining,
            'done'      => $remaining === 0,
        ] + $counts);

    case 'clear_finished':
        $queue = cq_read();
        $keep  = array_values(array_filter($queue, static fn ($j) => !in_array($j['status'] ?? '', ['completed', 'failed'], true)));
        cq_write($keep);
        cq_respond(['status' => 'success', 'removed' => count($queue) - count($keep),
            'message' => (count($queue) - count($keep)) . ' pekerjaan selesai/gagal dihapus dari daftar.']);

    default:
        cq_respond(['status' => 'error', 'message' => "Aksi tidak dikenal: {$action}"], 400);
}
