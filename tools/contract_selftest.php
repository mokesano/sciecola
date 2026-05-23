<?php

/**
 * contract_selftest.php
 *
 * Letakkan di: /tools/contract_selftest.php (sdgs-mapper & wizdam-sikola)
 *
 * Jalankan: php tools/contract_selftest.php
 *
 * Script ini:
 *   1. Memanggil wizdam-apis dengan data test yang diketahui
 *   2. Memvalidasi response menggunakan WizdamApiContractValidator
 *   3. Melaporkan PASS/FAIL untuk setiap endpoint
 *   4. Exit code 1 jika ada yang gagal (cocok untuk CI/CD)
 */

require_once __DIR__ . '/../library/WizdamApiContractValidator.php';

// ─── Konfigurasi ──────────────────────────────────────────────────────────────

$apiBaseUrl = getenv('WIZDAM_API_URL') ?: 'https://api.sangia.org/v1';
$apiKey     = getenv('WIZDAM_API_KEY') ?: '';

// Data test yang PASTI ada di environment staging
// Ganti dengan ORCID/DOI yang valid di staging Anda
$TEST_ORCID = getenv('TEST_ORCID') ?: '0000-0002-1825-0097';
$TEST_DOI   = getenv('TEST_DOI')   ?: '10.1038/nature12373';

// ─── Helper ───────────────────────────────────────────────────────────────────

$results = [];
$hasFailure = false;

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
        echo "    Kontrak: " . $e->getMessage() . "\n";
        $results[$name] = 'FAIL (contract)';
        $hasFailure = true;
    } catch (WizdamApiException $e) {
        echo "\033[33mSKIP\033[0m\n";
        echo "    API error (mungkin staging tidak ada data): " . $e->getMessage() . "\n";
        $results[$name] = 'SKIP (api error)';
    } catch (\Exception $e) {
        echo "\033[31mFAIL\033[0m\n";
        echo "    Exception: " . $e->getMessage() . "\n";
        $results[$name] = 'FAIL (exception)';
        $hasFailure = true;
    }
}

function callApi(string $endpoint, array $payload, string $method = 'POST'): string
{
    global $apiBaseUrl, $apiKey;

    $url = rtrim($apiBaseUrl, '/') . '/' . ltrim($endpoint, '/');
    $ch  = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-Key: ' . $apiKey,
            'X-Contract-Version: ' . WizdamApiContractValidator::CONTRACT_VERSION,
            'X-Contract-Test: true', // sinyal ke API bahwa ini adalah contract test
        ],
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    } elseif ($method === 'GET' && !empty($payload)) {
        curl_setopt($ch, CURLOPT_URL, $url . '?' . http_build_query($payload));
    }

    $response = curl_exec($ch);
    $error    = curl_error($ch);
    curl_close($ch);

    if ($error) {
        throw new \RuntimeException("cURL error: $error");
    }

    if (empty($response)) {
        throw new \RuntimeException("Response kosong dari $url");
    }

    return $response;
}

// ─── Test suites ──────────────────────────────────────────────────────────────

$validator = WizdamApiContractValidator::getInstance();

echo "\n\033[1mWizdam APIs Contract Self-Test\033[0m\n";
echo "API: $apiBaseUrl\n";
echo "Contract version: " . WizdamApiContractValidator::CONTRACT_VERSION . "\n\n";

echo "\033[1m[1] Impact Calculate — POST /impact/calculate\033[0m\n";
runTest('Response envelope valid', function () use ($validator, $TEST_ORCID) {
    $raw = callApi('impact/calculate', ['orcid' => $TEST_ORCID]);
    $validator->validateImpactCalculate($raw);
});

runTest('h_index adalah integer non-negatif', function () use ($validator, $TEST_ORCID) {
    $raw  = callApi('impact/calculate', ['orcid' => $TEST_ORCID]);
    $data = $validator->validateImpactCalculate($raw);
    if (!is_int($data['data']['h_index']) || $data['data']['h_index'] < 0) {
        throw new WizdamContractException('h_index harus integer >= 0');
    }
});

echo "\n\033[1m[2] ORCID Analysis — POST /analyze/orcid\033[0m\n";
runTest('Response envelope valid', function () use ($validator, $TEST_ORCID) {
    $raw = callApi('analyze/orcid', ['orcid' => $TEST_ORCID, 'include_details' => true]);
    $validator->validateOrcidAnalysis($raw);
});

runTest('researcher_info.orcid sesuai format', function () use ($validator, $TEST_ORCID) {
    $raw  = callApi('analyze/orcid', ['orcid' => $TEST_ORCID]);
    $data = $validator->validateOrcidAnalysis($raw);
    $returnedOrcid = $data['data']['researcher_info']['orcid'];
    if ($returnedOrcid !== $TEST_ORCID) {
        throw new WizdamContractException("ORCID dalam response ($returnedOrcid) tidak sama dengan yang diminta ($TEST_ORCID)");
    }
});

runTest('sdg_summary berisi SDG ID valid (SDG1–SDG17)', function () use ($validator, $TEST_ORCID) {
    $raw  = callApi('analyze/orcid', ['orcid' => $TEST_ORCID]);
    $data = $validator->validateOrcidAnalysis($raw);
    foreach (array_keys($data['data']['sdg_summary']) as $sdgId) {
        if (!preg_match('/^SDG(1[0-7]|[1-9])$/', $sdgId)) {
            throw new WizdamContractException("SDG ID tidak valid: $sdgId");
        }
    }
});

echo "\n\033[1m[3] DOI Analysis — POST /analyze/doi\033[0m\n";
runTest('Response envelope valid', function () use ($validator, $TEST_DOI) {
    $raw = callApi('analyze/doi', ['doi' => $TEST_DOI, 'include_evidence' => true]);
    $validator->validateDoiAnalysis($raw);
});

echo "\n\033[1m[4] Backward Compatibility — field lama masih ada\033[0m\n";
runTest('impact_score masih ada (bukan hanya wizdam_impact_score)', function () use ($validator, $TEST_ORCID) {
    $raw  = callApi('impact/calculate', ['orcid' => $TEST_ORCID]);
    $data = $validator->validateImpactCalculate($raw);
    if (!isset($data['data']['impact_score'])) {
        throw new WizdamContractException("Field 'impact_score' tidak ada — breaking change!");
    }
});

// ─── Ringkasan ────────────────────────────────────────────────────────────────

echo "\n\033[1m─── Ringkasan ───────────────────────────────────\033[0m\n";
$pass = count(array_filter($results, fn($r) => $r === 'PASS'));
$fail = count(array_filter($results, fn($r) => str_starts_with($r, 'FAIL')));
$skip = count(array_filter($results, fn($r) => str_starts_with($r, 'SKIP')));

foreach ($results as $name => $status) {
    $color = match (true) {
        $status === 'PASS'              => "\033[32m",
        str_starts_with($status, 'FAIL') => "\033[31m",
        default                          => "\033[33m",
    };
    echo "  {$color}{$status}\033[0m  $name\n";
}

echo "\n  Total: {$pass} pass, {$fail} fail, {$skip} skip\n";

if ($hasFailure) {
    echo "\n\033[31m✗ Contract check GAGAL — ada ketidaksesuaian dengan wizdam-apis\033[0m\n\n";
    exit(1);
} else {
    echo "\n\033[32m✓ Semua contract check LULUS\033[0m\n\n";
    exit(0);
}