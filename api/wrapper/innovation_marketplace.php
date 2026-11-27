<?php
declare(strict_types=1);

/**
 * @file api/wrapper/innovation_marketplace.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Pasar Inovasi: peluang kemitraan, lamaran, simpanan, dan pemasangan peluang.
 *
 * GET  ?action=opportunities[&category=][&search=]   peluang terbuka (+ status lamaran/simpanan saya)
 * GET  ?action=categories                            kategori + jumlah peluang terbuka
 * GET  ?action=stats                                 angka ringkasan (dari database)
 * POST ?action=apply   { opportunity_id, application_text, attachment_url? }   (perlu login)
 * POST ?action=save    { opportunity_id, saved: true|false }                   (perlu login)
 * POST ?action=create  { title, description, category, organization, org_type, deadline,
 *                        budget_range, sdg_alignment[], required_skills[] }    (perlu login + ORCID)
 * POST ?action=vote    { opportunity_id, vote: endorse|report|clear, reason?, note? }  (kurasi publik)
 * POST ?action=confirm_payment { opportunity_id, reference }   (pemasang: konfirmasi biaya penayangan)
 *
 * Kurasi: lihat src/Marketplace/OpportunityCuration.php. Publik hanya melihat peluang
 * berstatus kurasi 'review' ("Dalam kurasi") atau 'approved' ("Terverifikasi"); pemasang
 * selalu melihat peluangnya sendiri beserta status kurasi dan biayanya.
 *
 * Tidak ada data contoh: bila tabel kosong, daftar kosong.
 */

use Sciecola\Auth\UserAuth;
use Sciecola\Community\Notifications;
use Sciecola\Database\Db;
use Sciecola\Marketplace\OpportunityCuration;
use Sciecola\Premium\Premium;
use Sciecola\Support\ResearcherRecord;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

const MKT_ORG_TYPES = ['industry', 'government', 'foundation', 'nonprofit'];

function mkt_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function mkt_fail(string $message, int $code = 400): void
{
    mkt_out(['status' => 'error', 'message' => $message], $code);
}

function mkt_list($v, int $max = 20, int $len = 80): array
{
    $v = is_array($v) ? $v : (json_decode((string) $v, true) ?: (is_string($v) ? explode(',', $v) : []));
    $out = [];
    foreach ($v as $x) {
        $x = trim((string) $x);
        if ($x !== '') $out[mb_strtolower($x)] = mb_substr($x, 0, $len);
    }
    return array_slice(array_values($out), 0, $max);
}

function mkt_sdgs($v): array
{
    $out = [];
    foreach ((is_array($v) ? $v : (json_decode((string) $v, true) ?: [])) as $n) {
        $n = (int) $n;
        if ($n >= 1 && $n <= 17) $out[$n] = $n;
    }
    return array_values($out);
}

/** Tabel simpanan peluang per akun (dibuat otomatis). */
function mkt_ensure_saves(PDO $pdo): void
{
    $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
    $uint = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
    $pdo->exec("CREATE TABLE IF NOT EXISTS opportunity_saves (
        user_id {$uint} NOT NULL,
        opportunity_id {$uint} NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, opportunity_id)
    ){$tail}");
}

try {
    $pdo = Db::pdo();
    if (!$pdo) mkt_fail('Database tidak dapat dihubungi', 503);
    OpportunityCuration::ensure($pdo);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $action = (string) ($_GET['action'] ?? 'opportunities');

    if ($method === 'GET') {
        if ($action === 'stats') mkt_out(mkt_stats($pdo));
        if ($action === 'categories') mkt_out(mkt_categories($pdo));
        mkt_out(mkt_opportunities($pdo, UserAuth::current()));
    }
    if ($method !== 'POST') mkt_fail('Method not allowed', 405);

    $in = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($in['action'] ?? $action);
    if ($action === 'apply')  mkt_out(mkt_apply($pdo, $in, UserAuth::requireUser()), 201);
    if ($action === 'save')   mkt_out(mkt_save($pdo, $in, UserAuth::requireUser()));
    if ($action === 'create') {
        UserAuth::requireOrcid();
        mkt_out(mkt_create($pdo, $in, UserAuth::current()), 201);
    }
    if ($action === 'vote')            mkt_out(mkt_vote($pdo, $in, UserAuth::requireUser()));
    if ($action === 'confirm_payment') mkt_out(mkt_confirm_payment($pdo, $in, UserAuth::requireUser()));
    mkt_fail('Aksi tidak dikenal');
} catch (\Throwable $e) {
    error_log('[innovation_marketplace] ' . $e->getMessage());
    mkt_fail('Terjadi kesalahan pada Pasar Inovasi', 500);
}

