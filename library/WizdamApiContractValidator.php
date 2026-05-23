<?php

/**
 * WizdamApiContractValidator.php
 *
 * Letakkan di: /library/WizdamApiContractValidator.php (sdgs-mapper)
 *              /library/WizdamApiContractValidator.php (wizdam-sikola)
 *
 * Memvalidasi response dari api.sangia.org sebelum diproses aplikasi.
 * Jika response tidak sesuai kontrak, exception dilempar dan di-log —
 * bukan silent failure yang sulit dilacak.
 *
 * Penggunaan:
 *   $validator = WizdamApiContractValidator::getInstance();
 *   $data = $validator->validateOrcidAnalysis($responseJson);
 */

class WizdamApiContractValidator
{
    /** @var self|null */
    private static ?self $instance = null;

    /** Versi kontrak yang diharapkan. Tambahkan versi baru saat ada perubahan breaking. */
    const CONTRACT_VERSION = '1.0.0';

    /** Path ke log file — sesuaikan dengan konfigurasi project Anda */
    const LOG_FILE = __DIR__ . '/../logs/contract_violations.log';

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC METHODS — satu per tipe response
    // ─────────────────────────────────────────────────────────────

    /**
     * Validasi response POST /api/v1/analyze/orcid
     * atau GET /api/researcher_profile.php
     *
     * @param string $rawJson
     * @return array Data yang sudah tervalidasi
     * @throws WizdamContractException
     */
    public function validateOrcidAnalysis(string $rawJson): array
    {
        $decoded = $this->decodeAndCheckEnvelope($rawJson, 'OrcidAnalysis');

        $data = $decoded['data'];
        $this->requireKeys($data, ['researcher_info', 'sdg_summary', 'works'], 'data');

        $ri = $data['researcher_info'];
        $this->requireKeys($ri, ['name', 'orcid'], 'researcher_info');
        $this->assertType($ri['name'], 'string', 'researcher_info.name');
        $this->assertOrcidFormat($ri['orcid']);

        $this->assertType($data['sdg_summary'], 'array', 'sdg_summary');
        foreach ($data['sdg_summary'] as $sdgId => $summary) {
            $this->assertSdgId($sdgId);
            $this->requireKeys($summary, ['work_count', 'avg_confidence'], "sdg_summary.$sdgId");
        }

        $this->assertType($data['works'], 'array', 'works');
        foreach ($data['works'] as $i => $work) {
            $this->assertWorkItem($work, "works[$i]");
        }

        if (isset($data['impact_metrics'])) {
            $this->assertImpactMetrics($data['impact_metrics']);
        }

        return $decoded;
    }

    /**
     * Validasi response POST /api/v1/analyze/doi
     *
     * @throws WizdamContractException
     */
    public function validateDoiAnalysis(string $rawJson): array
    {
        $decoded = $this->decodeAndCheckEnvelope($rawJson, 'DoiAnalysis');
        $data = $decoded['data'];

        $this->requireKeys($data, ['work'], 'data');
        $this->assertWorkItem($data['work'], 'work');

        return $decoded;
    }

    /**
     * Validasi response POST /api/v1/impact/calculate
     *
     * @throws WizdamContractException
     */
    public function validateImpactCalculate(string $rawJson): array
    {
        $decoded = $this->decodeAndCheckEnvelope($rawJson, 'ImpactCalculate');
        $data = $decoded['data'];

        $this->assertImpactMetrics($data);

        return $decoded;
    }

    /**
     * Validasi response async job (status polling)
     *
     * @throws WizdamContractException
     */
    public function validateAsyncJob(string $rawJson): array
    {
        $decoded = $this->decodeAndCheckEnvelope($rawJson, 'AsyncJob');
        $data = $decoded['data'];

        $this->requireKeys($data, ['job_id', 'status'], 'data');
        $this->assertIn($data['status'], ['pending', 'running', 'completed', 'failed'], 'data.status');

        return $decoded;
    }

    // ─────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Decode JSON dan validasi struktur envelope standar.
     *
     * @throws WizdamContractException
     */
    private function decodeAndCheckEnvelope(string $rawJson, string $context): array
    {
        $decoded = json_decode($rawJson, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->violation("$context: JSON tidak valid — " . json_last_error_msg(), $rawJson);
        }

        if (!is_array($decoded)) {
            $this->violation("$context: Response bukan object/array", $rawJson);
        }

        if (!isset($decoded['status'])) {
            $this->violation("$context: Field 'status' tidak ada di envelope", $rawJson);
        }

        $validStatuses = ['success', 'error', 'pending'];
        if (!in_array($decoded['status'], $validStatuses, true)) {
            $this->violation(
                "$context: 'status' harus salah satu dari [" . implode(', ', $validStatuses) . "], dapat: '{$decoded['status']}'",
                $rawJson
            );
        }

        if ($decoded['status'] === 'error') {
            // Error response dari API — bukan kontrak violation, tapi perlu dilempar
            $message = $decoded['message'] ?? 'API mengembalikan error tanpa pesan';
            throw new WizdamApiException($message, $decoded['error_code'] ?? 'UNKNOWN_ERROR');
        }

        if ($decoded['status'] === 'success' && !isset($decoded['data'])) {
            $this->violation("$context: status=success tapi tidak ada field 'data'", $rawJson);
        }

        return $decoded;
    }

