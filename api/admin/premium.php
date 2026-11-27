<?php
declare(strict_types=1);

/**
 * @file api/admin/premium.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_admin
 * @brief Admin → Premium: saklar "Make Premium", fitur premium, dan keanggotaan.
 *
 * GET                                   → { settings, members[], stats }
 * POST { action: toggle, enabled }      → nyalakan/matikan layanan premium (saklar utama)
 * POST { action: settings, values{} }   → fitur yang menjadi premium, kuota, kontak, keterangan harga
 * POST { action: save_member, id?, tier, display_name, email?, orcid?, institution_id?,
 *        logo_url?, website?, starts_on, ends_on?, note? }
 * POST { action: cancel_member, id } | { action: delete_member, id }
 * Semua perubahan dicatat di log audit admin.
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
use Sciecola\Community\Notifications;
use Sciecola\Database\Db;
use Sciecola\Premium\Premium;
use Sciecola\Support\AppSettings;

AdminGuard::require();

function padm_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function padm_url(string $v): ?string
{
    $v = trim($v);
    if ($v === '') return null;
    return preg_match('#^https?://#i', $v) && filter_var($v, FILTER_VALIDATE_URL) ? mb_substr($v, 0, 512) : null;
}

function padm_date(string $v): ?string
{
    $v = trim($v);
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
}

function padm_members(PDO $pdo): array
{
    $today = date('Y-m-d');
    $rows = $pdo->query('SELECT m.*, u.email AS user_email, u.name AS user_name, u.orcid AS user_orcid
                           FROM premium_memberships m LEFT JOIN user_accounts u ON u.id = m.user_id
                          ORDER BY m.status ASC, m.starts_on DESC, m.id DESC')->fetchAll(PDO::FETCH_ASSOC);
    return array_map(static function ($r) use ($pdo, $today) {
        $active = $r['status'] === 'active' && $r['starts_on'] <= $today && ($r['ends_on'] === null || $r['ends_on'] >= $today);
        $r['state'] = $r['status'] === 'cancelled' ? 'cancelled'
                    : ($r['starts_on'] > $today ? 'scheduled' : ($active ? 'active' : 'expired'));
        $r['verified_quota'] = Premium::verifiedQuota($r);
        $r['verified_used']  = Premium::usage($pdo, 'm:' . $r['id'], 'verified_listing', date('Y'));
        return $r;
    }, $rows);
}

try {
    $pdo = Db::pdo();
    if (!$pdo) padm_out(['status' => 'error', 'message' => 'Database tidak dapat dihubungi'], 503);
    Premium::ensure($pdo);
    $admin = UserAuth::current();

    if (AdminGuard::method() === 'GET') {
        $members = padm_members($pdo);
        $counts = array_fill_keys(Premium::TIERS, 0);
        foreach ($members as $m) if ($m['state'] === 'active') $counts[$m['tier']] = ($counts[$m['tier']] ?? 0) + 1;
        padm_out(['status' => 'success', 'settings' => Premium::settings(), 'members' => $members,
                  'stats' => ['active_by_tier' => $counts, 'total' => count($members)]]);
    }
    if (AdminGuard::method() !== 'POST') padm_out(['status' => 'error', 'message' => 'Method not allowed'], 405);

    $in = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $action = (string) ($in['action'] ?? '');

    if ($action === 'toggle') {
        $change = AppSettings::save('premium', ['enabled' => !empty($in['enabled'])], $admin ? (int) $admin['id'] : null);
        AppSettings::audit($admin, !empty($in['enabled']) ? 'premium.enable' : 'premium.disable', 'premium',
            ['enabled' => $change['old']['enabled'] ?? false], ['enabled' => $change['new']['enabled']]);
        padm_out(['status' => 'success', 'settings' => Premium::settings()]);
    }

    if ($action === 'settings') {
        $values = is_array($in['values'] ?? null) ? $in['values'] : [];
        unset($values['enabled']); // saklar utama hanya lewat action=toggle
        $change = AppSettings::save('premium', $values, $admin ? (int) $admin['id'] : null);
        AppSettings::audit($admin, 'settings.premium', 'premium', $change['old'], $change['new']);
        padm_out(['status' => 'success', 'settings' => Premium::settings()]);
    }

    if ($action === 'save_member') {
        $id   = (int) ($in['id'] ?? 0);
        $tier = (string) ($in['tier'] ?? '');
        if (!in_array($tier, Premium::TIERS, true)) padm_out(['status' => 'error', 'message' => 'Pilih tingkat keanggotaan'], 400);
        $name = mb_substr(trim(strip_tags((string) ($in['display_name'] ?? ''))), 0, 255);
        if (mb_strlen($name) < 2) padm_out(['status' => 'error', 'message' => 'Isi nama yang ditampilkan'], 400);
        $starts = padm_date((string) ($in['starts_on'] ?? '')) ?? date('Y-m-d');
        $ends   = padm_date((string) ($in['ends_on'] ?? ''));
        if ($ends !== null && $ends < $starts) padm_out(['status' => 'error', 'message' => 'Tanggal berakhir sebelum tanggal mulai'], 400);

        $orcid = strtoupper(trim((string) ($in['orcid'] ?? '')));
        if ($orcid !== '' && !preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
            padm_out(['status' => 'error', 'message' => 'Format ORCID tidak valid'], 400);
        }
        $userId = null;
        $email = mb_strtolower(trim((string) ($in['email'] ?? '')));
        if ($email !== '') {
            $st = $pdo->prepare('SELECT id, orcid FROM user_accounts WHERE LOWER(email) = ?');
            $st->execute([$email]);
            $acc = $st->fetch(PDO::FETCH_ASSOC);
            if (!$acc) padm_out(['status' => 'error', 'message' => 'Akun dengan email ini tidak ditemukan'], 404);
            $userId = (int) $acc['id'];
            if ($orcid === '' && !empty($acc['orcid'])) $orcid = strtoupper((string) $acc['orcid']);
        } elseif ($orcid !== '') {
            $st = $pdo->prepare('SELECT id FROM user_accounts WHERE UPPER(orcid) = ?');
            $st->execute([$orcid]);
            $userId = ($v = $st->fetchColumn()) !== false ? (int) $v : null;
        }
        $vals = [
            $tier, $name, $userId, $orcid ?: null,
            mb_substr(trim((string) ($in['institution_id'] ?? '')), 0, 191) ?: null,
            padm_url((string) ($in['logo_url'] ?? '')), padm_url((string) ($in['website'] ?? '')),
            $starts, $ends, mb_substr(trim(strip_tags((string) ($in['note'] ?? ''))), 0, 2000) ?: null,
        ];
        $now = date('Y-m-d H:i:s');
        if ($id > 0) {
            $old = $pdo->prepare('SELECT * FROM premium_memberships WHERE id = ?');
            $old->execute([$id]);
            $before = $old->fetch(PDO::FETCH_ASSOC);
            if (!$before) padm_out(['status' => 'error', 'message' => 'Keanggotaan tidak ditemukan'], 404);
            $pdo->prepare("UPDATE premium_memberships SET tier = ?, display_name = ?, user_id = ?, orcid = ?, institution_id = ?,
                             logo_url = ?, website = ?, starts_on = ?, ends_on = ?, note = ?, status = 'active', updated_at = ? WHERE id = ?")
                ->execute(array_merge($vals, [$now, $id]));
            AppSettings::audit($admin, 'premium.member_update', 'membership:' . $id,
                ['tier' => $before['tier'], 'ends_on' => $before['ends_on']], ['tier' => $tier, 'ends_on' => $ends]);
        } else {
            $pdo->prepare('INSERT INTO premium_memberships (tier, display_name, user_id, orcid, institution_id, logo_url, website,
                             starts_on, ends_on, note, status, created_by, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'active\', ?, ?, ?)')
                ->execute(array_merge($vals, [$admin ? (int) $admin['id'] : null, $now, $now]));
            $id = (int) $pdo->lastInsertId();
            AppSettings::audit($admin, 'premium.member_create', 'membership:' . $id, null, ['tier' => $tier, 'name' => $name]);
            if ($userId) {
                Notifications::notify($pdo, $userId, 'system', 'Selamat! Anda kini ' . ucfirst($tier) . ' Sciecola',
                    'Keanggotaan premium Anda aktif' . ($ends ? ' hingga ' . $ends : '') . '.', '/premium',
                    $admin ? (int) $admin['id'] : null);
            }
        }
        padm_out(['status' => 'success', 'id' => $id, 'members' => padm_members($pdo)]);
    }

    if ($action === 'cancel_member' || $action === 'delete_member') {
        $id = (int) ($in['id'] ?? 0);
        $st = $pdo->prepare('SELECT * FROM premium_memberships WHERE id = ?');
        $st->execute([$id]);
        $m = $st->fetch(PDO::FETCH_ASSOC);
        if (!$m) padm_out(['status' => 'error', 'message' => 'Keanggotaan tidak ditemukan'], 404);
        if ($action === 'cancel_member') {
            $pdo->prepare("UPDATE premium_memberships SET status = 'cancelled', updated_at = ? WHERE id = ?")->execute([date('Y-m-d H:i:s'), $id]);
        } else {
            $pdo->prepare('DELETE FROM premium_memberships WHERE id = ?')->execute([$id]);
        }
        AppSettings::audit($admin, 'premium.' . $action, 'membership:' . $id, ['tier' => $m['tier'], 'name' => $m['display_name']], null);
        padm_out(['status' => 'success', 'members' => padm_members($pdo)]);
    }

    padm_out(['status' => 'error', 'message' => 'Tindakan tidak dikenal'], 400);
} catch (InvalidArgumentException $e) {
    padm_out(['status' => 'error', 'message' => $e->getMessage()], 400);
} catch (Throwable $e) {
    error_log('[admin/premium] ' . $e->getMessage());
    padm_out(['status' => 'error', 'message' => 'Pengaturan premium belum dapat diproses.'], 503);
}
