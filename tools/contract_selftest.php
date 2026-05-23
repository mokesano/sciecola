<?php

/**
 * contract_selftest.php — v2 (dengan diagnostik lengkap)
 *
 * Letakkan di: /tools/contract_selftest.php
 *
 * Jalankan:
 *   php tools/contract_selftest.php
 *   php tools/contract_selftest.php --diagnose   (mode diagnosa penuh)
 *
 * Perbaikan dari v1:
 *   - Tampilkan raw response saat JSON gagal parse
 *   - Detect HTML/PHP error page dan beri penjelasan
 *   - Probe endpoint dulu sebelum validasi kontrak
 *   - Tangani HTTP 404/500 secara eksplisit
 */

require_once __DIR__ . '/../library/WizdamApiContractValidator.php';

// ─── Mode & Konfigurasi ───────────────────────────────────────────────────────

$DIAGNOSE_MODE = in_array('--diagnose', $argv ?? [], true);
$VERBOSE       = in_array('--verbose', $argv ?? [], true) || $DIAGNOSE_MODE;

$apiBaseUrl = getenv('WIZDAM_API_URL') ?: 'https://api.sangia.org/v1';
$apiKey     = getenv('WIZDAM_API_KEY') ?: '';
$TEST_ORCID = getenv('TEST_ORCID') ?: '0000-0002-1825-0097';
$TEST_DOI   = getenv('TEST_DOI')   ?: '10.1038/nature12373';

// ─── Fungsi diagnostik ────────────────────────────────────────────────────────

/**
 * Analisa raw response dan beri pesan yang berguna.
 */
function diagnoseRawResponse(string $raw, string $url, int $httpCode): string
{
    if (empty($raw)) {
        return "Response KOSONG (empty string). HTTP $httpCode. Kemungkinan: endpoint tidak ada, auth gagal, atau server timeout.";
    }

    $trimmed = trim($raw);

    // HTML error page
    if (str_starts_with($trimmed, '<!DOCTYPE') || str_starts_with($trimmed, '<html') || str_starts_with($trimmed, '<HTML')) {
        $titleMatch = [];
        preg_match('/<title[^>]*>(.*?)<\/title>/si', $raw, $titleMatch);
        $title = $titleMatch[1] ?? '(tidak ada title)';
        return "Response adalah HTML, bukan JSON. HTTP $httpCode. Title: '$title'. Kemungkinan: endpoint 404, Apache/Nginx error page, atau routing tidak terkonfigurasi untuk path ini.";
    }

    // PHP error/warning
    if (preg_match('/<b>(Fatal error|Warning|Notice|Parse error)<\/b>/i', $raw)) {
        preg_match('/<b>.*?<\/b>:\s*(.*?)\s+in\s+<b>(.*?)<\/b>/i', $raw, $errMatch);
        $errMsg = $errMatch[1] ?? 'PHP error';
        $errFile = $errMatch[2] ?? '';
        return "PHP error terdeteksi di response. HTTP $httpCode. Error: $errMsg. File: $errFile";
    }

    // JSON parseable tapi bukan valid kontrak
    $decoded = json_decode($raw, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        return "JSON valid tapi mungkin tidak sesuai kontrak. HTTP $httpCode. Keys: " . implode(', ', array_keys($decoded ?? []));
    }

    // JSON gagal parse
    $snippet = mb_substr($raw, 0, 300);
    return "Bukan JSON. HTTP $httpCode. JSON error: " . json_last_error_msg() . ". Awalan response: " . $snippet;
}

/**
 * Probe satu URL dan kembalikan info lengkap.
 */
