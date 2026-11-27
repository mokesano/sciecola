<?php
declare(strict_types=1);

/**
 * @file api/wrapper/projects.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Manajemen Proyek Bersama (research_projects + anggota + tonggak).
 *
 * GET  ?action=list[&status=active|planning|completed|paused|cancelled][&search=][&mine=1]
 * GET  ?action=get&id=12          detail + anggota + tonggak + publikasi
 * GET  ?action=stats
 * POST { action: create, title, description, status, sdg_focus[], budget, start_date, end_date, visibility }
 * POST { action: update, id, …kolom yang diubah }          (pemimpin proyek)
 * POST { action: delete, id }                              (pemimpin proyek)
 * POST { action: add_member, project_id, orcid, role }     (pemimpin proyek)
 * POST { action: remove_member, project_id, orcid }        (pemimpin proyek, atau anggota itu sendiri)
 * POST { action: add_milestone, project_id, title, target_date, description }   (pemimpin/anggota)
 * POST { action: milestone_status, id, status }            (pemimpin/anggota)
 * POST { action: delete_milestone, id }                    (pemimpin proyek)
 *
 * Proyek "private" hanya terlihat oleh pemimpin dan anggotanya. PUT tidak dipakai karena
 * diblokir .htaccess; semua perubahan lewat POST + action.
 */

use Sciecola\Auth\UserAuth;
use Sciecola\Community\Notifications;
use Sciecola\Database\Db;
use Sciecola\Support\ResearcherRecord;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

const PRJ_STATUSES = ['planning', 'active', 'completed', 'paused', 'cancelled'];
const PRJ_VISIBILITY = ['public', 'private', 'restricted'];
const PRJ_MILESTONE_STATUSES = ['planned', 'in-progress', 'completed', 'overdue'];

function prj_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function prj_fail(string $message, int $code = 400): void
{
    prj_out(['status' => 'error', 'message' => $message], $code);
}

function prj_sdgs($v): array
{
    $v = is_array($v) ? $v : (json_decode((string) $v, true) ?: []);
    $out = [];
    foreach ($v as $n) {
        $n = (int) $n;
        if ($n >= 1 && $n <= 17) $out[$n] = $n;
    }
    return array_values($out);
}

function prj_date($v): ?string
{
    $v = trim((string) $v);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
}

function prj_money($v): ?float
{
    if ($v === null || $v === '') return null;
    $f = (float) $v;
    return $f >= 0 ? round($f, 2) : null;
}

try {
    $pdo = Db::pdo();
    if (!$pdo) prj_fail('Database tidak dapat dihubungi', 503);

    $me      = UserAuth::current();
    $myOrcid = strtoupper((string) ($me['orcid'] ?? ''));
    $method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';
        if ($action === 'get') prj_out(prj_get($pdo, (int) ($_GET['id'] ?? 0), $myOrcid));
        if ($action === 'stats') prj_out(prj_stats($pdo, $myOrcid));
        prj_out(prj_list($pdo, $myOrcid));
    }

    if ($method !== 'POST') prj_fail('Method not allowed', 405);

    // Semua perubahan: akun login dengan ORCID, dari situs sendiri.
    $orcid = UserAuth::requireOrcid();
    $me    = UserAuth::current();
    $in    = json_decode((string) file_get_contents('php://input'), true) ?: [];

    switch ((string) ($in['action'] ?? 'create')) {
        case 'create':           prj_out(prj_create($pdo, $in, $orcid, (string) ($me['name'] ?? '')), 201);
        case 'update':           prj_out(prj_update($pdo, $in, $orcid));
        case 'delete':           prj_out(prj_delete($pdo, (int) ($in['id'] ?? 0), $orcid));
        case 'add_member':       prj_out(prj_add_member($pdo, $in, $orcid, $me));
        case 'remove_member':    prj_out(prj_remove_member($pdo, $in, $orcid));
        case 'add_milestone':    prj_out(prj_add_milestone($pdo, $in, $orcid), 201);
        case 'milestone_status': prj_out(prj_milestone_status($pdo, $in, $orcid));
        case 'delete_milestone': prj_out(prj_delete_milestone($pdo, (int) ($in['id'] ?? 0), $orcid));
        default:                 prj_fail('Aksi tidak dikenal');
    }
} catch (\Throwable $e) {
    error_log('[projects] ' . $e->getMessage());
    prj_fail('Terjadi kesalahan saat memproses proyek', 500);
}