// ─── Baca ───────────────────────────────────────────────────────────────────

function mkt_has_org_column(PDO $pdo): bool
{
    static $has = null;
    if ($has !== null) return $has;
    try {
        $pdo->query('SELECT organization_id FROM innovation_opportunities LIMIT 0');
        $pdo->query('SELECT id FROM organizations LIMIT 0');
        $has = true;
    } catch (\Throwable $e) {
        $has = false;
    }
    return $has;
}

function mkt_opportunities(PDO $pdo, ?array $me): array
{
    $org = mkt_has_org_column($pdo);
    $myOrcid = strtoupper((string) ($me['orcid'] ?? ''));
    $where = ["io.status = 'open'"];
    $params = [];
    if ($myOrcid !== '') {
        $where[] = "(io.curation_status IN ('review','approved') OR io.posted_by_orcid = ?)";
        $params[] = $myOrcid;
    } else {
        $where[] = "io.curation_status IN ('review','approved')";
    }
    $category = trim((string) ($_GET['category'] ?? 'all'));
    if ($category !== '' && $category !== 'all') {
        $where[] = 'ic.name = ?';
        $params[] = $category;
    }
    $search = trim((string) ($_GET['search'] ?? ''));
    if ($search !== '') {
        $where[] = '(io.title LIKE ? OR io.description LIKE ?)';
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }
    $sql = 'SELECT io.id, io.title, io.description, io.status, io.deadline, io.budget_range,
                   io.sdg_alignment, io.required_skills, io.posted_by_orcid, io.created_at,
                   io.curation_status, io.curation_note, io.curated_at, io.fee_status, io.fee_amount, io.fee_currency,
                   io.fee_reference,
                   ic.name AS category, r.name AS posted_by_name,
                   (SELECT COUNT(*) FROM opportunity_applications oa WHERE oa.opportunity_id = io.id) AS application_count'
         . ($org ? ', org.name AS organization, org.type AS org_type, org.logo_url, org.website' : '')
         . ' FROM innovation_opportunities io
             LEFT JOIN innovation_categories ic ON ic.id = io.category_id
             LEFT JOIN researchers r ON r.orcid = io.posted_by_orcid'
         . ($org ? ' LEFT JOIN organizations org ON org.id = io.organization_id' : '')
         . ' WHERE ' . implode(' AND ', $where) . '
             ORDER BY io.created_at DESC
             LIMIT 200';
    try {
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);
    } catch (\Throwable $e) {
        // Tabel opportunity_applications belum ada (schema_additions.sql belum dijalankan).
        $st = $pdo->prepare(str_replace(
            '(SELECT COUNT(*) FROM opportunity_applications oa WHERE oa.opportunity_id = io.id)', '0', $sql));
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);
    }

    // Status lamaran & simpanan milik pengguna yang login.
    $applied = [];
    $saved = [];
    if ($me) {
        try {
            $a = $pdo->prepare('SELECT opportunity_id, status FROM opportunity_applications WHERE LOWER(applicant_email) = ?');
            $a->execute([strtolower((string) $me['email'])]);
            foreach ($a->fetchAll(PDO::FETCH_ASSOC) as $x) $applied[(int) $x['opportunity_id']] = $x['status'];
        } catch (\Throwable $e) { /* tabel belum ada */ }
        try {
            mkt_ensure_saves($pdo);
            $s = $pdo->prepare('SELECT opportunity_id FROM opportunity_saves WHERE user_id = ?');
            $s->execute([(int) $me['id']]);
            foreach ($s->fetchAll(PDO::FETCH_COLUMN) as $oid) $saved[(int) $oid] = true;
        } catch (\Throwable $e) { /* abaikan */ }
    }

    $counts = OpportunityCuration::counts($pdo, array_column($rows, 'id'));
    // Lencana & peluang unggulan anggota premium (kosong bila layanan premium mati).
    $tiers = Premium::tiersForOrcids($pdo, array_column($rows, 'posted_by_orcid'));
    $featuredOn = Premium::active('featured_listing');
    $feeOn = OpportunityCuration::feeActive();
    $myVotes = $me ? OpportunityCuration::votesOf($pdo, (int) $me['id']) : [];

    $today = date('Y-m-d');
    $list = array_map(static function ($r) use ($applied, $saved, $today, $me, $counts, $myVotes, $myOrcid, $tiers, $featuredOn, $feeOn) {
        $id = (int) $r['id'];
        $mine = $myOrcid !== '' && strtoupper((string) $r['posted_by_orcid']) === $myOrcid;
        $tier = $tiers[strtoupper((string) $r['posted_by_orcid'])] ?? null;
        return [
            'premium_tier'      => $tier,
            'featured'          => $featuredOn && $tier !== null,
            'curation_status'   => $r['curation_status'],
            'curated_at'        => $r['curated_at'],
            'endorsements'      => $counts[$id]['endorse'] ?? 0,
            'reports'           => $counts[$id]['report'] ?? 0,
            'my_vote'           => $myVotes[$id]['vote'] ?? null,
            // Hanya untuk pemasang: catatan admin dan status biaya penayangan.
            'curation_note'     => $mine ? $r['curation_note'] : null,
            'fee'               => $mine ? [
                'status'    => $r['fee_status'],
                'amount'    => $r['fee_amount'] !== null ? (float) $r['fee_amount'] : null,
                'currency'  => $r['fee_currency'],
                'reference' => $r['fee_reference'],
                // Premium mati → verifikasi gratis; formulir pembayaran disembunyikan.
                'free_now'  => !$feeOn,
            ] : null,
            'id'                => $id,
            'title'             => $r['title'],
            'description'       => (string) $r['description'],
            'organization'      => $r['organization'] ?? null,
            'type'              => $r['org_type'] ?? null,
            'logo_url'          => $r['logo_url'] ?? null,
            'website'           => $r['website'] ?? null,
            'category'          => $r['category'],
            'sdg_focus'         => mkt_sdgs($r['sdg_alignment'] ?? '[]'),
            'required_skills'   => mkt_list($r['required_skills'] ?? '[]'),
            'budget_range'      => $r['budget_range'],
            'deadline'          => $r['deadline'],
            'deadline_passed'   => $r['deadline'] && $r['deadline'] < $today,
            'status'            => $r['status'],
            'posted_by_name'    => $r['posted_by_name'],
            'posted_by_orcid'   => $r['posted_by_orcid'],
            'is_mine'           => $mine,
            'application_count' => (int) $r['application_count'],
            'my_application'    => $applied[$id] ?? null,
            'saved'             => isset($saved[$id]),
            'created_at'        => $r['created_at'],
        ];
    }, $rows);

    $cfg = OpportunityCuration::settings();
    return [
        'status'        => 'success',
        'opportunities' => $list,
        'total'         => count($list),
        'signed_in'     => (bool) $me,
        'curation'      => [
            'can_vote'          => $me && (!$cfg['curatorsRequireOrcid'] || $myOrcid !== ''),
            'requires_orcid'    => (bool) $cfg['curatorsRequireOrcid'],
            'allow_apply_review'=> (bool) $cfg['allowApplyInReview'],
            'fee_enabled'       => OpportunityCuration::feeActive(),
            'fee_amount'        => (int) $cfg['feeAmount'],
            'fee_currency'      => $cfg['feeCurrency'],
            // Instruksi pembayaran hanya untuk pengguna yang login (dipakai saat memasang peluang).
            'fee_instructions'  => $me ? $cfg['feeInstructions'] : null,
        ],
    ];
}

