<?php
declare(strict_types=1);

/**
 * @file api/wrapper/premium.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Status layanan premium untuk frontend (lihat src/Premium/Premium.php).
 *
 * GET ?action=status                         → { enabled, features{}, tiers{}, contact_email, pricing_note, me }
 * GET ?action=showcase                       → { members[] }   (kosong bila premium/etalase mati)
 * GET ?action=tier&orcid=0000-...            → { tier|null }   (lencana; null bila premium mati)
 * GET ?action=access&feature=x[&institution=ID] → { allowed, premium }
 */

use Sciecola\Auth\UserAuth;
use Sciecola\Database\Db;
use Sciecola\Premium\Premium;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

function prm_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $action = (string) ($_GET['action'] ?? 'status');
    $pdo = Db::pdo();
    $me  = UserAuth::current();

    // Tanpa database: anggap premium mati (semua gratis).
    if (!$pdo) {
        prm_out(['status' => 'success', 'enabled' => false, 'features' => array_fill_keys(Premium::FEATURES, false),
                 'members' => [], 'tier' => null, 'allowed' => true, 'premium' => false, 'me' => null]);
    }
    Premium::ensure($pdo);

    if ($action === 'showcase') {
        prm_out(['status' => 'success', 'members' => Premium::showcase($pdo)]);
    }

    if ($action === 'tier') {
        $orcid = strtoupper(trim((string) ($_GET['orcid'] ?? '')));
        $tiers = preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid) ? Premium::tiersForOrcids($pdo, [$orcid]) : [];
        prm_out(['status' => 'success', 'tier' => $tiers[$orcid] ?? null]);
    }

    if ($action === 'access') {
        $feature = (string) ($_GET['feature'] ?? '');
        if (!in_array($feature, Premium::FEATURES, true)) prm_out(['status' => 'error', 'message' => 'Fitur tidak dikenal'], 400);
        prm_out([
            'status'  => 'success',
            'premium' => Premium::active($feature),
            'allowed' => Premium::canUse($pdo, $feature, $me, ['institution' => (string) ($_GET['institution'] ?? '')]),
            'signed_in' => (bool) $me,
        ]);
    }

    // status
    $s = Premium::settings();
    $enabled = Premium::enabled();
    $mine = null;
    if ($enabled && $me) {
        $m = Premium::membershipFor($pdo, $me);
        if ($m) {
            $mine = [
                'tier'           => $m['tier'],
                'display_name'   => $m['display_name'],
                'ends_on'        => $m['ends_on'],
                'institution_id' => $m['institution_id'],
                'verified_quota' => Premium::verifiedQuota($m),
                'verified_used'  => Premium::usage($pdo, 'm:' . $m['id'], 'verified_listing', date('Y')),
            ];
        }
    }
    prm_out([
        'status'        => 'success',
        'enabled'       => $enabled,
        'features'      => Premium::featureMap(),
        'tiers'         => [
            'sponsor'      => ['verified_quota' => (int) $s['quotaVerifiedSponsor']],
            'partner'      => ['verified_quota' => (int) $s['quotaVerifiedPartner']],
            'collaborator' => ['verified_quota' => (int) $s['quotaVerifiedCollaborator']],
        ],
        'free_analysis_refresh_per_day' => (int) $s['freeAnalysisRefreshPerDay'],
        'contact_email' => $enabled ? $s['contactEmail'] : '',
        'pricing_note'  => $enabled ? $s['pricingNote'] : '',
        'me'            => $mine,
        'is_admin'      => $me ? UserAuth::isAdmin($me) : false,
    ]);
} catch (Throwable $e) {
    error_log('[premium] ' . $e->getMessage());
    // Gagal membaca status → perlakukan sebagai gratis, jangan memblokir pengguna.
    prm_out(['status' => 'success', 'enabled' => false, 'features' => array_fill_keys(Premium::FEATURES, false),
             'members' => [], 'tier' => null, 'allowed' => true, 'premium' => false, 'me' => null]);
}