// ─── Akses ──────────────────────────────────────────────────────────────────

/** Kondisi SQL: proyek yang boleh dilihat pengguna ini. */
function prj_visible_sql(string $myOrcid, array &$params): string
{
    if ($myOrcid === '') {
        return "rp.visibility = 'public'";
    }
    $params[] = $myOrcid;
    $params[] = $myOrcid;
    return "(rp.visibility = 'public' OR rp.lead_orcid = ? OR EXISTS (SELECT 1 FROM project_members m2 WHERE m2.project_id = rp.id AND m2.orcid = ?))";
}

/** @return array{project: array, role: string}|null  role: lead | member | viewer */
function prj_access(PDO $pdo, int $id, string $myOrcid): ?array
{
    $st = $pdo->prepare('SELECT * FROM research_projects WHERE id = ?');
    $st->execute([$id]);
    $p = $st->fetch(PDO::FETCH_ASSOC);
    if (!$p) return null;
    $role = 'viewer';
    if ($myOrcid !== '' && strtoupper((string) $p['lead_orcid']) === $myOrcid) {
        $role = 'lead';
    } elseif ($myOrcid !== '') {
        $m = $pdo->prepare('SELECT 1 FROM project_members WHERE project_id = ? AND orcid = ?');
        $m->execute([$id, $myOrcid]);
        if ($m->fetchColumn()) $role = 'member';
    }
    if ($p['visibility'] !== 'public' && $role === 'viewer') return null;
    return ['project' => $p, 'role' => $role];
}

function prj_require(PDO $pdo, int $id, string $orcid, array $roles): array
{
    $a = prj_access($pdo, $id, $orcid);
    if (!$a) prj_fail('Proyek tidak ditemukan', 404);
    if (!in_array($a['role'], $roles, true)) prj_fail('Hanya pemimpin proyek yang dapat melakukan ini', 403);
    return $a;
}

function prj_touch(PDO $pdo, int $id): void
{
    $pdo->prepare('UPDATE research_projects SET updated_at = ? WHERE id = ?')->execute([date('Y-m-d H:i:s'), $id]);
}

// ─── Baca ───────────────────────────────────────────────────────────────────

function prj_row(array $r, string $myOrcid): array
{
    return [
        'id'            => (int) $r['id'],
        'title'         => $r['title'],
        'description'   => (string) ($r['description'] ?? ''),
        'status'        => $r['status'],
        'progress'      => (int) $r['progress'],
        'start_date'    => $r['start_date'],
        'end_date'      => $r['end_date'],
        'sdg_focus'     => prj_sdgs($r['sdg_focus'] ?? '[]'),
        'budget'        => $r['budget'] !== null ? (float) $r['budget'] : null,
        'spent'         => $r['spent'] !== null ? (float) $r['spent'] : null,
        'visibility'    => $r['visibility'],
        'lead_orcid'    => $r['lead_orcid'],
        'lead_name'     => $r['lead_name'] ?? null,
        'institution'   => $r['institution'] ?? null,
        'collaborators' => (int) ($r['team_size'] ?? 0),
        'publications'  => (int) ($r['publication_count'] ?? 0),
        'milestones_total' => (int) ($r['ms_total'] ?? 0),
        'milestones_done'  => (int) ($r['ms_done'] ?? 0),
        'updated_at'    => $r['updated_at'],
        'can_edit'      => $myOrcid !== '' && strtoupper((string) $r['lead_orcid']) === $myOrcid,
        'is_member'     => !empty($r['is_member']),
    ];
}

