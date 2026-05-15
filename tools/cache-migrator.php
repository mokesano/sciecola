<?php
// =============================================================
// WIZDAM CACHE MIGRATOR: WEB BATCH MODE
// Memindahkan file cache JSON dari /cache/ ke database terpusat
// =============================================================
// Akses: https://yourdomain.com/tools/cache-migrator.php
// Wajib login sebagai admin sebelum bisa menjalankan.
// =============================================================

define('BATCH_SIZE', 50);

if (!defined('ROOT_PATH')) {
    define('ROOT_PATH', dirname(__DIR__));
}

// Bootstrap: config + db connection
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Database\Connection;

// ─── Auth: hanya admin yang boleh akses ──────────────────────
session_start();

function check_admin_auth(): bool {
    // Cek session PHP
    if (!empty($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin') {
        return true;
    }
    // Cek token dari header (untuk cPanel file manager access)
    $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    $envToken = defined('ADMIN_TOOL_TOKEN') ? ADMIN_TOOL_TOKEN : getenv('ADMIN_TOOL_TOKEN');
    if ($envToken && hash_equals($envToken, $token)) {
        return true;
    }
    return false;
}

if (!check_admin_auth()) {
    http_response_code(403);
    die('<h1>403 Forbidden</h1><p>Login sebagai admin terlebih dahulu, atau set header X-Admin-Token.</p>');
}

// ─── Konstanta direktori cache ────────────────────────────────
define('CACHE_DIR', ROOT_PATH . '/cache');

// =============================================================
// BACKEND AJAX WORKER
// =============================================================
if (isset($_GET['action'])) {
    if (ob_get_length()) ob_clean();
    header('Content-Type: application/json; charset=utf-8');

    $action = $_GET['action'];

    try {
        $db = Connection::getInstance();

        // ── SCAN: hitung total file cache ─────────────────────
        if ($action === 'scan') {
            $stats = count_cache_files();
            echo json_encode(['status' => 'ok', 'stats' => $stats]);
            exit;
        }

        // ── RUN: proses satu batch ────────────────────────────
        if ($action === 'run') {
            $type   = $_GET['type']   ?? 'orcid';
            $offset = (int)($_GET['offset'] ?? 0);
            $result = process_batch($db, $type, $offset);
            echo json_encode($result);
            exit;
        }

        echo json_encode(['status' => 'error', 'message' => 'Unknown action']);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

// =============================================================
// FUNGSI PROSESOR BATCH
// =============================================================

function count_cache_files(): array {
    if (!is_dir(CACHE_DIR)) return ['orcid' => 0, 'doi' => 0, 'session' => 0, 'other' => 0];

    $orcid = $doi = $session = $other = 0;
    foreach (glob(CACHE_DIR . '/*.json') ?: [] as $f) {
        $base = basename($f);
        if (str_starts_with($base, 'orcid_'))            $orcid++;
        elseif (str_starts_with($base, 'doi_'))          $doi++;
        elseif (str_starts_with($base, 'session_'))      $session++;
        else                                              $other++;
    }
    // Session sub-folder
    foreach (glob(CACHE_DIR . '/sessions/*.json') ?: [] as $f) {
        $session++;
    }

    return compact('orcid', 'doi', 'session', 'other');
}

function process_batch(Connection $db, string $type, int $offset): array {
    $logs       = [];
    $processed  = 0;
    $skipped    = 0;

    $files = get_cache_files($type);
    $slice = array_slice($files, $offset, BATCH_SIZE);

    if (empty($slice)) {
        return ['status' => 'done', 'next_offset' => $offset, 'logs' => [], 'processed' => 0, 'skipped' => 0];
    }

    foreach ($slice as $file) {
        $raw = @file_get_contents($file);
        if (!$raw) {
            $logs[] = log_line('skip', basename($file), 'File kosong atau tidak terbaca');
            $skipped++;
            continue;
        }

        $data = json_decode($raw, true);
        if (!$data) {
            $logs[] = log_line('skip', basename($file), 'JSON tidak valid');
            $skipped++;
            continue;
        }

        $ok = match ($type) {
            'orcid'   => migrate_orcid($db, $file, $data),
            'doi'     => migrate_doi($db, $file, $data),
            'session' => migrate_session($db, $file, $data),
            default   => false,
        };

        if ($ok) {
            $logs[] = log_line('ok', basename($file), $ok);
            $processed++;
        } else {
            $logs[] = log_line('skip', basename($file), 'Dilewati (sudah ada atau tidak valid)');
            $skipped++;
        }
    }

    $isDone      = count($slice) < BATCH_SIZE;
    $nextOffset  = $offset + BATCH_SIZE;

    return [
        'status'      => $isDone ? 'done' : 'continue',
        'next_offset' => $nextOffset,
        'processed'   => $processed,
        'skipped'     => $skipped,
        'logs'        => $logs,
    ];
}

function get_cache_files(string $type): array {
    if (!is_dir(CACHE_DIR)) return [];

    return match ($type) {
        'orcid'   => glob(CACHE_DIR . '/orcid_*.json')    ?: [],
        'doi'     => glob(CACHE_DIR . '/doi_*.json')      ?: [],
        'session' => array_merge(
                        glob(CACHE_DIR . '/session_*.json') ?: [],
                        glob(CACHE_DIR . '/sessions/*.json') ?: []
                     ),
        default   => [],
    };
}

function migrate_orcid(Connection $db, string $file, array $data): string|false {
    // Ekstrak ORCID ID dari nama file atau dari data
    $orcid = $data['orcid-identifier']['path']
          ?? $data['orcid_id']
          ?? preg_replace('/^orcid_(.+)\.json$/', '$1', basename($file));

    if (!$orcid || !preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
        return false;
    }

    $existing = $db->fetchOne('SELECT id FROM orcid_profiles WHERE orcid_id = ?', [$orcid]);
    if ($existing) return false; // Sudah ada, skip

    $ttl     = defined('CACHE_TTL') ? (int) CACHE_TTL : 86400;
    $expires = date('Y-m-d H:i:s', filemtime($file) + $ttl);

    $db->upsert('orcid_profiles', [
        'orcid_id'     => $orcid,
        'profile_json' => json_encode($data, JSON_UNESCAPED_UNICODE),
        'expires_at'   => $expires,
        'updated_at'   => date('Y-m-d H:i:s', filemtime($file)),
    ], ['orcid_id']);

    return "ORCID {$orcid} → orcid_profiles";
}

function migrate_doi(Connection $db, string $file, array $data): string|false {
    // Ekstrak DOI dari data atau nama file
    $doi = $data['DOI'] ?? $data['doi'] ?? null;
    if (!$doi) {
        // Coba rekonstruksi dari nama file: doi_10.1234_abc.json
        $doi = str_replace(['doi_', '.json', '_'], ['', '', '/'], basename($file));
    }

    if (!$doi || strlen($doi) < 5) return false;

    $existing = $db->fetchOne('SELECT id FROM doi_results WHERE doi = ?', [$doi]);
    if ($existing) return false;

    $ttl     = defined('CACHE_TTL') ? (int) CACHE_TTL : 86400;
    $expires = date('Y-m-d H:i:s', filemtime($file) + $ttl);

    $db->upsert('doi_results', [
        'doi'         => $doi,
        'result_json' => json_encode($data, JSON_UNESCAPED_UNICODE),
        'expires_at'  => $expires,
        'updated_at'  => date('Y-m-d H:i:s', filemtime($file)),
    ], ['doi']);

    return "DOI {$doi} → doi_results";
}

function migrate_session(Connection $db, string $file, array $data): string|false {
    $userId    = $data['user_id'] ?? $data['id'] ?? null;
    $tokenHash = hash('sha256', basename($file, '.json'));
    $expiresAt = $data['expires_at'] ?? date('Y-m-d H:i:s', filemtime($file) + 86400);

    if (!$userId) return false;

    // Pastikan user ada di tabel users
    $user = $db->fetchOne('SELECT id FROM users WHERE id = ?', [(int)$userId]);
    if (!$user) return false;

    $existing = $db->fetchOne('SELECT id FROM user_sessions WHERE token_hash = ?', [$tokenHash]);
    if ($existing) return false;

    if (strtotime($expiresAt) < time()) {
        return false; // Token sudah expired, tidak perlu migrate
    }

    $db->insert('user_sessions', [
        'user_id'    => (int)$userId,
        'token_hash' => $tokenHash,
        'expires_at' => $expiresAt,
        'created_at' => date('Y-m-d H:i:s', filemtime($file)),
    ]);

    return "Session user #{$userId} → user_sessions";
}

function log_line(string $type, string $file, string $msg): string {
    $color = match ($type) {
        'ok'   => '#2ed573',
        'skip' => '#747d8c',
        default => '#ff4757',
    };
    $icon = $type === 'ok' ? '✓' : '⊘';
    return "<span style='color:{$color}'>{$icon} {$file} — {$msg}</span>";
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Wizdam Cache Migrator</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; background: #0f0f0f; color: #ccc; padding: 24px; }
        .wrap { max-width: 960px; margin: 0 auto; }
        h2 { color: #fff; margin-bottom: 6px; }
        p.desc { color: #888; font-size: 13px; margin-bottom: 20px; }
        .card { background: #1e1e1e; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .stat-box { background: #2a2a2a; border: 1px solid #444; border-radius: 6px; padding: 12px 20px; min-width: 140px; }
        .stat-box .num { font-size: 28px; font-weight: bold; color: #fff; }
        .stat-box .lbl { font-size: 11px; color: #888; margin-top: 2px; }
        .btn { display: inline-block; padding: 10px 22px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold; margin-right: 8px; margin-bottom: 8px; }
        .btn-start { background: #e84393; color: #fff; }
        .btn-start:hover { background: #c73379; }
        .btn-start:disabled { background: #555; cursor: not-allowed; }
        .btn-scan  { background: #3498db; color: #fff; }
        .btn-scan:hover { background: #2980b9; }
        .progress-bar { height: 6px; background: #333; border-radius: 3px; overflow: hidden; margin: 12px 0; }
        .progress-fill { height: 100%; background: #e84393; border-radius: 3px; transition: width 0.3s; width: 0%; }
        #status { font-size: 13px; color: #aaa; margin: 8px 0; min-height: 20px; }
        .log-box { height: 380px; overflow-y: auto; background: #000; border: 1px solid #333; padding: 12px; font-size: 12px; line-height: 1.7; border-radius: 6px; }
        .log-box span { display: block; }
        .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 10px; }
        .type-tabs { display: flex; gap: 8px; margin-bottom: 14px; }
        .tab { padding: 6px 14px; border-radius: 4px; border: 1px solid #444; background: #2a2a2a; color: #888; cursor: pointer; font-size: 12px; }
        .tab.active { background: #e84393; border-color: #e84393; color: #fff; }
        .tab:hover:not(.active) { border-color: #666; color: #ccc; }
    </style>
</head>
<body>
<div class="wrap">
    <h2>⚡ Wizdam Cache Migrator</h2>
    <p class="desc">Memindahkan file cache JSON dari <code>/cache/</code> ke database <code>wizdam_ecosystem</code> secara bertahap (<?= BATCH_SIZE ?> file per request).</p>

    <div class="card">
        <div class="section-title">Statistik File Cache</div>
        <div class="stats">
            <div class="stat-box"><div class="num" id="cnt-orcid">—</div><div class="lbl">ORCID Profiles</div></div>
            <div class="stat-box"><div class="num" id="cnt-doi">—</div><div class="lbl">DOI Results</div></div>
            <div class="stat-box"><div class="num" id="cnt-session">—</div><div class="lbl">Sessions</div></div>
            <div class="stat-box"><div class="num" id="cnt-other">—</div><div class="lbl">Lainnya</div></div>
        </div>
        <button class="btn btn-scan" onclick="scanFiles()">🔍 Scan File Cache</button>
    </div>

    <div class="card">
        <div class="section-title">Pilih Tipe Cache</div>
        <div class="type-tabs">
            <div class="tab active" onclick="selectType('orcid', this)">ORCID Profiles</div>
            <div class="tab" onclick="selectType('doi', this)">DOI Results</div>
            <div class="tab" onclick="selectType('session', this)">Sessions</div>
        </div>
        <button class="btn btn-start" id="btnStart" onclick="startMigration()">▶ MULAI MIGRASI</button>
        <div id="status">Tekan Scan terlebih dahulu untuk menghitung file.</div>
        <div class="progress-bar"><div class="progress-fill" id="progress"></div></div>
    </div>

    <div class="card">
        <div class="section-title">Log Proses</div>
        <div class="log-box" id="logs"></div>
    </div>
</div>

<script>
let currentType = 'orcid';
let totalFiles  = { orcid: 0, doi: 0, session: 0 };
let isRunning   = false;

function selectType(type, el) {
    currentType = type;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

function scanFiles() {
    setStatus('Memindai direktori cache...');
    fetch('?action=scan')
        .then(r => r.json())
        .then(d => {
            if (d.status !== 'ok') { setStatus('Scan gagal: ' + (d.message || 'unknown')); return; }
            const s = d.stats;
            totalFiles = { orcid: s.orcid, doi: s.doi, session: s.session };
            document.getElementById('cnt-orcid').textContent   = s.orcid;
            document.getElementById('cnt-doi').textContent     = s.doi;
            document.getElementById('cnt-session').textContent = s.session;
            document.getElementById('cnt-other').textContent   = s.other;
            setStatus(`Scan selesai. Pilih tipe lalu tekan Mulai Migrasi.`);
            appendLog(`<span style='color:#3498db'>🔍 Scan: ${s.orcid} ORCID · ${s.doi} DOI · ${s.session} Session · ${s.other} Lainnya</span>`);
        })
        .catch(e => setStatus('Error: ' + e.message));
}

function startMigration() {
    if (isRunning) return;
    isRunning = true;
    document.getElementById('btnStart').disabled = true;
    appendLog(`<span style='color:#e84393;font-weight:bold'>▶ Mulai migrasi tipe: ${currentType.toUpperCase()}</span>`);
    runBatch(0, 0, 0);
}

function runBatch(offset, totalProcessed, totalSkipped) {
    const total = totalFiles[currentType] || 0;
    const pct   = total > 0 ? Math.min(100, Math.round((offset / total) * 100)) : 0;
    document.getElementById('progress').style.width = pct + '%';
    setStatus(`Memproses file ${offset}–${offset + <?= BATCH_SIZE ?>} dari ±${total}... (${pct}%)`);

    fetch(`?action=run&type=${currentType}&offset=${offset}`)
        .then(r => r.text())
        .then(text => {
            let data;
            try { data = JSON.parse(text); }
            catch(e) { throw new Error('Respons tidak valid: ' + text.substring(0, 200)); }

            if (data.status === 'error') {
                appendLog(`<span style='color:#ff4757'>✗ Error: ${data.message}</span>`);
                finishMigration(totalProcessed, totalSkipped);
                return;
            }

            data.logs.forEach(l => appendLog(l));
            totalProcessed += data.processed || 0;
            totalSkipped   += data.skipped   || 0;

            if (data.status === 'continue') {
                setTimeout(() => runBatch(data.next_offset, totalProcessed, totalSkipped), 400);
            } else {
                finishMigration(totalProcessed, totalSkipped);
            }
        })
        .catch(e => {
            appendLog(`<span style='color:#ff4757'>✗ Connection Error: ${e.message}</span>`);
            finishMigration(totalProcessed, totalSkipped);
        });
}

function finishMigration(processed, skipped) {
    document.getElementById('progress').style.width = '100%';
    setStatus(`✅ Selesai! ${processed} berhasil, ${skipped} dilewati.`);
    appendLog(`<span style='color:#2ed573;font-weight:bold'>✅ Migrasi ${currentType.toUpperCase()} selesai: ${processed} berhasil · ${skipped} dilewati</span>`);
    document.getElementById('btnStart').disabled = false;
    isRunning = false;
}

function setStatus(msg) {
    document.getElementById('status').textContent = msg;
}

function appendLog(html) {
    const box = document.getElementById('logs');
    const el  = document.createElement('span');
    el.innerHTML = html;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
}

// Auto-scan saat halaman load
window.addEventListener('load', scanFiles);
</script>
</body>
</html>