function probeEndpoint(string $url, array $payload = [], string $method = 'GET'): array
{
    global $apiKey;

    $ch = curl_init();

    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-API-Key: ' . $apiKey,
        'X-Contract-Version: ' . WizdamApiContractValidator::CONTRACT_VERSION,
        'X-Contract-Test: true',
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 3,
        CURLOPT_HTTPHEADER     => $headers,
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    } elseif ($method === 'GET') {
        $fullUrl = empty($payload) ? $url : $url . '?' . http_build_query($payload);
        curl_setopt($ch, CURLOPT_URL, $fullUrl);
    }

    $raw      = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $curlErr  = curl_error($ch);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);

    $isJson = json_decode($raw ?: '', true) !== null && json_last_error() === JSON_ERROR_NONE;

    return [
        'url'          => $finalUrl,
        'http_code'    => $httpCode,
        'content_type' => $contentType,
        'raw'          => $raw ?: '',
        'is_json'      => $isJson,
        'curl_error'   => $curlErr,
        'diagnosis'    => $curlErr
            ? "cURL error: $curlErr"
            : diagnoseRawResponse($raw ?: '', $finalUrl, $httpCode),
    ];
}

// ─── Output helpers ───────────────────────────────────────────────────────────

$results     = [];
$hasFailure  = false;
$probeReport = [];

function ok(string $msg):  void { echo "  \033[32m✓\033[0m $msg\n"; }
function err(string $msg): void { echo "  \033[31m✗\033[0m $msg\n"; }
function warn(string $msg):void { echo "  \033[33m⚠\033[0m $msg\n"; }
function info(string $msg):void { echo "  \033[36mℹ\033[0m $msg\n"; }

function runTest(string $name, callable $test): void
{
    global $results, $hasFailure;
    echo "  → $name ... ";
    try {
        $test();
        echo "\033[32mPASS\033[0m\n";
        $results[$name] = 'PASS';
    } catch (WizdamContractException $e) {
        echo "\033[31mFAIL\033[0m\n";
        echo "    " . $e->getMessage() . "\n";
        $results[$name] = 'FAIL (contract)';
        $hasFailure = true;
    } catch (WizdamApiException $e) {
        echo "\033[33mSKIP\033[0m (API error: " . $e->getMessage() . ")\n";
        $results[$name] = 'SKIP';
    } catch (\RuntimeException $e) {
        echo "\033[31mFAIL\033[0m\n";
        echo "    " . $e->getMessage() . "\n";
        $results[$name] = 'FAIL (runtime)';
        $hasFailure = true;
    }
}

// ─── PHASE 1: PROBE ───────────────────────────────────────────────────────────

echo "\n\033[1mWizdam APIs Contract Self-Test v2\033[0m\n";
echo str_repeat('─', 52) . "\n";
echo "API Base : $apiBaseUrl\n";
echo "API Key  : " . (empty($apiKey) ? "\033[31m(tidak ada!)\033[0m" : "\033[32m" . mb_substr($apiKey, 0, 8) . "...\033[0m") . "\n";
echo "ORCID    : $TEST_ORCID\n";
echo "DOI      : $TEST_DOI\n";
echo str_repeat('─', 52) . "\n";

echo "\n\033[1m[PHASE 1] Probe endpoint — cek apa yang aktif di api.sangia.org\033[0m\n\n";

// Daftar kandidat endpoint berdasarkan arsitektur wizdam-apis & sdgs-mapper
$candidateEndpoints = [
    // Endpoint yang diharapkan kontrak (wizdam-apis v1)
    ['label' => 'POST /v1/impact/calculate',     'method' => 'POST', 'path' => 'impact/calculate',     'payload' => ['orcid' => $TEST_ORCID]],
    ['label' => 'POST /v1/analyze/orcid',        'method' => 'POST', 'path' => 'analyze/orcid',        'payload' => ['orcid' => $TEST_ORCID, 'include_details' => true]],
    ['label' => 'POST /v1/analyze/doi',          'method' => 'POST', 'path' => 'analyze/doi',          'payload' => ['doi' => $TEST_DOI]],

    // Endpoint alternatif tanpa /v1/ prefix
    ['label' => 'GET  /sdgs (root tanpa v1)',    'method' => 'GET',  'path' => '../sdgs',              'payload' => ['orcid' => $TEST_ORCID]],

    // Endpoint yang sudah diketahui ada di sdgs-mapper (untuk reference)
    ['label' => 'GET  /SDG_Classification_API',  'method' => 'GET',  'path' => 'SDG_Classification_API.php', 'payload' => ['orcid' => $TEST_ORCID]],
];