function prj_list(PDO $pdo, string $myOrcid): array
{
    $params = [];
    $where  = [prj_visible_sql($myOrcid, $params)];
    $status = (string) ($_GET['status'] ?? 'all');
    if (in_array($status, PRJ_STATUSES, true)) {
        $where[] = 'rp.status = ?';
        $params[] = $status;
    }
    $search = trim((string) ($_GET['search'] ?? ''));
    if ($search !== '') {
        $where[] = '(rp.title LIKE ? OR rp.description LIKE ?)';
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }
    if (!empty($_GET['mine']) && $myOrcid !== '') {
        $where[] = '(rp.lead_orcid = ? OR EXISTS (SELECT 1 FROM project_members m3 WHERE m3.project_id = rp.id AND m3.orcid = ?))';
        $params[] = $myOrcid;
        $params[] = $myOrcid;
    }
    $memberExpr = $myOrcid !== ''
        ? '(SELECT COUNT(*) FROM project_members mm WHERE mm.project_id = rp.id AND mm.orcid = ' . $pdo->quote($myOrcid) . ')'
        : '0';

    $sql = "SELECT rp.*, r.name AS lead_name, i.name AS institution,
                   (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = rp.id) AS team_size,
                   (SELECT COUNT(*) FROM project_publications pp WHERE pp.project_id = rp.id) AS publication_count,
                   (SELECT COUNT(*) FROM project_milestones ms WHERE ms.project_id = rp.id) AS ms_total,
                   (SELECT COUNT(*) FROM project_milestones ms WHERE ms.project_id = rp.id AND ms.status = 'completed') AS ms_done,
                   {$memberExpr} AS is_member
              FROM research_projects rp
              LEFT JOIN researchers r ON r.orcid = rp.lead_orcid
              LEFT JOIN institutions i ON i.id = rp.institution_id
             WHERE " . implode(' AND ', $where) . '
             ORDER BY rp.updated_at DESC
             LIMIT 200';
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);

    // Beberapa anggota pertama per proyek (untuk avatar di kartu).
    $members = [];
    if ($rows) {
        $ids = array_map(static fn ($r) => (int) $r['id'], $rows);
        $q = $pdo->query('SELECT pm.project_id, pm.orcid, pm.role, r.name
                            FROM project_members pm LEFT JOIN researchers r ON r.orcid = pm.orcid
                           WHERE pm.project_id IN (' . implode(',', $ids) . ')
                           ORDER BY pm.joined_at');
        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $m) {
            $pid = (int) $m['project_id'];
            if (count($members[$pid] ?? []) < 5) {
                $members[$pid][] = ['orcid' => $m['orcid'], 'name' => $m['name'] ?: $m['orcid'], 'role' => $m['role']];
            }
        }
    }

    $projects = array_map(static function ($r) use ($myOrcid, $members) {
        $p = prj_row($r, $myOrcid);
        $p['members'] = $members[$p['id']] ?? [];
        return $p;
    }, $rows);

    return ['status' => 'success', 'projects' => $projects, 'total' => count($projects), 'signed_in' => $myOrcid !== ''];
}