function mkt_categories(PDO $pdo): array
{
    $rows = $pdo->query("SELECT ic.name, COUNT(io.id) AS n
                           FROM innovation_categories ic
                           LEFT JOIN innovation_opportunities io ON io.category_id = ic.id AND io.status = 'open'
                                                          AND io.curation_status IN ('review','approved')
                          GROUP BY ic.id, ic.name ORDER BY ic.name")->fetchAll(PDO::FETCH_ASSOC);
    return ['status' => 'success', 'categories' => array_map(static fn ($r) => ['name' => $r['name'], 'count' => (int) $r['n']], $rows)];
}

function mkt_count(PDO $pdo, string $sql): ?int
{
    try {
        $v = $pdo->query($sql)->fetchColumn();
        return $v === false || $v === null ? null : (int) $v;
    } catch (\Throwable $e) {
        return null;
    }
}

function mkt_stats(PDO $pdo): array
{
    $apps     = mkt_count($pdo, 'SELECT COUNT(*) FROM opportunity_applications');
    $accepted = mkt_count($pdo, "SELECT COUNT(*) FROM opportunity_applications WHERE status = 'accepted'");
    $decided  = mkt_count($pdo, "SELECT COUNT(*) FROM opportunity_applications WHERE status IN ('accepted','rejected')");
    return [
        'status' => 'success',
        'data'   => [
            'totalOpportunities' => mkt_count($pdo, "SELECT COUNT(*) FROM innovation_opportunities WHERE status = 'open' AND curation_status IN ('review','approved')"),
            'totalApplications'  => $apps,
            'activePartnerships' => mkt_has_org_column($pdo)
                ? mkt_count($pdo, 'SELECT COUNT(DISTINCT organization_id) FROM innovation_opportunities WHERE organization_id IS NOT NULL')
                : null,
            'successRate'        => ($decided ?? 0) > 0 ? (int) round(100 * $accepted / $decided) : null,
        ],
        'data_source' => 'database',
    ];
}

// ─── Tulis ──────────────────────────────────────────────────────────────────

function mkt_open_opportunity(PDO $pdo, int $id): array
{
    $st = $pdo->prepare('SELECT id, title, status, deadline, posted_by_orcid, curation_status FROM innovation_opportunities WHERE id = ?');
    $st->execute([$id]);
    $o = $st->fetch(PDO::FETCH_ASSOC);
    if (!$o) mkt_fail('Peluang tidak ditemukan', 404);
    return $o;
}

function mkt_apply(PDO $pdo, array $in, array $me): array
{
    $o = mkt_open_opportunity($pdo, (int) ($in['opportunity_id'] ?? 0));
    if ($o['status'] !== 'open' || !in_array($o['curation_status'], OpportunityCuration::PUBLIC_STATUSES, true)) {
        mkt_fail('Peluang ini sedang tidak menerima lamaran', 409);
    }
    if ($o['curation_status'] === 'review' && empty(OpportunityCuration::settings()['allowApplyInReview'])) {
        mkt_fail('Peluang ini masih dalam kurasi dan belum menerima lamaran', 409);
    }
    if ($o['deadline'] && $o['deadline'] < date('Y-m-d')) mkt_fail('Batas waktu peluang ini sudah lewat', 409);

    $text = trim((string) ($in['application_text'] ?? ''));
    if (mb_strlen($text) < 50) mkt_fail('Tuliskan proposal/motivasi minimal 50 karakter');
    if (mb_strlen($text) > 10000) mkt_fail('Proposal maksimal 10.000 karakter');
    $attachment = trim((string) ($in['attachment_url'] ?? ''));
    if ($attachment !== '' && !preg_match('#^https?://#i', $attachment)) mkt_fail('Tautan lampiran harus diawali http:// atau https://');

    $email = strtolower((string) $me['email']);
    $dup = $pdo->prepare('SELECT 1 FROM opportunity_applications WHERE opportunity_id = ? AND LOWER(applicant_email) = ?');
    $dup->execute([(int) $o['id'], $email]);
    if ($dup->fetchColumn()) mkt_fail('Anda sudah mengajukan lamaran untuk peluang ini', 409);

    $orcid = (string) ($me['orcid'] ?? '');
    if ($orcid !== '' && !ResearcherRecord::ensure($pdo, $orcid, (string) $me['name'])) $orcid = '';

    $pdo->prepare('INSERT INTO opportunity_applications
                     (opportunity_id, applicant_orcid, applicant_name, applicant_email, application_text, attachment_url, status, applied_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([(int) $o['id'], $orcid ?: null, mb_substr((string) ($me['name'] ?: $email), 0, 255), $email,
                   $text, $attachment ?: null, 'pending', date('Y-m-d H:i:s')]);

    // Beri tahu pemasang peluang bila punya akun.
    if (!empty($o['posted_by_orcid'])) {
        $acc = ResearcherRecord::accountFor($pdo, (string) $o['posted_by_orcid']);
        if ($acc) {
            Notifications::notify($pdo, (int) $acc['id'], 'collaboration',
                'Lamaran baru untuk "' . mb_substr((string) $o['title'], 0, 120) . '"',
                mb_substr($text, 0, 140), '/innovation-marketplace?opp=' . (int) $o['id'], (int) $me['id']);
        }
    }
    return ['status' => 'success', 'message' => 'Lamaran terkirim'];
}

function mkt_save(PDO $pdo, array $in, array $me): array
{
    $o = mkt_open_opportunity($pdo, (int) ($in['opportunity_id'] ?? 0));
    mkt_ensure_saves($pdo);
    $uid = (int) $me['id'];
    $pdo->prepare('DELETE FROM opportunity_saves WHERE user_id = ? AND opportunity_id = ?')->execute([$uid, (int) $o['id']]);
    $saved = !empty($in['saved']);
    if ($saved) {
        $pdo->prepare('INSERT INTO opportunity_saves (user_id, opportunity_id, created_at) VALUES (?, ?, ?)')
            ->execute([$uid, (int) $o['id'], date('Y-m-d H:i:s')]);
    }
    return ['status' => 'success', 'saved' => $saved];
}

function mkt_create(PDO $pdo, array $in, array $me): array
{
    $title = trim((string) ($in['title'] ?? ''));
    $desc  = trim((string) ($in['description'] ?? ''));
    if (mb_strlen($title) < 10 || mb_strlen($title) > 255) mkt_fail('Judul peluang 10–255 karakter');
    if (mb_strlen($desc) < 50) mkt_fail('Deskripsi minimal 50 karakter');
    $deadline = trim((string) ($in['deadline'] ?? ''));
    if ($deadline !== '' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadline) || $deadline < date('Y-m-d'))) {
        mkt_fail('Batas waktu harus tanggal yang akan datang');
    }
    $orcid = strtoupper((string) $me['orcid']);

    // Batasi: 5 peluang per hari per akun.
    $c = $pdo->prepare('SELECT COUNT(*) FROM innovation_opportunities WHERE posted_by_orcid = ? AND created_at >= ?');
    $c->execute([$orcid, date('Y-m-d H:i:s', time() - 86400)]);
    if ((int) $c->fetchColumn() >= 5) mkt_fail('Batas pemasangan peluang hari ini tercapai', 429);

    if (!ResearcherRecord::ensure($pdo, $orcid, (string) $me['name'])) mkt_fail('ORCID Anda belum dapat dipakai', 409);

    // Kategori (wajib, FK): pakai yang ada atau buat baru.
    $catName = mb_substr(trim((string) ($in['category'] ?? '')) ?: 'Lainnya', 0, 100);
    $q = $pdo->prepare('SELECT id FROM innovation_categories WHERE name = ?');
    $q->execute([$catName]);
    $catId = $q->fetchColumn();
    if ($catId === false) {
        $pdo->prepare('INSERT INTO innovation_categories (name) VALUES (?)')->execute([$catName]);
        $catId = $pdo->lastInsertId();
    }

    $isAdmin = UserAuth::isAdmin($me);
    [$feeStatus, $feeAmount, $feeCurrency, $feeSource] = OpportunityCuration::feeForNewListing($pdo, $me, $isAdmin);
    $cols = ['title', 'description', 'category_id', 'status', 'posted_by_orcid', 'deadline', 'sdg_alignment', 'budget_range', 'required_skills',
             'curation_status', 'curated_at', 'fee_status', 'fee_amount', 'fee_currency', 'created_at', 'updated_at'];
    $now  = date('Y-m-d H:i:s');
    $vals = [$title, $desc, (int) $catId, 'open', $orcid, $deadline ?: null, json_encode(mkt_sdgs($in['sdg_alignment'] ?? [])),
             mb_substr(trim((string) ($in['budget_range'] ?? '')), 0, 50) ?: null, json_encode(mkt_list($in['required_skills'] ?? [])),
             $isAdmin ? 'approved' : 'review', $isAdmin ? $now : null, $feeStatus, $feeAmount, $feeCurrency, $now, $now];

    // Organisasi (opsional) bila tabelnya tersedia.
    $orgName = trim((string) ($in['organization'] ?? ''));
    if ($orgName !== '' && mkt_has_org_column($pdo)) {
        $type = in_array($in['org_type'] ?? '', MKT_ORG_TYPES, true) ? $in['org_type'] : 'industry';
        $f = $pdo->prepare('SELECT id FROM organizations WHERE name = ?');
        $f->execute([mb_substr($orgName, 0, 255)]);
        $orgId = $f->fetchColumn();
        if ($orgId === false) {
            $pdo->prepare('INSERT INTO organizations (name, type) VALUES (?, ?)')->execute([mb_substr($orgName, 0, 255), $type]);
            $orgId = $pdo->lastInsertId();
        }
        $cols[] = 'organization_id';
        $vals[] = (int) $orgId;
    }

    $pdo->prepare('INSERT INTO innovation_opportunities (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')')
        ->execute($vals);
    return [
        'status'          => 'success',
        'opportunity_id'  => (int) $pdo->lastInsertId(),
        'curation_status' => $isAdmin ? 'approved' : 'review',
        'fee_status'      => $feeStatus,
        'fee_source'      => $feeSource,   // admin | free | membership | fee
    ];
}

function mkt_vote(PDO $pdo, array $in, array $me): array
{
    $cfg = OpportunityCuration::settings();
    if (!empty($cfg['curatorsRequireOrcid']) && empty($me['orcid'])) {
        mkt_fail('Tautkan ORCID Anda untuk ikut mengkurasi peluang', 409);
    }
    $o = OpportunityCuration::find($pdo, (int) ($in['opportunity_id'] ?? 0));
    if (!$o || $o['status'] !== 'open' || !in_array($o['curation_status'], OpportunityCuration::PUBLIC_STATUSES, true)) {
        mkt_fail('Peluang tidak ditemukan', 404);
    }
    if (!empty($me['orcid']) && strtoupper((string) $o['posted_by_orcid']) === strtoupper((string) $me['orcid'])) {
        mkt_fail('Anda tidak dapat menilai peluang Anda sendiri', 403);
    }
    $vote = (string) ($in['vote'] ?? '');
    if (!in_array($vote, ['endorse', 'report', 'clear'], true)) mkt_fail('Penilaian tidak valid');
    $reason = null;
    if ($vote === 'report') {
        $reason = (string) ($in['reason'] ?? '');
        if (!in_array($reason, OpportunityCuration::REPORT_REASONS, true)) mkt_fail('Pilih alasan laporan');
    }
    $note = trim(strip_tags((string) ($in['note'] ?? '')));
    $r = OpportunityCuration::vote($pdo, $o, $me, $vote, $reason, $note !== '' ? $note : null);
    return ['status' => 'success', 'my_vote' => $vote === 'clear' ? null : $vote] + $r;
}

function mkt_confirm_payment(PDO $pdo, array $in, array $me): array
{
    $o = OpportunityCuration::find($pdo, (int) ($in['opportunity_id'] ?? 0));
    if (!$o || empty($me['orcid']) || strtoupper((string) $o['posted_by_orcid']) !== strtoupper((string) $me['orcid'])) {
        mkt_fail('Peluang tidak ditemukan', 404);
    }
    if (in_array($o['fee_status'], ['paid', 'waived'], true)) mkt_fail('Biaya penayangan peluang ini sudah lunas', 409);
    $ref = mb_substr(trim(strip_tags((string) ($in['reference'] ?? ''))), 0, 255);
    if (mb_strlen($ref) < 4) mkt_fail('Isi keterangan pembayaran (mis. nama pengirim, bank, tanggal, atau nomor referensi)');
    $now = date('Y-m-d H:i:s');
    $pdo->prepare("UPDATE innovation_opportunities SET fee_status = 'pending', fee_reference = ?, fee_submitted_at = ?, updated_at = ? WHERE id = ?")
        ->execute([$ref, $now, $now, (int) $o['id']]);
    return ['status' => 'success', 'fee_status' => 'pending'];
}