$anyJsonEndpoint = false;

foreach ($candidateEndpoints as $ep) {
    $url    = rtrim($apiBaseUrl, '/') . '/' . ltrim($ep['path'], '/');
    $result = probeEndpoint($url, $ep['payload'], $ep['method']);
    $probeReport[$ep['label']] = $result;

    $statusColor = match(true) {
        $result['http_code'] >= 200 && $result['http_code'] < 300 && $result['is_json'] => "\033[32m",
        $result['http_code'] >= 200 && $result['http_code'] < 300                       => "\033[33m",
        $result['http_code'] === 401 || $result['http_code'] === 403                    => "\033[33m",
        default => "\033[31m",
    };

    $jsonFlag = $result['is_json'] ? " \033[32m[JSON OK]\033[0m" : " \033[31m[BUKAN JSON]\033[0m";
    echo "  {$ep['label']}\n";
    echo "    URL      : {$result['url']}\n";
    echo "    HTTP     : {$statusColor}{$result['http_code']}\033[0m{$jsonFlag}\n";
    echo "    Diagnosis: {$result['diagnosis']}\n";

    if ($VERBOSE && !$result['is_json'] && !empty($result['raw'])) {
        echo "    Raw (300c): " . mb_substr(preg_replace('/\s+/', ' ', $result['raw']), 0, 300) . "\n";
    }

    if ($result['is_json']) {
        $anyJsonEndpoint = true;
        $decoded = json_decode($result['raw'], true);
        echo "    Keys     : " . implode(', ', array_keys($decoded)) . "\n";
    }

    echo "\n";
}

// ─── PHASE 2: Kesimpulan diagnosa ─────────────────────────────────────────────

echo "\033[1m[PHASE 2] Diagnosis masalah\033[0m\n\n";

$impactProbe = $probeReport['POST /v1/impact/calculate'];
$orcidProbe  = $probeReport['POST /v1/analyze/orcid'];

if (!$anyJsonEndpoint) {
    echo "\033[31m  MASALAH KRITIS: Tidak ada satu pun endpoint yang mengembalikan JSON.\033[0m\n\n";

    // Diagnosa berdasarkan HTTP code
    if ($impactProbe['http_code'] === 0 || !empty($impactProbe['curl_error'])) {
        err("Tidak bisa connect ke api.sangia.org. cURL error: {$impactProbe['curl_error']}");
        info("Cek apakah server api.sangia.org aktif dan bisa diakses dari GitHub Actions runner.");
    } elseif ($impactProbe['http_code'] === 404) {
        err("HTTP 404 — endpoint /v1/impact/calculate tidak ada.");
        info("Kemungkinan penyebab:");
        info("  1. Endpoint belum diimplementasikan di wizdam-apis");
        info("  2. URL base salah — mungkin harusnya /api/v1/ bukan /v1/");
        info("  3. Router wizdam-apis tidak mengenali path ini");
        info("Cek: apakah ada file index.php atau router di api.sangia.org yang handle /v1/impact/calculate ?");
    } elseif ($impactProbe['http_code'] === 401 || $impactProbe['http_code'] === 403) {
        warn("HTTP {$impactProbe['http_code']} — endpoint ada tapi auth gagal.");
        info("Cek WIZDAM_API_KEY di GitHub Secrets. Key yang digunakan: '" . mb_substr($apiKey, 0, 8) . "...'");
        info("Tambahkan secret di: GitHub repo → Settings → Secrets → WIZDAM_API_KEY_STAGING");
    } elseif ($impactProbe['http_code'] === 500) {
        err("HTTP 500 — server error saat endpoint dipanggil.");
        info("Cek error log PHP di server api.sangia.org.");
    } elseif (str_contains($impactProbe['diagnosis'], 'HTML')) {
        err("Endpoint mengembalikan HTML — routing belum dikonfigurasi untuk JSON API.");
        info("Kemungkinan: Apache/Nginx tidak route request ke script PHP yang benar.");
        info("Cek konfigurasi .htaccess atau nginx.conf di api.sangia.org.");
    }

    echo "\n";
    echo "\033[1m  Langkah selanjutnya yang HARUS dilakukan:\033[0m\n";
    echo "  1. Jalankan: php tools/contract_selftest.php --diagnose --verbose\n";
    echo "     untuk melihat raw response penuh dari setiap endpoint.\n\n";
    echo "  2. Akses langsung di browser:\n";
    echo "     " . rtrim($apiBaseUrl, '/') . "/impact/calculate\n";
    echo "     Jika dapat HTML → routing belum benar.\n\n";
    echo "  3. Cek apakah endpoint memang SUDAH ada di wizdam-apis:\n";
    echo "     Cari file yang menghandle 'impact/calculate' atau 'analyze/orcid'\n";
    echo "     di repo wizdam-apis. Jika belum ada → perlu dibuat dulu.\n\n";
    echo "  4. Update WIZDAM_API_URL di .env atau GitHub Secrets ke URL yang tepat.\n";
    echo "     Contoh: WIZDAM_API_URL=https://api.sangia.org (tanpa /v1/)\n\n";
} else {
    warn("Beberapa endpoint merespons JSON. Contract check akan dilanjutkan untuk endpoint yang aktif.");
}

