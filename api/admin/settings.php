<?php
declare(strict_types=1);

/**
 * @file api/admin/settings.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_admin
 * @brief Pengaturan Admin, status konfigurasi server, statistik dasbor, dan log audit.
 *
 * GET  /api/admin/settings.php                → { settings, config }
 * GET  /api/admin/settings.php?view=stats     → angka dasbor Admin
 * GET  /api/admin/settings.php?view=audit     → log audit admin
 * POST /api/admin/settings.php { group, values } → simpan satu grup (system|content|ui|impact)
 *
 * Kunci rahasia (SMTP, OAuth, API key) sengaja tidak bisa diubah dari web: tetap di .env,
 * sehingga akun admin yang dibobol tidak bisa membaca atau mengganti kredensial server.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\AdminGuard;
use Sciecola\Auth\Captcha;
use Sciecola\Auth\OAuthClient;
use Sciecola\Auth\UserAuth;
use Sciecola\Database\Db;
use Sciecola\Mail\MailService;
use Sciecola\Support\AppSettings;

AdminGuard::require();

function settings_respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function env_set(string $key): bool
{
    return (string) (getenv($key) ?: '') !== '';
}

/** Status konfigurasi server tanpa membuka nilainya. */
function config_status(): array
{
    $mail = MailService::getInstance();
    $appUrl = defined('APP_URL') ? (string) APP_URL : (string) (getenv('APP_URL') ?: '');
    $admins = array_filter(array_map('trim', explode(',', (string) (getenv('ADMIN_EMAILS') ?: ''))));
    $db = Db::pdo() !== null;
    return [
        ['key' => 'database',  'ok' => $db, 'detail' => $db ? (defined('DB_DATABASE') ? DB_DATABASE : '') : (Db::lastError() ?? '')],
        ['key' => 'app_url',   'ok' => $appUrl !== '' && !preg_match('#//(localhost|127\.0\.0\.1)#', $appUrl), 'detail' => $appUrl],
        ['key' => 'mail',      'ok' => $mail->deliversMail(), 'detail' => 'MAIL_DRIVER=' . $mail->driver()
            . ($mail->driver() === 'smtp' ? ' · ' . (defined('SMTP_HOST') ? SMTP_HOST : '') . ':' . (defined('SMTP_PORT') ? SMTP_PORT : '') : '')],
        ['key' => 'admin_emails', 'ok' => count($admins) > 0, 'detail' => count($admins) . ' email'],
        ['key' => 'admin_token',  'ok' => env_set('ADMIN_TOOL_TOKEN'), 'detail' => ''],
        ['key' => 'turnstile', 'ok' => Captcha::enabled(), 'detail' => ''],
        ['key' => 'orcid_oauth', 'ok' => OAuthClient::configured('orcid'),
            'detail' => in_array(strtolower((string) getenv('ORCID_SANDBOX')), ['1', 'true', 'yes', 'on'], true) ? 'sandbox' : 'production'],
        ['key' => 'google_oauth', 'ok' => OAuthClient::configured('google'), 'detail' => ''],
        ['key' => 'sangia_api', 'ok' => (defined('SANGIA_API_KEY') && SANGIA_API_KEY !== ''),
            'detail' => defined('SANGIA_API_BASE') ? SANGIA_API_BASE : ''],
        ['key' => 'scopus_api', 'ok' => env_set('SCOPUS_API_KEY'), 'detail' => ''],
    ];
}

function count_or_null(PDO $pdo, string $sql): ?int
{
    try {
        return (int) $pdo->query($sql)->fetchColumn();
    } catch (Throwable $e) {
        return null;
    }
}

try {
    $admin = UserAuth::current();

    if (AdminGuard::method() === 'GET') {
        $view = (string) ($_GET['view'] ?? 'settings');

        if ($view === 'audit') {
            settings_respond(['status' => 'success', 'entries' => AppSettings::auditLog(
                (int) ($_GET['limit'] ?? 100), (int) ($_GET['offset'] ?? 0)
            )]);
        }

        if ($view === 'stats') {
            $pdo = Db::pdo();
            if (!$pdo) settings_respond(['status' => 'error', 'message' => 'Database tidak dapat dihubungi'], 503);
            $now = gmdate('Y-m-d H:i:s');
            $day = gmdate('Y-m-d H:i:s', time() - 86400);
            settings_respond(['status' => 'success', 'stats' => [
                'users_total'      => count_or_null($pdo, 'SELECT COUNT(*) FROM user_accounts'),
                'users_active'     => count_or_null($pdo, 'SELECT COUNT(*) FROM user_accounts WHERE is_active = 1'),
                'users_unverified' => count_or_null($pdo, 'SELECT COUNT(*) FROM user_accounts WHERE email_verified = 0'),
                'users_2fa'        => count_or_null($pdo, 'SELECT COUNT(*) FROM user_security WHERE totp_enabled = 1'),
                'admins'           => count_or_null($pdo, "SELECT COUNT(*) FROM user_accounts WHERE role = 'admin'"),
                'sessions_active'  => count_or_null($pdo, "SELECT COUNT(*) FROM auth_sessions WHERE expires_at > '{$now}'"),
                'logins_failed_24h'=> count_or_null($pdo, "SELECT COUNT(*) FROM auth_attempts WHERE scope = 'login' AND created_at > '{$day}'"),
                'researchers'      => count_or_null($pdo, 'SELECT COUNT(*) FROM researchers'),
                'publications'     => count_or_null($pdo, 'SELECT COUNT(DISTINCT doi) FROM work_sdgs'),
            ], 'recent_audit' => AppSettings::auditLog(8)]);
        }

        settings_respond(['status' => 'success', 'settings' => AppSettings::all(), 'config' => config_status()]);
    }

    if (AdminGuard::method() !== 'POST') {
        settings_respond(['status' => 'error', 'message' => 'Method not allowed'], 405);
    }

    $body  = json_decode((string) file_get_contents('php://input'), true) ?: [];
    $group = (string) ($body['group'] ?? '');
    $values = is_array($body['values'] ?? null) ? $body['values'] : [];
    try {
        $change = AppSettings::save($group, $values, $admin ? (int) $admin['id'] : null);
    } catch (InvalidArgumentException $e) {
        settings_respond(['status' => 'error', 'message' => $e->getMessage()], 400);
    }
    AppSettings::audit($admin, 'settings.' . $group, $group, $change['old'], $change['new']);
    settings_respond(['status' => 'success', 'settings' => AppSettings::all()]);
} catch (Throwable $e) {
    error_log('[admin/settings] ' . $e->getMessage());
    settings_respond(['status' => 'error', 'message' => 'Pengaturan belum dapat dimuat.'], 503);
}