    private function assertImpactMetrics(array $data): void
    {
        $this->requireKeys($data, ['h_index', 'citations', 'impact_score'], 'impact_metrics');
        $this->assertType($data['h_index'], 'integer', 'impact_metrics.h_index');
        $this->assertType($data['citations'], 'integer', 'impact_metrics.citations');
        $this->assertType($data['impact_score'], 'numeric', 'impact_metrics.impact_score');
    }

    private function assertWorkItem(array $work, string $path): void
    {
        $this->requireKeys($work, ['title'], $path);
        $this->assertType($work['title'], 'string', "$path.title");

        if (isset($work['confidence_scores'])) {
            foreach ($work['confidence_scores'] as $sdgId => $score) {
                $this->assertSdgId($sdgId, "$path.confidence_scores");
                if (!is_numeric($score) || $score < 0 || $score > 1) {
                    $this->violation("$path.confidence_scores.$sdgId: Confidence harus angka 0–1, dapat: $score");
                }
            }
        }
    }

    private function assertOrcidFormat(string $orcid): void
    {
        if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
            $this->violation("researcher_info.orcid: Format ORCID tidak valid, dapat: '$orcid'");
        }
    }

    private function assertSdgId(string $sdgId, string $path = 'sdg_summary'): void
    {
        if (!preg_match('/^SDG(1[0-7]|[1-9])$/', $sdgId)) {
            $this->violation("$path: SDG ID tidak valid, dapat: '$sdgId'. Harus SDG1–SDG17");
        }
    }

    private function requireKeys(array $data, array $keys, string $path): void
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data)) {
                $this->violation("$path: Field wajib '$key' tidak ditemukan. Ada: " . implode(', ', array_keys($data)));
            }
        }
    }

    private function assertType(mixed $value, string $type, string $path): void
    {
        $ok = match ($type) {
            'string'  => is_string($value),
            'integer' => is_int($value),
            'numeric' => is_numeric($value),
            'array'   => is_array($value),
            'bool'    => is_bool($value),
            default   => false,
        };

        if (!$ok) {
            $actual = gettype($value);
            $this->violation("$path: Diharapkan $type, dapat $actual (nilai: " . json_encode($value) . ")");
        }
    }

    private function assertIn(mixed $value, array $allowed, string $path): void
    {
        if (!in_array($value, $allowed, true)) {
            $this->violation("$path: Nilai '$value' tidak ada di [" . implode(', ', $allowed) . "]");
        }
    }

    /**
     * Log violation dan lempar exception.
     * Mode soft: jika WIZDAM_STRICT_CONTRACT=false di env, hanya log tanpa throw.
     *
     * @throws WizdamContractException
     */
    private function violation(string $message, string $rawResponse = ''): void
    {
        $logEntry = sprintf(
            "[%s] CONTRACT VIOLATION | %s | raw: %s\n",
            date('Y-m-d H:i:s'),
            $message,
            mb_substr($rawResponse, 0, 500)
        );

        $logDir = dirname(self::LOG_FILE);
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        @file_put_contents(self::LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);

        $strictMode = getenv('WIZDAM_STRICT_CONTRACT') !== 'false';
        if ($strictMode) {
            throw new WizdamContractException($message);
        }

        // Soft mode: hanya log, tidak throw
        error_log("Wizdam Contract (soft mode): $message");
    }
}


/**
 * Dilempar saat response tidak sesuai kontrak.
 * Tangkap di caller untuk fallback graceful.
 */
class WizdamContractException extends \RuntimeException
{
    public function __construct(string $message)
    {
        parent::__construct("[Wizdam Contract] $message");
    }
}

/**
 * Dilempar saat API mengembalikan status=error.
 * Berbeda dari ContractException — ini error bisnis, bukan struktural.
 */
class WizdamApiException extends \RuntimeException
{
    private string $errorCode;

    public function __construct(string $message, string $errorCode = 'UNKNOWN_ERROR')
    {
        $this->errorCode = $errorCode;
        parent::__construct($message);
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}