// ─── PHASE 3: Contract validation (hanya endpoint yang JSON) ─────────────────

echo "\033[1m[PHASE 3] Contract validation (hanya untuk endpoint yang merespons JSON)\033[0m\n\n";

$validator   = WizdamApiContractValidator::getInstance();
$anyTestRan  = false;

foreach ($probeReport as $label => $probe) {
    if (!$probe['is_json']) continue;

    $anyTestRan = true;
    echo "  \033[4m$label\033[0m\n";

    runTest("Envelope valid (status field ada)", function () use ($validator, $probe, $label) {
        // Deteksi tipe endpoint dari label dan validasi
        if (str_contains($label, 'impact')) {
            $validator->validateImpactCalculate($probe['raw']);
        } elseif (str_contains($label, 'orcid') || str_contains($label, 'researcher')) {
            $validator->validateOrcidAnalysis($probe['raw']);
        } elseif (str_contains($label, 'doi') || str_contains($label, 'article')) {
            $validator->validateDoiAnalysis($probe['raw']);
        } else {
            // Generic: cek minimal envelope
            $decoded = json_decode($probe['raw'], true);
            if (!isset($decoded['status'])) {
                throw new WizdamContractException("Field 'status' tidak ada di envelope");
            }
        }
    });
    echo "\n";
}

if (!$anyTestRan) {
    warn("Tidak ada endpoint yang merespons JSON — contract validation dilewati.");
    warn("Semua test dihitung sebagai FAIL karena kondisi prasyarat tidak terpenuhi.\n");
    $hasFailure = true;
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

echo str_repeat('─', 52) . "\n";
echo "\033[1mRingkasan\033[0m\n\n";

if (!empty($results)) {
    $pass = count(array_filter($results, fn($r) => $r === 'PASS'));
    $fail = count(array_filter($results, fn($r) => str_starts_with($r, 'FAIL')));
    $skip = count(array_filter($results, fn($r) => $r === 'SKIP'));

    foreach ($results as $name => $status) {
        $color = match (true) {
            $status === 'PASS'               => "\033[32m",
            str_starts_with($status, 'FAIL') => "\033[31m",
            default                           => "\033[33m",
        };
        echo "  {$color}{$status}\033[0m  $name\n";
    }
    echo "\n  Total: {$pass} pass, {$fail} fail, {$skip} skip\n";
} else {
    echo "  Tidak ada test kontrak yang berjalan.\n";
}

if ($hasFailure) {
    echo "\n\033[31m✗ Contract check GAGAL\033[0m\n\n";
    echo "  Jalankan dengan --verbose untuk detail raw response:\n";
    echo "  php tools/contract_selftest.php --verbose\n\n";
    exit(1);
} else {
    echo "\n\033[32m✓ Semua contract check LULUS\033[0m\n\n";
    exit(0);
}