<?php
declare(strict_types=1);

/**
 * @file api/wrapper/become_sponsor.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Become Sponsor API - Manages sponsorship applications and related information.
 * This API serves both public data (tiers, testimonials, stats) and handles sponsorship applications.
 * 
 * Endpoints:
 * GET  /api/wrapper/become_sponsor.php?action=tiers        → list of tiers + counts
 * GET  /api/wrapper/become_sponsor.php?action=testimonials → top sponsor testimonials
 * GET  /api/wrapper/become_sponsor.php?action=stats        → coverage stats
 * POST /api/wrapper/become_sponsor.php?action=apply        → insert sponsorship application
 *
 * Tables: sponsors, sponsor_categories, sponsorship_applications
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $action = $_GET['action'] ?? 'tiers';
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST' || $action === 'apply') {
        echo json_encode(handleApplication());
        exit;
    }

    switch ($action) {
        case 'tiers':
            echo json_encode(['status' => 'success', 'data' => fetchTiers()]);
            break;
        case 'testimonials':
            $limit = min(10, max(1, (int)($_GET['limit'] ?? 3)));
            echo json_encode(['status' => 'success', 'data' => fetchTestimonials($limit)]);
            break;
        case 'stats':
            echo json_encode(['status' => 'success', 'data' => fetchStats()]);
            break;
        default:
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/* ─── tiers ──────────────────────────────────────────────────────────────── */

function defaultTiers(): array
{
    return [
        ['id' => 'platinum', 'name' => 'Platinum', 'price_label' => 'Custom', 'level' => 4, 'highlight' => true,  'sponsor_count' => 0],
        ['id' => 'gold',     'name' => 'Gold',     'price_label' => 'Custom', 'level' => 3, 'highlight' => false, 'sponsor_count' => 0],
        ['id' => 'silver',   'name' => 'Silver',   'price_label' => 'Custom', 'level' => 2, 'highlight' => false, 'sponsor_count' => 0],
        ['id' => 'bronze',   'name' => 'Bronze',   'price_label' => 'Custom', 'level' => 1, 'highlight' => false, 'sponsor_count' => 0],
    ];
}

function fetchTiers(): array
{
    $tiers = defaultTiers();
    if (!defined('DB_HOST') || !DB_HOST) return $tiers;

    try {
        $pdo = pdo();
        $stmt = $pdo->query(
            'SELECT tier, COUNT(*) AS cnt FROM sponsors
             WHERE is_active = 1 GROUP BY tier'
        );
        $counts = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $counts[$r['tier']] = (int)$r['cnt'];
        }
        foreach ($tiers as &$t) {
            $t['sponsor_count'] = $counts[$t['id']] ?? 0;
        }
    } catch (Exception $e) { /* fall through with defaults */ }

    return $tiers;
}

/* ─── testimonials (existing sponsors with descriptions) ─────────────────── */

function fetchTestimonials(int $limit): array
{
    if (!defined('DB_HOST') || !DB_HOST) return [];

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare(
            "SELECT id, organization, tier, logo_url, description, website,
                    YEAR(since_date) AS since_year
             FROM sponsors
             WHERE is_active = 1 AND description IS NOT NULL AND description <> ''
             ORDER BY FIELD(tier,'platinum','gold','silver','bronze'), since_date ASC
             LIMIT ?"
        );
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn (array $r): array => [
            'id'           => (int)$r['id'],
            'organization' => $r['organization'],
            'tier'         => $r['tier'],
            'logo'         => $r['logo_url'],
            'quote'        => $r['description'],
            'website'      => $r['website'],
            'since'        => (int)$r['since_year'],
        ], $rows);
    } catch (Exception $e) {
        return [];
    }
}

/* ─── coverage stats ─────────────────────────────────────────────────────── */

function fetchStats(): array
{
    $defaults = [
        'active_sponsors'  => 0,
        'researcher_reach' => 0,
        'countries_count'  => 0,
        'publications'     => 0,
    ];
    if (!defined('DB_HOST') || !DB_HOST) return $defaults;

    try {
        $pdo = pdo();
        return [
            'active_sponsors'  => (int)$pdo->query('SELECT COUNT(*) FROM sponsors WHERE is_active=1')->fetchColumn(),
            'researcher_reach' => (int)$pdo->query('SELECT COUNT(*) FROM researchers')->fetchColumn(),
            'countries_count'  => (int)$pdo->query('SELECT COUNT(DISTINCT country) FROM researchers WHERE country IS NOT NULL AND country <> ""')->fetchColumn(),
            'publications'     => (int)$pdo->query('SELECT COUNT(*) FROM publications')->fetchColumn(),
        ];
    } catch (Exception $e) {
        return $defaults;
    }
}

/* ─── POST: insert application ──────────────────────────────────────────── */

function handleApplication(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) $data = $_POST;

    $organization  = trim((string)($data['organization_name'] ?? ''));
    $contactName   = trim((string)($data['contact_name']      ?? ''));
    $email         = trim((string)($data['email']             ?? ''));
    $phone         = trim((string)($data['phone']             ?? ''));
    $website       = trim((string)($data['website']           ?? ''));
    $country       = trim((string)($data['country']           ?? ''));
    $orgType       = trim((string)($data['organization_type'] ?? ''));
    $tier          = strtolower(trim((string)($data['tier']   ?? '')));
    $message       = trim((string)($data['message']           ?? ''));
    $newsletter    = !empty($data['newsletter']);
    $privacy       = !empty($data['privacy']);

    /* validation */
    $errors = [];
    if ($organization === '')                                  $errors['organization_name'] = 'required';
    if ($orgType === '')                                       $errors['organization_type'] = 'required';
    if ($contactName === '')                                   $errors['contact_name']      = 'required';
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email']       = 'invalid';
    if (!in_array($tier, ['platinum','gold','silver','bronze'], true)) $errors['tier']      = 'invalid';
    if (strlen($message) < 20)                                 $errors['message']           = 'too_short';
    if (!$privacy)                                             $errors['privacy']           = 'required';

    if (!empty($errors)) {
        http_response_code(422);
        return ['status' => 'error', 'message' => 'Validation failed', 'errors' => $errors];
    }

    $descBlocks = [];
    if ($orgType !== '') $descBlocks[] = "Type: $orgType";
    if ($country !== '') $descBlocks[] = "Country: $country";
    if ($newsletter)     $descBlocks[] = 'Newsletter: yes';
    $description = implode(' | ', $descBlocks);

    if (!defined('DB_HOST') || !DB_HOST) {
        return [
            'status'  => 'success',
            'message' => 'Application accepted (no DB configured — stored locally only).',
            'application_id' => null,
        ];
    }

    try {
        $pdo = pdo();
        $stmt = $pdo->prepare(
            'INSERT INTO sponsorship_applications
                (organization, contact_name, contact_email, contact_phone,
                 tier, website, description, motivation, status, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        $stmt->execute([
            $organization, $contactName, $email, $phone ?: null,
            $tier, $website ?: null, $description ?: null, $message, 'pending',
        ]);
        return [
            'status'         => 'success',
            'message'        => 'Application submitted successfully.',
            'application_id' => (int)$pdo->lastInsertId(),
        ];
    } catch (Exception $e) {
        http_response_code(500);
        return ['status' => 'error', 'message' => 'Failed to save application: ' . $e->getMessage()];
    }
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function pdo(): PDO
{
    return new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
        DB_USERNAME, DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
}
