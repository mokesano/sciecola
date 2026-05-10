<?php
/**
 * Auth API
 * POST /api/auth.php { action:"login", email, password, orcid? }
 * GET  /api/auth.php?action=me            (with X-Auth-Token header)
 * POST /api/auth.php { action:"logout" }
 * POST /api/auth.php { action:"link_orcid", orcid, token }
 *
 * Session storage: /cache/sessions/{token}.json  (file-based, no DB required)
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;

$sessionsDir = ROOT_PATH . '/cache/sessions';
if (!is_dir($sessionsDir)) @mkdir($sessionsDir, 0750, true);

$body = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? $_POST;
}
$action = $body['action'] ?? $_GET['action'] ?? 'me';

// ── helpers ──────────────────────────────────────────────────────────────────

function getToken(): ?string {
    $h = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $h = trim(str_replace('Bearer ', '', $h));
    if ($h) return $h;
    return $_COOKIE['sciecola_token'] ?? $_GET['token'] ?? null;
}

function loadSession(string $dir, string $token): ?array {
    $file = $dir . '/' . preg_replace('/[^a-f0-9]/i', '', $token) . '.json';
    if (!file_exists($file)) return null;
    $data = json_decode(file_get_contents($file), true);
    if (!$data) return null;
    if (isset($data['expires_at']) && time() > strtotime($data['expires_at'])) {
        @unlink($file);
        return null;
    }
    return $data;
}

function saveSession(string $dir, string $token, array $data): void {
    $file = $dir . '/' . preg_replace('/[^a-f0-9]/i', '', $token) . '.json';
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE));
}

function deleteSession(string $dir, string $token): void {
    $file = $dir . '/' . preg_replace('/[^a-f0-9]/i', '', $token) . '.json';
    @unlink($file);
}

function newToken(): string {
    return bin2hex(random_bytes(32));
}

// ── actions ──────────────────────────────────────────────────────────────────

switch ($action) {

    case 'login':
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $orcid    = trim($body['orcid'] ?? '');

        if (empty($email) && empty($orcid)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'email atau orcid diperlukan']);
            exit;
        }

        /*
         * Production: validate email+password against users table.
         * For now: accept any non-empty credentials and use provided ORCID.
         * The ORCID profile will be fetched from researcher_profile.php.
         */
        if (empty($orcid) && !preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
            $orcid = null;
        }

        $token = newToken();
        $session = [
            'token'      => $token,
            'email'      => $email,
            'orcid'      => $orcid,
            'name'       => $body['name'] ?? '',
            'created_at' => date('c'),
            'expires_at' => date('c', strtotime('+30 days')),
        ];

        saveSession($sessionsDir, $token, $session);

        echo json_encode([
            'status' => 'success',
            'token'  => $token,
            'user'   => [
                'email' => $session['email'],
                'orcid' => $session['orcid'],
                'name'  => $session['name'],
            ],
        ]);
        break;

    case 'me':
        $token = getToken();
        if (!$token) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Unauthenticated']); exit; }

        $session = loadSession($sessionsDir, $token);
        if (!$session) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Token tidak valid atau kadaluarsa']); exit; }

        echo json_encode(['status' => 'success', 'user' => [
            'email' => $session['email'],
            'orcid' => $session['orcid'],
            'name'  => $session['name'],
        ]]);
        break;

    case 'link_orcid':
        $token = $body['token'] ?? getToken();
        $orcid = trim($body['orcid'] ?? '');

        if (!$token) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Token diperlukan']); exit; }
        if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', $orcid)) {
            http_response_code(400); echo json_encode(['status'=>'error','message'=>'Format ORCID tidak valid']); exit;
        }

        $session = loadSession($sessionsDir, $token);
        if (!$session) { http_response_code(401); echo json_encode(['status'=>'error','message'=>'Token tidak valid']); exit; }

        $session['orcid'] = $orcid;
        saveSession($sessionsDir, $token, $session);

        echo json_encode(['status' => 'success', 'orcid' => $orcid]);
        break;

    case 'logout':
        $token = getToken();
        if ($token) deleteSession($sessionsDir, $token);
        echo json_encode(['status' => 'success']);
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Action tidak dikenali: $action"]);
}
