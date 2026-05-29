<?php
declare(strict_types=1);

/**
 * @file api/researcher_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Endpoint untuk mengambil profil peneliti.
 * 
 * researcher_profile.php — dengan integrasi WizdamApiContractValidator
 *
 * Ini adalah CONTOH PATCH untuk file yang sudah ada di sdgs-mapper.
 * Tambahkan blok require + try-catch di bawah ini ke dalam kode asli Anda.
 *
 * Letak file: /api/researcher_profile.php
 */

require_once __DIR__ . '/../library/WizdamApiContractValidator.php';

// ─── Fungsi helper untuk memanggil Wizdam API ────────────────────────────────

/**
 * Ganti fungsi pemanggil cURL Anda yang sudah ada dengan wrapper ini.
 * Semua response dari api.sangia.org harus melewati validator sebelum diproses.
 */
function callWizdamApiWithValidation(
    string $endpoint,
    array $payload,
    string $method = 'POST'
): array {

    $apiBaseUrl = defined('WIZDAM_API_URL')
        ? WIZDAM_API_URL
        : getenv('WIZDAM_API_URL') ?? 'https://api.sangia.org/v1';

    $apiKey = defined('WIZDAM_API_KEY')
        ? WIZDAM_API_KEY
        : getenv('WIZDAM_API_KEY') ?? '';

    // — cURL request ———————————————————————————————————————————————
    $ch = curl_init();
    $url = rtrim($apiBaseUrl, '/') . '/' . ltrim($endpoint, '/');

    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            'X-API-Key: ' . $apiKey,
            'X-Contract-Version: ' . WizdamApiContractValidator::CONTRACT_VERSION,
        ],
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    }

    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError   = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new \RuntimeException("cURL error ke $url: $curlError");
    }

    if ($httpCode === 429) {
        throw new WizdamApiException('Rate limit tercapai, coba lagi nanti', 'RATE_LIMITED');
    }

    if ($httpCode >= 500) {
        throw new WizdamApiException("Server error $httpCode dari Wizdam APIs", 'SERVER_ERROR');
    }

    // — Validasi kontrak ———————————————————————————————————————————
    $validator = WizdamApiContractValidator::getInstance();

    $validated = match ($endpoint) {
        'analyze/orcid',
        'researcher_profile'   => $validator->validateOrcidAnalysis($rawResponse),
        'analyze/doi',
        'article_profile'      => $validator->validateDoiAnalysis($rawResponse),
        'impact/calculate'     => $validator->validateImpactCalculate($rawResponse),
        'job/status'           => $validator->validateAsyncJob($rawResponse),
        default                => $validator->validateOrcidAnalysis($rawResponse), // fallback
    };

    return $validated['data'];
}

// ─── Contoh penggunaan di endpoint researcher_profile ────────────────────────

function fetchResearcherProfile(string $orcid): array
{
    try {
        // Panggil impact/calculate dari wizdam-apis
        $impactData = callWizdamApiWithValidation('impact/calculate', [
            'orcid' => $orcid,
        ]);

        // Panggil SDG analysis (jika Wizdam APIs juga menyediakan ini)
        $sdgData = callWizdamApiWithValidation('analyze/orcid', [
            'orcid'           => $orcid,
            'include_details' => true,
        ]);

        // Gabungkan data — field sudah tervalidasi, aman diakses langsung
        return [
            'researcher_info'  => $sdgData['researcher_info'],
            'impact_metrics'   => $impactData,
            'sdg_summary'      => $sdgData['sdg_summary'],
            'works'            => $sdgData['works'],
            'cached_at'        => date('Y-m-d H:i:s'),
        ];

    } catch (WizdamContractException $e) {
        // Kontrak dilanggar — log sudah dilakukan di dalam validator
        // Kembalikan data minimal agar UI tidak blank total
        error_log("Contract violation untuk ORCID $orcid: " . $e->getMessage());

        return [
            'researcher_info'  => ['name' => 'Data tidak tersedia', 'orcid' => $orcid],
            'impact_metrics'   => null,
            'sdg_summary'      => [],
            'works'            => [],
            '_contract_error'  => $e->getMessage(), // hanya untuk debug, jangan tampilkan ke user
        ];

    } catch (WizdamApiException $e) {
        // Error bisnis dari API (ORCID_NOT_FOUND, RATE_LIMITED, dll)
        throw $e; // biarkan caller menangani ini

    } catch (\RuntimeException $e) {
        // Network error
        throw $e;
    }
}

// ─── Contoh response ke frontend ─────────────────────────────────────────────

/*
Penggunaan di file asli:

    $orcid = $_GET['orcid'] ?? '';
    if (!$orcid) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ORCID diperlukan']);
        exit;
    }

    try {
        $profile = fetchResearcherProfile($orcid);
        echo json_encode(['status' => 'success', 'data' => $profile]);
    } catch (WizdamApiException $e) {
        http_response_code(502);
        echo json_encode([
            'status'     => 'error',
            'message'    => $e->getMessage(),
            'error_code' => $e->getErrorCode(),
        ]);
    } catch (\Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Terjadi kesalahan server']);
    }
*/