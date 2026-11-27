<?php
declare(strict_types=1);

/**
 * @file api/admin/opportunity_curation.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_admin
 * @brief Antrean kurasi peluang Pasar Inovasi dan konfirmasi biaya penayangan.
 *
 * GET  ?status=review|approved|on_hold|auto_hidden|all&fee=unpaid|pending|paid|waived&q=
 *      → { items[], counts{status}, fee_counts{fee}, settings }
 * POST { action, id, ... }
 *      approve    — setujui ("Terverifikasi"); biaya harus paid/waived kecuali force_waive=true
 *      hold       — tunda + note (disembunyikan dari publik, pemasang diberi catatan)
 *      restore    — kembalikan ke 'review' (tampil lagi sebagai "Dalam kurasi")
 *      delete     — hapus peluang beserta penilaiannya
 *      mark_paid  — konfirmasi pembayaran biaya penayangan
 *      waive_fee  — bebaskan biaya
 *      reject_payment — tolak bukti bayar (kembali ke unpaid) + note
 * Semua tindakan dicatat di log audit admin dan pemasang menerima notifikasi.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\AdminGuard;
use Sciecola\Auth\UserAuth;
use Sciecola\Database\Db;
use Sciecola\Marketplace\OpportunityCuration as Cur;
use Sciecola\Support\AppSettings;

AdminGuard::require();

function cur_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = Db::pdo();
    if (!$pdo) cur_out(['status' => 'error', 'message' => 'Database tidak dapat dihubungi'], 503);
    Cur::ensure($pdo);
    $admin = UserAuth::current();

    if (AdminGuard::method() === 'GET') {
        $status = (string) ($_GET['status'] ?? 'review');
        $fee    = (string) ($_GET['fee'] ?? '');
        $q      = trim((string) ($_GET['q'] ?? ''));
        $where = [];
        $params = [];
        if (in_array($status, Cur::STATUSES, true)) { $where[] = 'io.curation_status = ?'; $params[] = $status; }
        if (in_array($fee, Cur::FEE_STATUSES, true)) { $where[] = 'io.fee_status = ?'; $params[] = $fee; }
        if ($q !== '') { $where[] = '(io.title LIKE ? OR io.posted_by_orcid LIKE ?)'; $params[] = "%{$q}%"; $params[] = "%{$q}%"; }
        $sql = 'SELECT io.id, io.title, io.description, io.status, io.deadline, io.posted_by_orcid, io.created_at,
                       io.curation_status, io.curation_note, io.curated_at, io.fee_status, io.fee_amount, io.fee_currency,
                       io.fee_reference, io.fee_submitted_at, io.fee_confirmed_at, ic.name AS category, r.name AS poster_name
                  FROM innovation_opportunities io
                  LEFT JOIN innovation_categories ic ON ic.id = io.category_id
                  LEFT JOIN researchers r ON r.orcid = io.posted_by_orcid'
             . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
             . ' ORDER BY io.created_at DESC LIMIT 300';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);

        $counts = Cur::counts($pdo, array_column($rows, 'id'));
        $reasons = [];
        if ($rows) {
            $ids = implode(',', array_map('intval', array_column($rows, 'id')));
            foreach ($pdo->query("SELECT opportunity_id, reason, COUNT(*) n FROM opportunity_curation_votes
                                   WHERE vote = 'report' AND opportunity_id IN ({$ids}) GROUP BY opportunity_id, reason") as $r) {
                $reasons[(int) $r['opportunity_id']][(string) $r['reason']] = (int) $r['n'];
            }
        }
        $items = array_map(static function ($r) use ($counts, $reasons) {
            $id = (int) $r['id'];
            $c = $counts[$id] ?? ['endorse' => 0, 'report' => 0];
            return $r + [
                'endorsements'   => $c['endorse'],
                'reports'        => $c['report'],
                'report_reasons' => $reasons[$id] ?? (object) [],
                'fee_amount_num' => $r['fee_amount'] !== null ? (float) $r['fee_amount'] : null,
                'description'    => mb_substr((string) $r['description'], 0, 400),
            ];
        }, $rows);
        // Antrean: sinyal publik paling kuat (laporan, lalu dukungan) didahulukan.
        usort($items, static fn ($a, $b) => [$b['reports'], $b['fee_status'] === 'pending', $b['endorsements']]
                                          <=> [$a['reports'], $a['fee_status'] === 'pending', $a['endorsements']]);

        $statusCounts = array_fill_keys(Cur::STATUSES, 0);
        foreach ($pdo->query('SELECT curation_status s, COUNT(*) n FROM innovation_opportunities GROUP BY curation_status') as $r) {
            $statusCounts[(string) $r['s']] = (int) $r['n'];
        }
        $feeCounts = array_fill_keys(Cur::FEE_STATUSES, 0);
        foreach ($pdo->query('SELECT fee_status s, COUNT(*) n FROM innovation_opportunities GROUP BY fee_status') as $r) {
            $feeCounts[(string) $r['s']] = (int) $r['n'];
        }
        cur_out(['status' => 'success', 'items' => $items, 'counts' => $statusCounts,
                 'fee_counts' => $feeCounts, 'settings' => Cur::settings()]);
    }

    if (AdminGuard::method() !== 'POST') cur_out(['status' => 'error', 'message' => 'Method not allowed'], 405);

    $in = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($in['action'] ?? '');
    $o = Cur::find($pdo, (int) ($in['id'] ?? 0));
    if (!$o) cur_out(['status' => 'error', 'message' => 'Peluang tidak ditemukan'], 404);
    $id  = (int) $o['id'];
    $now = date('Y-m-d H:i:s');
    $adminId = $admin ? (int) $admin['id'] : null;
    $note = mb_substr(trim(strip_tags((string) ($in['note'] ?? ''))), 0, 1000);
    $before = ['curation_status' => $o['curation_status'], 'fee_status' => $o['fee_status']];
    $setStatus = static function (string $status, ?string $n) use ($pdo, $id, $now, $adminId) {
        $pdo->prepare('UPDATE innovation_opportunities SET curation_status = ?, curation_note = ?, curated_by = ?, curated_at = ?, updated_at = ? WHERE id = ?')
            ->execute([$status, $n, $adminId, $now, $now, $id]);
    };

    switch ($action) {
        case 'approve':
            if (!in_array($o['fee_status'], ['paid', 'waived'], true)) {
                if (empty($in['force_waive'])) {
                    cur_out(['status' => 'error', 'code' => 'fee_unpaid',
                             'message' => 'Biaya penayangan belum lunas. Konfirmasi pembayaran atau bebaskan biaya terlebih dahulu.'], 409);
                }
                $pdo->prepare("UPDATE innovation_opportunities SET fee_status = 'waived', fee_confirmed_at = ? WHERE id = ?")->execute([$now, $id]);
            }
            $setStatus('approved', null);
            Cur::notifyPoster($pdo, $o, 'Peluang Anda terverifikasi', 'Peluang kini tampil dengan lencana Terverifikasi.', $adminId);
            break;
        case 'hold':
            if ($note === '') cur_out(['status' => 'error', 'message' => 'Tulis catatan untuk pemasang'], 400);
            $setStatus('on_hold', $note);
            Cur::notifyPoster($pdo, $o, 'Peluang Anda ditunda', $note, $adminId);
            break;
        case 'restore':
            $setStatus('review', null);
            Cur::notifyPoster($pdo, $o, 'Peluang Anda ditampilkan kembali', 'Peluang kembali tampil dan sedang dalam kurasi.', $adminId);
            break;
        case 'delete':
            $pdo->prepare('DELETE FROM opportunity_curation_votes WHERE opportunity_id = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM innovation_opportunities WHERE id = ?')->execute([$id]);
            Cur::notifyPoster($pdo, $o, 'Peluang Anda dihapus admin', $note !== '' ? $note : null, $adminId);
            break;
        case 'mark_paid':
            $pdo->prepare("UPDATE innovation_opportunities SET fee_status = 'paid', fee_confirmed_at = ?, updated_at = ? WHERE id = ?")->execute([$now, $now, $id]);
            Cur::notifyPoster($pdo, $o, 'Pembayaran diterima', 'Biaya penayangan telah dikonfirmasi. Peluang menunggu persetujuan akhir admin.', $adminId);
            break;
        case 'waive_fee':
            $pdo->prepare("UPDATE innovation_opportunities SET fee_status = 'waived', fee_confirmed_at = ?, updated_at = ? WHERE id = ?")->execute([$now, $now, $id]);
            Cur::notifyPoster($pdo, $o, 'Biaya penayangan dibebaskan', null, $adminId);
            break;
        case 'reject_payment':
            if ($note === '') cur_out(['status' => 'error', 'message' => 'Tulis alasan penolakan bukti bayar'], 400);
            $pdo->prepare("UPDATE innovation_opportunities SET fee_status = 'unpaid', curation_note = ?, updated_at = ? WHERE id = ?")->execute([$note, $now, $id]);
            Cur::notifyPoster($pdo, $o, 'Konfirmasi pembayaran belum dapat diterima', $note, $adminId);
            break;
        default:
            cur_out(['status' => 'error', 'message' => 'Tindakan tidak dikenal'], 400);
    }

    $after = $action === 'delete' ? null : (function () use ($pdo, $id) {
        $r = Cur::find($pdo, $id);
        return $r ? ['curation_status' => $r['curation_status'], 'fee_status' => $r['fee_status']] : null;
    })();
    AppSettings::audit($admin, 'opportunity.' . $action, 'opportunity:' . $id, $before, $after);
    cur_out(['status' => 'success', 'item' => $after]);
} catch (Throwable $e) {
    error_log('[admin/opportunity_curation] ' . $e->getMessage());
    cur_out(['status' => 'error', 'message' => 'Kurasi peluang belum dapat diproses.'], 503);
}
