<?php
declare(strict_types=1);

/**
 * @file api/wrapper/my_statistics.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief My Statistics API.
 * Returns time-series impact data derived from the researcher's ORCID profile.
 * 
 * Endpoints:
 * GET /api/my_statistics.php?orcid=...&range=12
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
if (!defined('DB_DATABASE')) require_once ROOT_PATH . '/config/config.php';
require_once ROOT_PATH . '/includes/autoload.php';

$orcid = trim($_GET['orcid'] ?? '');
$range = min(60, max(3, (int)($_GET['range'] ?? 12)));

if (empty($orcid) || !preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parameter orcid valid diperlukan']);
    exit;
}

// ── Ambil profil lewat ResearcherProfileService (database dulu, lalu mesin SDG) ──
@set_time_limit(90);
ob_start();
try {
    $profileData = \Sciecola\Sdg\ResearcherProfileService::build($orcid);
    ob_end_clean();
} catch (Throwable $e) {
    ob_end_clean();
    http_response_code(502);
    echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data statistik: ' . $e->getMessage()]);
    exit;
}
$profile = $profileData['profile'] ?? [];

// ── Kunjungan profil: dihitung dari riwayat aktivitas pengguna lain yang login
//    (user_activity_log, kategori researcher). Pengunjung anonim tidak tercatat.
$profileViews = 0;
try {
    $vp = \Sciecola\Database\Db::pdo()->prepare(
        "SELECT COUNT(*) FROM user_activity_log WHERE activity_type = 'viewed' AND category = 'researcher' AND target_id = ? AND orcid <> ?"
    );
    $vp->execute([$orcid, $orcid]);
    $profileViews = (int) $vp->fetchColumn();
} catch (Throwable $e) {
    $profileViews = 0;
}

// ── Tren dampak ─────────────────────────────────────────────────────────────
// Belum ada pelacakan kunjungan/unduhan maupun sitasi per bulan. Dulu bagian ini
// mengarang angka acak (rand/lcg_value) yang berubah setiap kali halaman dibuka;
// kini dikirim kosong agar grafik tidak menampilkan data palsu.
$months = [];

// ── SDG radar data ───────────────────────────────────────────────────────────

$sdgFocus = $profile['sdgFocus'] ?? [];
arsort($sdgFocus);
$sdgRadar = [];
foreach (array_slice($sdgFocus, 0, 8) as $s) {
    $sdgRadar[] = [
        'subject'   => 'SDG ' . $s['sdg'],
        'name'      => $s['name'] ?? 'SDG ' . $s['sdg'],
        'value'     => (int)($s['percentage'] ?? 0),
        'fullMark'  => 100,
    ];
}

// ── Demografi pembaca: belum ada data kunjungan per negara → kosong (dulu persentase karangan).
$demographics = [];

// ── Sumber sitasi: hanya sumber yang benar-benar dipakai menghitung total sitasi.
$sources = [];
if ((int) ($profile['citations'] ?? 0) > 0) {
    $sources[] = [
        'source' => !empty($profile['wizdamImpact']) ? 'Scopus (wizdam-apis)' : 'OpenAlex',
        'count'  => (int) $profile['citations'],
    ];
}

echo json_encode([
    'status'        => 'success',
    'orcid'         => $orcid,
    'summary'       => [
        'publications' => $profile['publications'] ?? 0,
        'citations'    => $profile['citations'] ?? 0,
        'hIndex'       => $profile['hIndex'] ?? 0,
        'i10Index'     => $profile['i10Index'] ?? 0,
        'views'        => $profileViews,
        'downloads'    => $profile['downloads'] ?? 0,
        'sdgsInvolved' => $profile['sdgsInvolved'] ?? 0,
    ],
    'impactTrends'  => $months,
    'sdgRadar'      => $sdgRadar,
    'demographics'  => $demographics,
    'citationSources' => $sources,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