function prj_get(PDO $pdo, int $id, string $myOrcid): array
{
    $a = prj_access($pdo, $id, $myOrcid);
    if (!$a) prj_fail('Proyek tidak ditemukan', 404);

    $st = $pdo->prepare("SELECT rp.*, r.name AS lead_name, i.name AS institution,
                                (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = rp.id) AS team_size,
                                (SELECT COUNT(*) FROM project_publications pp WHERE pp.project_id = rp.id) AS publication_count
                           FROM research_projects rp
                           LEFT JOIN researchers r ON r.orcid = rp.lead_orcid
                           LEFT JOIN institutions i ON i.id = rp.institution_id
                          WHERE rp.id = ?");
    $st->execute([$id]);
    $project = prj_row($st->fetch(PDO::FETCH_ASSOC), $myOrcid);
    $project['my_role'] = $a['role'];

    $m = $pdo->prepare('SELECT pm.orcid, pm.role, pm.joined_at, r.name FROM project_members pm
                          LEFT JOIN researchers r ON r.orcid = pm.orcid WHERE pm.project_id = ? ORDER BY pm.joined_at');
    $m->execute([$id]);
    $project['members'] = array_map(static fn ($x) => [
        'orcid' => $x['orcid'], 'name' => $x['name'] ?: $x['orcid'], 'role' => $x['role'], 'joined_at' => $x['joined_at'],
        'is_me' => $myOrcid !== '' && strtoupper((string) $x['orcid']) === $myOrcid,
    ], $m->fetchAll(PDO::FETCH_ASSOC));

    $ms = $pdo->prepare('SELECT id, title, description, target_date, completion_date, status FROM project_milestones
                          WHERE project_id = ? ORDER BY target_date, id');
    $ms->execute([$id]);
    $today = date('Y-m-d');
    $project['milestones'] = array_map(static function ($x) use ($today) {
        $status = $x['status'];
        if ($status !== 'completed' && $x['target_date'] && $x['target_date'] < $today) $status = 'overdue';
        return ['id' => (int) $x['id'], 'title' => $x['title'], 'description' => $x['description'],
                'target_date' => $x['target_date'], 'completion_date' => $x['completion_date'], 'status' => $status];
    }, $ms->fetchAll(PDO::FETCH_ASSOC));

    try {
        $pp = $pdo->prepare('SELECT pp.doi, p.title, p.publication_year FROM project_publications pp
                               LEFT JOIN publications p ON p.doi = pp.doi WHERE pp.project_id = ? ORDER BY pp.added_at DESC');
        $pp->execute([$id]);
        $project['publication_list'] = $pp->fetchAll(PDO::FETCH_ASSOC);
    } catch (\Throwable $e) {
        $project['publication_list'] = [];
    }

    return ['status' => 'success', 'project' => $project];
}

function prj_stats(PDO $pdo, string $myOrcid): array
{
    $params = [];
    $vis = prj_visible_sql($myOrcid, $params);
    $st = $pdo->prepare("SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) AS planning,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(budget) AS budget
           FROM research_projects rp WHERE {$vis}");
    $st->execute($params);
    $s = $st->fetch(PDO::FETCH_ASSOC) ?: [];
    return ['status' => 'success', 'data' => [
        'total' => (int) ($s['total'] ?? 0), 'active' => (int) ($s['active'] ?? 0),
        'planning' => (int) ($s['planning'] ?? 0), 'completed' => (int) ($s['completed'] ?? 0),
        'totalBudget' => (float) ($s['budget'] ?? 0),
    ]];
}

// ─── Tulis ──────────────────────────────────────────────────────────────────

function prj_create(PDO $pdo, array $in, string $orcid, string $name): array
{
    $title = trim((string) ($in['title'] ?? ''));
    if (mb_strlen($title) < 5 || mb_strlen($title) > 255) prj_fail('Judul proyek 5–255 karakter');
    $start = prj_date($in['start_date'] ?? '');
    $end   = prj_date($in['end_date'] ?? '');
    if ($start && $end && $end < $start) prj_fail('Tanggal selesai tidak boleh sebelum tanggal mulai');

    // Batasi pembuatan proyek: 10 per hari per akun.
    $c = $pdo->prepare('SELECT COUNT(*) FROM research_projects WHERE lead_orcid = ? AND created_at >= ?');
    $c->execute([$orcid, date('Y-m-d H:i:s', time() - 86400)]);
    if ((int) $c->fetchColumn() >= 10) prj_fail('Batas pembuatan proyek hari ini tercapai', 429);

    if (!ResearcherRecord::ensure($pdo, $orcid, $name)) prj_fail('ORCID Anda belum dapat dipakai sebagai pemimpin proyek', 409);

    $status = in_array($in['status'] ?? '', PRJ_STATUSES, true) ? $in['status'] : 'planning';
    $vis    = in_array($in['visibility'] ?? '', PRJ_VISIBILITY, true) ? $in['visibility'] : 'public';
    $now    = date('Y-m-d H:i:s');
    $pdo->prepare('INSERT INTO research_projects
                     (title, description, status, lead_orcid, sdg_focus, budget, spent, progress, start_date, end_date, visibility, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)')
        ->execute([$title, mb_substr(trim((string) ($in['description'] ?? '')), 0, 20000) ?: null, $status, $orcid,
                   json_encode(prj_sdgs($in['sdg_focus'] ?? [])), prj_money($in['budget'] ?? null), $start, $end, $vis, $now, $now]);
    return ['status' => 'success', 'project_id' => (int) $pdo->lastInsertId()];
}

function prj_update(PDO $pdo, array $in, string $orcid): array
{
    $id = (int) ($in['id'] ?? 0);
    prj_require($pdo, $id, $orcid, ['lead']);
    $set = [];
    $params = [];
    if (array_key_exists('title', $in)) {
        $t = trim((string) $in['title']);
        if (mb_strlen($t) < 5 || mb_strlen($t) > 255) prj_fail('Judul proyek 5–255 karakter');
        $set[] = 'title = ?'; $params[] = $t;
    }
    if (array_key_exists('description', $in)) { $set[] = 'description = ?'; $params[] = mb_substr(trim((string) $in['description']), 0, 20000) ?: null; }
    if (array_key_exists('status', $in)) {
        if (!in_array($in['status'], PRJ_STATUSES, true)) prj_fail('Status tidak valid');
        $set[] = 'status = ?'; $params[] = $in['status'];
    }
    if (array_key_exists('progress', $in)) { $set[] = 'progress = ?'; $params[] = max(0, min(100, (int) $in['progress'])); }
    if (array_key_exists('budget', $in))   { $set[] = 'budget = ?';   $params[] = prj_money($in['budget']); }
    if (array_key_exists('spent', $in))    { $set[] = 'spent = ?';    $params[] = prj_money($in['spent']) ?? 0; }
    if (array_key_exists('start_date', $in)) { $set[] = 'start_date = ?'; $params[] = prj_date($in['start_date']); }
    if (array_key_exists('end_date', $in))   { $set[] = 'end_date = ?';   $params[] = prj_date($in['end_date']); }
    if (array_key_exists('sdg_focus', $in))  { $set[] = 'sdg_focus = ?';  $params[] = json_encode(prj_sdgs($in['sdg_focus'])); }
    if (array_key_exists('visibility', $in)) {
        if (!in_array($in['visibility'], PRJ_VISIBILITY, true)) prj_fail('Visibilitas tidak valid');
        $set[] = 'visibility = ?'; $params[] = $in['visibility'];
    }
    if (!$set) prj_fail('Tidak ada perubahan');
    $set[] = 'updated_at = ?';
    $params[] = date('Y-m-d H:i:s');
    $params[] = $id;
    $pdo->prepare('UPDATE research_projects SET ' . implode(', ', $set) . ' WHERE id = ?')->execute($params);
    return ['status' => 'success'];
}

function prj_delete(PDO $pdo, int $id, string $orcid): array
{
    prj_require($pdo, $id, $orcid, ['lead']);
    // Hapus turunan secara eksplisit (tidak semua instalasi punya FK ON DELETE CASCADE).
    foreach (['project_members', 'project_milestones', 'project_publications'] as $t) {
        try { $pdo->prepare("DELETE FROM {$t} WHERE project_id = ?")->execute([$id]); } catch (\Throwable $e) { /* tabel belum ada */ }
    }
    $pdo->prepare('DELETE FROM research_projects WHERE id = ?')->execute([$id]);
    return ['status' => 'success'];
}

function prj_add_member(PDO $pdo, array $in, string $orcid, ?array $me): array
{
    $id = (int) ($in['project_id'] ?? 0);
    $a  = prj_require($pdo, $id, $orcid, ['lead']);
    $target = strtoupper(trim((string) ($in['orcid'] ?? '')));
    if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $target)) prj_fail('Format ORCID tidak valid (0000-0000-0000-0000)');
    if ($target === $orcid) prj_fail('Anda sudah menjadi pemimpin proyek ini');
    $role = mb_substr(trim((string) ($in['role'] ?? '')) ?: 'Anggota', 0, 100);

    // Anggota harus sudah dikenal Sciecola: ada di tabel researchers atau punya akun.
    $known = $pdo->prepare('SELECT name FROM researchers WHERE orcid = ?');
    $known->execute([$target]);
    $name = $known->fetchColumn();
    $account = ResearcherRecord::accountFor($pdo, $target);
    if ($name === false) {
        if (!$account) prj_fail('Peneliti dengan ORCID ini belum terdaftar di Sciecola', 404);
        ResearcherRecord::ensure($pdo, $target, (string) $account['name']);
    }
    $dup = $pdo->prepare('SELECT 1 FROM project_members WHERE project_id = ? AND orcid = ?');
    $dup->execute([$id, $target]);
    if ($dup->fetchColumn()) prj_fail('Peneliti ini sudah menjadi anggota', 409);

    $pdo->prepare('INSERT INTO project_members (project_id, orcid, role, joined_at) VALUES (?, ?, ?, ?)')
        ->execute([$id, $target, $role, date('Y-m-d H:i:s')]);
    prj_touch($pdo, $id);

    if ($account) {
        Notifications::notify($pdo, (int) $account['id'], 'collaboration',
            'Anda ditambahkan ke proyek "' . mb_substr((string) $a['project']['title'], 0, 120) . '"',
            'Peran: ' . $role, '/projects?project=' . $id, isset($me['id']) ? (int) $me['id'] : null);
    }
    return ['status' => 'success'];
}

function prj_remove_member(PDO $pdo, array $in, string $orcid): array
{
    $id = (int) ($in['project_id'] ?? 0);
    $target = strtoupper(trim((string) ($in['orcid'] ?? '')));
    $a = prj_access($pdo, $id, $orcid);
    if (!$a) prj_fail('Proyek tidak ditemukan', 404);
    if ($a['role'] !== 'lead' && $target !== $orcid) prj_fail('Hanya pemimpin proyek yang dapat mengeluarkan anggota', 403);
    $pdo->prepare('DELETE FROM project_members WHERE project_id = ? AND orcid = ?')->execute([$id, $target]);
    prj_touch($pdo, $id);
    return ['status' => 'success'];
}

function prj_add_milestone(PDO $pdo, array $in, string $orcid): array
{
    $id = (int) ($in['project_id'] ?? 0);
    prj_require($pdo, $id, $orcid, ['lead', 'member']);
    $title = trim((string) ($in['title'] ?? ''));
    $date  = prj_date($in['target_date'] ?? '');
    if ($title === '' || mb_strlen($title) > 255) prj_fail('Judul tonggak wajib diisi (maks. 255 karakter)');
    if (!$date) prj_fail('Tanggal target wajib diisi');
    $now = date('Y-m-d H:i:s');
    $pdo->prepare('INSERT INTO project_milestones (project_id, title, description, target_date, status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$id, $title, mb_substr(trim((string) ($in['description'] ?? '')), 0, 2000) ?: null, $date, 'planned', $now, $now]);
    prj_touch($pdo, $id);
    return ['status' => 'success', 'milestone_id' => (int) $pdo->lastInsertId()];
}

function prj_milestone_project(PDO $pdo, int $milestoneId): int
{
    $st = $pdo->prepare('SELECT project_id FROM project_milestones WHERE id = ?');
    $st->execute([$milestoneId]);
    $pid = $st->fetchColumn();
    if ($pid === false) prj_fail('Tonggak tidak ditemukan', 404);
    return (int) $pid;
}

function prj_milestone_status(PDO $pdo, array $in, string $orcid): array
{
    $mid = (int) ($in['id'] ?? 0);
    $pid = prj_milestone_project($pdo, $mid);
    prj_require($pdo, $pid, $orcid, ['lead', 'member']);
    $status = in_array($in['status'] ?? '', PRJ_MILESTONE_STATUSES, true) ? $in['status'] : 'planned';
    $pdo->prepare('UPDATE project_milestones SET status = ?, completion_date = ?, updated_at = ? WHERE id = ?')
        ->execute([$status, $status === 'completed' ? date('Y-m-d') : null, date('Y-m-d H:i:s'), $mid]);
    prj_touch($pdo, $pid);
    return ['status' => 'success'];
}

function prj_delete_milestone(PDO $pdo, int $mid, string $orcid): array
{
    $pid = prj_milestone_project($pdo, $mid);
    prj_require($pdo, $pid, $orcid, ['lead']);
    $pdo->prepare('DELETE FROM project_milestones WHERE id = ?')->execute([$mid]);
    prj_touch($pdo, $pid);
    return ['status' => 'success'];
}
