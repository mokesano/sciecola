<?php
declare(strict_types=1);

/**
 * @file api/wrapper/auth.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Autentikasi: daftar, verifikasi email, masuk, 2FA, reset sandi, ORCID/Google, sesi.
 *
 * Menggantikan versi lama yang menerima email/sandi apa pun dan menyimpan sesi
 * sebagai file JSON. Sekarang akun tersimpan di user_accounts dengan hash bcrypt,
 * sesi di auth_sessions (hash token), dan cookie sesi HttpOnly.
 *
 * GET  ?action=config                       pengaturan publik (captcha, OAuth, verifikasi)
 * GET  ?action=me                           akun yang sedang login
 * POST action=register        {name,email,password,orcid?,orcid_claim?,captcha_token}
 * POST action=verify_email    {token} | {email,code}
 * POST action=resend_verification {email}
 * POST action=login           {email,password,remember,captcha_token}
 * POST action=login_2fa       {challenge,code,method:totp|recovery|email}
 * POST action=send_2fa_email  {challenge}
 * POST action=logout
 * POST action=forgot_password {email,captcha_token}
 * POST action=reset_password  {token,password}
 * POST action=change_password {current_password,new_password}
 * POST action=update_profile  {name}
 * POST action=link_orcid      {orcid}           (hanya bila ORCID OAuth belum dikonfigurasi)
 * POST action=unlink_orcid
 * POST action=twofa_setup | twofa_enable {code} | twofa_disable {password,code} | twofa_recovery {code}
 * GET  ?action=sessions  |  POST action=revoke_other_sessions
 * POST action=deactivate_account {password} | delete_account {password|confirm}
 * GET  ?action=oauth_start&provider=orcid|google&mode=login|link&next=/path
 * GET  ?action=oauth_callback&provider=...&code=...&state=...
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\AuthStore;
use Sciecola\Auth\Captcha;
use Sciecola\Auth\OAuthClient;
use Sciecola\Auth\TwoFactorAuth;
use Sciecola\Auth\UserAuth;
use Sciecola\Mail\MailService;
use Sciecola\Support\AppSettings;

const ORCID_RE          = '/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/';
const PASSWORD_MIN      = 8;
const PASSWORD_MAX_BYTES = 72; // batas bcrypt
const VERIFY_TTL        = 86400;
const RESET_TTL         = 3600;
const CHALLENGE_TTL     = 600;
const MAX_CODE_ATTEMPTS = 5;
const OAUTH_COOKIE      = 'sciecola_oauth';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$body   = [];
if ($method === 'POST') {
    $raw  = (string) file_get_contents('php://input');
    $json = json_decode($raw, true);
    $body = is_array($json) ? $json : $_POST;
}
$action = (string) ($body['action'] ?? $_GET['action'] ?? 'me');

// Aksi yang mengubah data hanya lewat POST; aksi baca & redirect OAuth lewat GET.
$getActions = ['config', 'me', 'sessions', 'oauth_start', 'oauth_callback'];
if (!in_array($action, $getActions, true) && $method !== 'POST') {
    respond(['status' => 'error', 'message' => 'Gunakan POST untuk aksi ini.'], 405);
}
if ($method === 'POST') {
    UserAuth::checkSameOrigin();
}

try {
    switch ($action) {
        case 'config':              actionConfig(); break;
        case 'me':                  actionMe(); break;
        case 'register':            actionRegister($body); break;
        case 'verify_email':        actionVerifyEmail($body); break;
        case 'resend_verification': actionResendVerification($body); break;
        case 'login':               actionLogin($body); break;
        case 'login_2fa':           actionLogin2fa($body); break;
        case 'send_2fa_email':      actionSend2faEmail($body); break;
        case 'logout':              UserAuth::endSession(); respond(['status' => 'success']); break;
        case 'forgot_password':     actionForgotPassword($body); break;
        case 'reset_password':      actionResetPassword($body); break;
        case 'change_password':     actionChangePassword($body); break;
        case 'update_profile':      actionUpdateProfile($body); break;
        case 'link_orcid':          actionLinkOrcid($body); break;
        case 'unlink_orcid':        actionUnlinkOrcid(); break;
        case 'twofa_setup':         actionTwofaSetup(); break;
        case 'twofa_enable':        actionTwofaEnable($body); break;
        case 'twofa_disable':       actionTwofaDisable($body); break;
        case 'twofa_recovery':      actionTwofaRecovery($body); break;
        case 'sessions':            actionSessions(); break;
        case 'revoke_other_sessions': actionRevokeOtherSessions(); break;
        case 'deactivate_account':  actionCloseAccount($body, false); break;
        case 'delete_account':      actionCloseAccount($body, true); break;
        case 'oauth_start':         actionOAuthStart(); break;
        case 'oauth_callback':      actionOAuthCallback(); break;
        default:
            respond(['status' => 'error', 'message' => 'Aksi tidak dikenali.'], 400);
    }
} catch (Throwable $e) {
    error_log('[auth] ' . $action . ': ' . $e->getMessage());
    respond(['status' => 'error', 'code' => 'SERVER_ERROR',
             'message' => 'Layanan akun sedang tidak tersedia. Coba lagi nanti.'], 503);
}

// =============================================================================
// Helpers
// =============================================================================

function respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $code = 400, ?string $errorCode = null, ?string $field = null, array $extra = []): void
{
    $data = ['status' => 'error', 'message' => $message];
    if ($errorCode !== null) $data['code'] = $errorCode;
    if ($field !== null) $data['field'] = $field;
    respond($data + $extra, $code);
}

function store(): AuthStore
{
    return AuthStore::get();
}

/**
 * Verifikasi email wajib bila pengaturan Admin → Sistem menyalakannya. REQUIRE_EMAIL_VERIFICATION=false
 * di .env mematikannya secara paksa (mis. server tanpa email keluar).
 */
function requireEmailVerification(): bool
{
    $v = getenv('REQUIRE_EMAIL_VERIFICATION');
    if ($v !== false && $v !== '' && in_array(strtolower((string) $v), ['0', 'false', 'no', 'off'], true)) {
        return false;
    }
    return (bool) AppSettings::get('system', 'requireEmailVerification', true);
}

function registrationOpen(): bool
{
    return (bool) AppSettings::get('system', 'allowNewRegistrations', true);
}

function validEmail(string $email): bool
{
    return strlen($email) <= 255 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function passwordProblem(string $password): ?string
{
    if (mb_strlen($password) < PASSWORD_MIN) return 'Kata sandi minimal ' . PASSWORD_MIN . ' karakter.';
    if (strlen($password) > PASSWORD_MAX_BYTES) return 'Kata sandi maksimal ' . PASSWORD_MAX_BYTES . ' karakter.';
    return null;
}

/** 429 bila jumlah percobaan dalam jendela waktu melewati batas. */
function throttle(string $scope, string $identifier, int $max, int $window): void
{
    if ($identifier === '') return;
    if (store()->countAttempts($scope, $identifier, $window) >= $max) {
        fail('Terlalu banyak percobaan. Coba lagi dalam ' . (int) ceil($window / 60) . ' menit.', 429, 'RATE_LIMITED');
    }
}

function sixDigitCode(): string
{
    return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function safeNext(?string $next): string
{
    $next = (string) $next;
    return ($next !== '' && $next[0] === '/' && !str_starts_with($next, '//') && !str_contains($next, '\\')) ? $next : '/dashboard';
}

function sendVerification(array $user): bool
{
    $code  = sixDigitCode();
    $token = store()->createToken((int) $user['id'], 'verify_email', VERIFY_TTL, [], $code);
    return MailService::getInstance()->sendEmailVerification((string) $user['email'], $token, $code);
}

function securityNotice(array $user, string $event): void
{
    try {
        MailService::getInstance()->sendSecurityNotice((string) $user['email'], $event);
    } catch (Throwable $e) {
        error_log('[auth] notice: ' . $e->getMessage());
    }
}

function loggedInResponse(array $user, array $extra = []): void
{
    respond(['status' => 'success', 'user' => UserAuth::publicUser($user)] + $extra);
}

/** Mulai sesi, atau minta kode 2FA dulu bila akun mengaktifkannya. */
function completeLogin(array $user, bool $remember, array $extra = []): void
{
    if (!empty($user['totp_enabled'])) {
        $challenge = store()->createToken((int) $user['id'], 'login_2fa', CHALLENGE_TTL, ['remember' => $remember]);
        respond(['status' => 'two_factor_required', 'challenge' => $challenge,
                 'methods' => ['totp', 'recovery', 'email']] + $extra);
    }
    UserAuth::startSession($user, $remember);
    loggedInResponse(UserAuth::current() ?? $user, $extra);
}

/**
 * Menautkan ORCID ke akun. ORCID terverifikasi (lewat OAuth) boleh mengambil alih
 * tautan tak terverifikasi milik akun lain; selain itu ORCID harus belum dipakai.
 */
function attachOrcid(int $userId, string $orcid, bool $verified, string $name = ''): ?string
{
    $orcid = strtoupper($orcid);
    $owner = store()->findUserByOrcid($orcid);
    if ($owner && (int) $owner['id'] !== $userId) {
        if ($verified && empty($owner['orcid_verified'])) {
            store()->updateUser((int) $owner['id'], ['orcid' => null]);
            store()->updateSecurity((int) $owner['id'], ['orcid_verified' => 0]);
        } else {
            return 'ORCID ini sudah ditautkan ke akun lain.';
        }
    }
    store()->ensureResearcherStub($orcid, $name);
    store()->updateUser($userId, ['orcid' => $orcid]);
    store()->updateSecurity($userId, ['orcid_verified' => $verified ? 1 : 0]);
    return null;
}

/** Memeriksa kode TOTP atau kode pemulihan; kode pemulihan yang cocok dihapus. */
function checkSecondFactor(array $user, string $code, string $method): bool
{
    $code = trim($code);
    if ($method === 'recovery') {
        $hashes = json_decode((string) ($user['recovery_codes'] ?? '[]'), true) ?: [];
        $h = AuthStore::hash(strtolower(str_replace([' ', '-'], '', $code)));
        foreach ($hashes as $i => $stored) {
            if (hash_equals((string) $stored, $h)) {
                unset($hashes[$i]);
                store()->updateSecurity((int) $user['id'], ['recovery_codes' => json_encode(array_values($hashes))]);
                return true;
            }
        }
        return false;
    }
    if (empty($user['totp_secret'])) return false;
    $last = $user['totp_last_counter'] !== null ? (int) $user['totp_last_counter'] : null;
    $counter = TwoFactorAuth::getInstance()->verifyCodeCounter((string) $user['totp_secret'], $code, $last);
    if ($counter === null) return false;
    store()->updateSecurity((int) $user['id'], ['totp_last_counter' => $counter]);
    return true;
}

/** @return array{0:array<int,string>,1:string} [kode mentah, JSON hash] */
function newRecoveryCodes(): array
{
    $codes = [];
    $hashes = [];
    for ($i = 0; $i < 10; $i++) {
        $raw = bin2hex(random_bytes(5)); // 10 karakter hex
        $codes[] = substr($raw, 0, 5) . '-' . substr($raw, 5);
        $hashes[] = AuthStore::hash($raw);
    }
    return [$codes, json_encode($hashes)];
}

/** Sandi saat ini (atau, untuk akun tanpa sandi, konfirmasi email) untuk aksi sensitif. */
function confirmIdentity(array $user, array $body): void
{
    if (!empty($user['password_hash'])) {
        if (!password_verify((string) ($body['password'] ?? $body['current_password'] ?? ''), (string) $user['password_hash'])) {
            fail('Kata sandi salah.', 400, 'BAD_PASSWORD', 'password');
        }
    } elseif (strtolower(trim((string) ($body['confirm'] ?? ''))) !== strtolower((string) $user['email'])) {
        fail('Ketik alamat email akun Anda untuk konfirmasi.', 400, 'CONFIRM_REQUIRED', 'confirm');
    }
}

function redirectTo(string $path, array $query = []): void
{
    header_remove('Content-Type');
    // Frontend memakai HashRouter: rute (dan query-nya) berada setelah "#".
    header('Location: ' . OAuthClient::appUrl() . '/#' . $path . ($query ? (str_contains($path, '?') ? '&' : '?') . http_build_query($query) : ''));
    http_response_code(302);
    exit;
}

// =============================================================================
// Actions
// =============================================================================

function actionConfig(): void
{
    respond([
        'status'                     => 'success',
        'turnstile_site_key'         => Captcha::enabled() ? Captcha::siteKey() : null,
        'oauth'                      => ['orcid' => OAuthClient::configured('orcid'), 'google' => OAuthClient::configured('google')],
        'require_email_verification' => requireEmailVerification(),
        'registration_open'          => registrationOpen(),
        'password_min_length'        => PASSWORD_MIN,
    ]);
}

function actionMe(): void
{
    $user = UserAuth::current();
    if (!$user) {
        respond(['status' => 'success', 'authenticated' => false, 'user' => null]);
    }
    respond(['status' => 'success', 'authenticated' => true, 'user' => UserAuth::publicUser($user)]);
}

function actionRegister(array $b): void
{
    $ip    = AuthStore::clientIp();
    if (!registrationOpen()) fail('Pendaftaran akun baru sedang ditutup oleh admin.', 403, 'REGISTRATION_CLOSED');
    throttle('register', $ip, 10, 3600);
    $name  = trim((string) ($b['name'] ?? $b['fullName'] ?? ''));
    $email = AuthStore::normalizeEmail((string) ($b['email'] ?? ''));
    $pass  = (string) ($b['password'] ?? '');
    $orcid = strtoupper(trim((string) ($b['orcid'] ?? '')));

    if ($name === '' || mb_strlen($name) > 255) fail('Nama lengkap wajib diisi.', 400, 'VALIDATION', 'fullName');
    if (!validEmail($email)) fail('Alamat email tidak valid.', 400, 'VALIDATION', 'email');
    if ($p = passwordProblem($pass)) fail($p, 400, 'VALIDATION', 'password');
    if ($orcid !== '' && !preg_match(ORCID_RE, $orcid)) fail('Format ORCID tidak valid.', 400, 'VALIDATION', 'orcid');
    if (!Captcha::verify($b['captcha_token'] ?? $b['turnstileToken'] ?? null)) fail('Verifikasi captcha gagal.', 400, 'CAPTCHA', 'captcha');
    store()->recordAttempt('register', $ip);

    // ORCID terverifikasi dari alur "Masuk dengan ORCID" untuk iD yang belum punya akun.
    $orcidVerified = false;
    $claim = null;
    if (!empty($b['orcid_claim'])) {
        $claim = store()->findToken((string) $b['orcid_claim'], 'orcid_claim');
        if ($claim) {
            $orcid = (string) $claim['data']['orcid'];
            $orcidVerified = true;
        }
    } elseif ($orcid !== '' && OAuthClient::configured('orcid')) {
        // Bila login ORCID tersedia, ORCID hanya bisa ditautkan lewat bukti dari ORCID.
        $orcid = '';
    }

    $existing = store()->findUserByEmail($email);
    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $mailer = MailService::getInstance();

    if ($existing && !empty($existing['email_verified'])) {
        // Jangan ungkap bahwa email sudah terdaftar; beri tahu pemiliknya lewat email.
        $mailer->send($email, 'Percobaan pendaftaran dengan email Anda',
            '<p>Ada yang mencoba mendaftar di Sciecola memakai email ini, padahal akun Anda sudah ada.</p>'
            . '<p>Bila itu Anda, silakan masuk atau gunakan <a href="' . htmlspecialchars(MailService::route('/forgot-password')) . '">lupa kata sandi</a>.</p>');
        // Respons sama persis dengan pendaftaran baru (status, kode HTTP, isi).
        respond(['status' => 'verification_required', 'email' => $email,
                 'message' => 'Kode verifikasi telah dikirim ke email Anda.', 'mail_sent' => true], 201);
    }

    if ($existing) {
        // Akun belum terverifikasi belum dimiliki siapa pun: pendaftaran baru menggantikannya.
        $userId = (int) $existing['id'];
        store()->updateUser($userId, ['password_hash' => $hash, 'name' => $name]);
    } else {
        $userId = store()->createUser($email, $hash, $name, !requireEmailVerification());
    }

    if ($orcid !== '') {
        if ($err = attachOrcid($userId, $orcid, $orcidVerified, $name)) {
            fail($err, 409, 'ORCID_TAKEN', 'orcid');
        }
        if ($claim) store()->markTokenUsed((int) $claim['id']);
    }

    $user = store()->findUserById($userId);
    if (!requireEmailVerification()) {
        UserAuth::startSession($user, false);
        loggedInResponse(UserAuth::current() ?? $user);
    }

    $sent = sendVerification($user);
    respond([
        'status'  => 'verification_required',
        'email'   => $email,
        'message' => $sent ? 'Kode verifikasi telah dikirim ke email Anda.' : 'Akun dibuat, tetapi email verifikasi gagal dikirim. Coba kirim ulang.',
        'mail_sent' => $sent,
    ], 201);
}

function actionVerifyEmail(array $b): void
{
    $token = trim((string) ($b['token'] ?? ''));
    if ($token !== '') {
        $row = store()->findToken($token, 'verify_email');
        if (!$row) fail('Tautan verifikasi tidak valid atau sudah kedaluwarsa.', 400, 'INVALID_TOKEN');
    } else {
        $email = AuthStore::normalizeEmail((string) ($b['email'] ?? ''));
        $code  = preg_replace('/\D/', '', (string) ($b['code'] ?? ''));
        throttle('verify', $email, 10, 900);
        store()->recordAttempt('verify', $email);
        $user = $email !== '' ? store()->findUserByEmail($email) : null;
        $row  = $user ? store()->findActiveTokenForUser((int) $user['id'], 'verify_email') : null;
        if (!$row || $row['code_hash'] === null) fail('Kode verifikasi salah atau sudah kedaluwarsa.', 400, 'INVALID_CODE', 'code');
        if ((int) $row['attempts'] >= MAX_CODE_ATTEMPTS) fail('Terlalu banyak percobaan. Kirim ulang kode verifikasi.', 429, 'RATE_LIMITED');
        if (!hash_equals((string) $row['code_hash'], AuthStore::hash((string) $code))) {
            store()->incrementTokenAttempts((int) $row['id']);
            fail('Kode verifikasi salah atau sudah kedaluwarsa.', 400, 'INVALID_CODE', 'code');
        }
    }

    store()->markTokenUsed((int) $row['id']);
    store()->updateUser((int) $row['user_id'], ['email_verified' => 1]);
    $user = store()->findUserById((int) $row['user_id']);
    if (!$user || (int) $user['is_active'] !== 1) fail('Akun tidak aktif.', 403, 'INACTIVE');
    try { MailService::getInstance()->sendWelcome((string) $user['email'], (string) $user['name']); } catch (Throwable $e) {}
    completeLogin($user, false, ['verified' => true]);
}

function actionResendVerification(array $b): void
{
    $email = AuthStore::normalizeEmail((string) ($b['email'] ?? ''));
    throttle('resend', $email, 3, 3600);
    throttle('resend_ip', AuthStore::clientIp(), 10, 3600);
    store()->recordAttempt('resend', $email);
    store()->recordAttempt('resend_ip', AuthStore::clientIp());
    $user = validEmail($email) ? store()->findUserByEmail($email) : null;
    if ($user && empty($user['email_verified'])) {
        sendVerification($user);
    }
    respond(['status' => 'success', 'message' => 'Bila email terdaftar dan belum diverifikasi, kode baru telah dikirim.']);
}

function actionLogin(array $b): void
{
    $email    = AuthStore::normalizeEmail((string) ($b['email'] ?? ''));
    $password = (string) ($b['password'] ?? '');
    $remember = !empty($b['remember']) && $b['remember'] !== 'false';
    $ip       = AuthStore::clientIp();

    if (!validEmail($email) || $password === '') fail('Email dan kata sandi wajib diisi.', 400, 'VALIDATION');
    throttle('login', $email, 5, 900);
    throttle('login_ip', $ip, 30, 900);
    if (!Captcha::verify($b['captcha_token'] ?? $b['turnstileToken'] ?? null)) fail('Verifikasi captcha gagal.', 400, 'CAPTCHA', 'captcha');

    $user = store()->findUserByEmail($email);
    // Tetap hitung hash bila akun tidak ada, agar waktu respons tidak membocorkan keberadaan akun.
    $hash = $user['password_hash'] ?? '$2y$10$' . str_repeat('a', 53);
    $ok   = password_verify($password, (string) $hash) && $user !== null && !empty($user['password_hash']);

    if (!$ok) {
        store()->recordAttempt('login', $email);
        store()->recordAttempt('login_ip', $ip);
        fail('Email atau kata sandi salah.', 401, 'BAD_CREDENTIALS');
    }
    if ((int) $user['is_active'] !== 1) fail('Akun ini dinonaktifkan. Hubungi admin untuk mengaktifkan kembali.', 403, 'INACTIVE');
    if (requireEmailVerification() && empty($user['email_verified'])) {
        fail('Email belum diverifikasi. Masukkan kode yang kami kirim, atau kirim ulang kode.', 403, 'EMAIL_NOT_VERIFIED', null, ['email' => $email]);
    }

    store()->clearAttempts('login', $email);
    if (password_needs_rehash((string) $user['password_hash'], PASSWORD_DEFAULT)) {
        store()->updateUser((int) $user['id'], ['password_hash' => password_hash($password, PASSWORD_DEFAULT)]);
    }
    completeLogin($user, $remember);
}

function actionLogin2fa(array $b): void
{
    $row = store()->findToken((string) ($b['challenge'] ?? ''), 'login_2fa');
    if (!$row) fail('Sesi verifikasi kedaluwarsa. Silakan masuk lagi.', 400, 'CHALLENGE_EXPIRED');
    if ((int) $row['attempts'] >= MAX_CODE_ATTEMPTS) {
        store()->markTokenUsed((int) $row['id']);
        fail('Terlalu banyak kode salah. Silakan masuk lagi.', 429, 'RATE_LIMITED');
    }
    $user = store()->findUserById((int) $row['user_id']);
    if (!$user || (int) $user['is_active'] !== 1) fail('Akun tidak aktif.', 403, 'INACTIVE');

    $method = (string) ($b['method'] ?? 'totp');
    $code   = (string) ($b['code'] ?? '');
    $ok = false;
    if ($method === 'email') {
        $ok = $row['code_hash'] !== null && hash_equals((string) $row['code_hash'], AuthStore::hash(preg_replace('/\D/', '', $code)));
    } else {
        $ok = checkSecondFactor($user, $code, $method === 'recovery' ? 'recovery' : 'totp');
    }
    if (!$ok) {
        store()->incrementTokenAttempts((int) $row['id']);
        fail('Kode salah.', 400, 'INVALID_CODE', 'code');
    }
    store()->markTokenUsed((int) $row['id']);
    if ($method === 'recovery') {
        securityNotice($user, 'Masuk memakai kode pemulihan 2FA');
    }
    UserAuth::startSession($user, !empty($row['data']['remember']));
    $fresh = UserAuth::current() ?? $user;
    $left = count(json_decode((string) ($fresh['recovery_codes'] ?? '[]'), true) ?: []);
    loggedInResponse($fresh, $method === 'recovery' ? ['recovery_codes_left' => $left] : []);
}

function actionSend2faEmail(array $b): void
{
    $row = store()->findToken((string) ($b['challenge'] ?? ''), 'login_2fa');
    if (!$row) fail('Sesi verifikasi kedaluwarsa. Silakan masuk lagi.', 400, 'CHALLENGE_EXPIRED');
    $user = store()->findUserById((int) $row['user_id']);
    if (!$user) fail('Sesi verifikasi kedaluwarsa. Silakan masuk lagi.', 400, 'CHALLENGE_EXPIRED');
    throttle('2fa_mail', (string) $user['id'], 1, 60);
    throttle('2fa_mail_h', (string) $user['id'], 5, 3600);
    store()->recordAttempt('2fa_mail', (string) $user['id']);
    store()->recordAttempt('2fa_mail_h', (string) $user['id']);
    $code = sixDigitCode();
    store()->setTokenCode((int) $row['id'], $code, CHALLENGE_TTL);
    $sent = MailService::getInstance()->sendOtpCode((string) $user['email'], $code);
    if (!$sent) fail('Email gagal dikirim. Gunakan aplikasi autentikator atau kode pemulihan.', 502, 'MAIL_FAILED');
    respond(['status' => 'success', 'message' => 'Kode telah dikirim ke email Anda.']);
}

function actionForgotPassword(array $b): void
{
    $email = AuthStore::normalizeEmail((string) ($b['email'] ?? ''));
    if (!validEmail($email)) fail('Alamat email tidak valid.', 400, 'VALIDATION', 'email');
    if (!Captcha::verify($b['captcha_token'] ?? null)) fail('Verifikasi captcha gagal.', 400, 'CAPTCHA', 'captcha');
    throttle('forgot', $email, 3, 3600);
    throttle('forgot_ip', AuthStore::clientIp(), 10, 3600);
    store()->recordAttempt('forgot', $email);
    store()->recordAttempt('forgot_ip', AuthStore::clientIp());
    $user = store()->findUserByEmail($email);
    if ($user && (int) $user['is_active'] === 1) {
        $token = store()->createToken((int) $user['id'], 'reset_password', RESET_TTL);
        MailService::getInstance()->sendPasswordReset($email, $token);
    }
    respond(['status' => 'success', 'message' => 'Bila email terdaftar, tautan reset kata sandi telah dikirim.']);
}

function actionResetPassword(array $b): void
{
    $row = store()->findToken((string) ($b['token'] ?? ''), 'reset_password');
    if (!$row) fail('Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.', 400, 'INVALID_TOKEN');
    $pass = (string) ($b['password'] ?? '');
    if ($p = passwordProblem($pass)) fail($p, 400, 'VALIDATION', 'password');
    $userId = (int) $row['user_id'];
    store()->markTokenUsed((int) $row['id']);
    // Membuka tautan dari email membuktikan kepemilikan alamat itu.
    store()->updateUser($userId, ['password_hash' => password_hash($pass, PASSWORD_DEFAULT), 'email_verified' => 1]);
    store()->updateSecurity($userId, ['password_changed_at' => gmdate('Y-m-d H:i:s')]);
    store()->deleteSessionsForUser($userId);
    store()->clearAttempts('login', (string) (store()->findUserById($userId)['email'] ?? ''));
    $user = store()->findUserById($userId);
    securityNotice($user, 'Kata sandi direset');
    respond(['status' => 'success', 'message' => 'Kata sandi berhasil diubah. Silakan masuk.']);
}

function actionChangePassword(array $b): void
{
    $user = UserAuth::requireUser();
    $current = (string) ($b['current_password'] ?? '');
    $new     = (string) ($b['new_password'] ?? '');
    if (!empty($user['password_hash'])) {
        if ($current === '') fail('Kata sandi saat ini wajib diisi.', 400, 'VALIDATION', 'current');
        if (!password_verify($current, (string) $user['password_hash'])) fail('Kata sandi saat ini salah.', 400, 'BAD_PASSWORD', 'current');
        if (hash_equals($current, $new)) fail('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.', 400, 'VALIDATION', 'next');
    }
    if ($p = passwordProblem($new)) fail($p, 400, 'VALIDATION', 'next');
    store()->updateUser((int) $user['id'], ['password_hash' => password_hash($new, PASSWORD_DEFAULT)]);
    store()->updateSecurity((int) $user['id'], ['password_changed_at' => gmdate('Y-m-d H:i:s')]);
    $revoked = store()->deleteSessionsForUser((int) $user['id'], UserAuth::currentSessionId());
    securityNotice($user, 'Kata sandi diubah');
    respond(['status' => 'success', 'other_sessions_revoked' => $revoked]);
}

function actionUpdateProfile(array $b): void
{
    $user = UserAuth::requireUser();
    $name = trim((string) ($b['name'] ?? ''));
    if ($name === '' || mb_strlen($name) > 255) fail('Nama wajib diisi (maks. 255 karakter).', 400, 'VALIDATION', 'name');
    store()->updateUser((int) $user['id'], ['name' => $name]);
    loggedInResponse(UserAuth::refresh() ?? $user);
}

function actionLinkOrcid(array $b): void
{
    $user = UserAuth::requireUser();
    if (OAuthClient::configured('orcid')) {
        fail('Tautkan ORCID lewat tombol "Hubungkan ORCID" agar kepemilikan iD terverifikasi.', 400, 'USE_ORCID_LOGIN');
    }
    $orcid = strtoupper(trim((string) ($b['orcid'] ?? '')));
    if (!preg_match(ORCID_RE, $orcid)) fail('Format ORCID tidak valid.', 400, 'VALIDATION', 'orcid');
    if ($err = attachOrcid((int) $user['id'], $orcid, false, (string) $user['name'])) fail($err, 409, 'ORCID_TAKEN', 'orcid');
    loggedInResponse(UserAuth::refresh() ?? $user);
}

function actionUnlinkOrcid(): void
{
    $user = UserAuth::requireUser();
    store()->updateUser((int) $user['id'], ['orcid' => null]);
    store()->updateSecurity((int) $user['id'], ['orcid_verified' => 0]);
    loggedInResponse(UserAuth::refresh() ?? $user);
}

function actionTwofaSetup(): void
{
    $user = UserAuth::requireUser();
    if (!empty($user['totp_enabled'])) fail('2FA sudah aktif.', 400, 'ALREADY_ENABLED');
    $tfa = TwoFactorAuth::getInstance();
    $secret = $tfa->generateSecret();
    store()->updateSecurity((int) $user['id'], ['totp_pending_secret' => $secret]);
    respond([
        'status'      => 'success',
        'secret'      => $secret,
        'otpauth_url' => $tfa->getQrCodeUrl($secret, (string) $user['email']),
    ]);
}

function actionTwofaEnable(array $b): void
{
    $user = UserAuth::requireUser();
    $pending = (string) ($user['totp_pending_secret'] ?? '');
    if ($pending === '') fail('Mulai pengaturan 2FA terlebih dahulu.', 400, 'NO_PENDING_SETUP');
    $counter = TwoFactorAuth::getInstance()->verifyCodeCounter($pending, (string) ($b['code'] ?? ''));
    if ($counter === null) fail('Kode tidak cocok. Pastikan jam ponsel tepat lalu coba lagi.', 400, 'INVALID_CODE', 'code');
    [$codes, $json] = newRecoveryCodes();
    store()->updateSecurity((int) $user['id'], [
        'totp_secret' => $pending, 'totp_pending_secret' => null, 'totp_enabled' => 1,
        'totp_last_counter' => $counter, 'recovery_codes' => $json,
    ]);
    securityNotice($user, 'Autentikasi dua faktor diaktifkan');
    respond(['status' => 'success', 'recovery_codes' => $codes, 'user' => UserAuth::publicUser(UserAuth::refresh() ?? $user)]);
}

function actionTwofaDisable(array $b): void
{
    $user = UserAuth::requireUser();
    if (empty($user['totp_enabled'])) fail('2FA belum aktif.', 400, 'NOT_ENABLED');
    confirmIdentity($user, $b);
    $code = (string) ($b['code'] ?? '');
    if (!checkSecondFactor($user, $code, 'totp') && !checkSecondFactor($user, $code, 'recovery')) {
        fail('Kode 2FA salah.', 400, 'INVALID_CODE', 'code');
    }
    store()->updateSecurity((int) $user['id'], [
        'totp_secret' => null, 'totp_pending_secret' => null, 'totp_enabled' => 0,
        'totp_last_counter' => null, 'recovery_codes' => null,
    ]);
    securityNotice($user, 'Autentikasi dua faktor dinonaktifkan');
    loggedInResponse(UserAuth::refresh() ?? $user);
}

function actionTwofaRecovery(array $b): void
{
    $user = UserAuth::requireUser();
    if (empty($user['totp_enabled'])) fail('2FA belum aktif.', 400, 'NOT_ENABLED');
    if (!checkSecondFactor($user, (string) ($b['code'] ?? ''), 'totp')) fail('Kode 2FA salah.', 400, 'INVALID_CODE', 'code');
    [$codes, $json] = newRecoveryCodes();
    store()->updateSecurity((int) $user['id'], ['recovery_codes' => $json]);
    respond(['status' => 'success', 'recovery_codes' => $codes]);
}

function actionSessions(): void
{
    $user = UserAuth::requireUser();
    $current = UserAuth::currentSessionId();
    $rows = array_map(static fn ($s) => [
        'id'           => substr((string) $s['id'], 0, 12),
        'current'      => hash_equals((string) $s['id'], (string) $current),
        'ip'           => $s['ip'],
        'user_agent'   => $s['user_agent'],
        'created_at'   => $s['created_at'],
        'last_seen_at' => $s['last_seen_at'],
        'remember'     => (bool) $s['remember'],
    ], store()->listSessions((int) $user['id']));
    respond(['status' => 'success', 'sessions' => $rows]);
}

function actionRevokeOtherSessions(): void
{
    $user = UserAuth::requireUser();
    $n = store()->deleteSessionsForUser((int) $user['id'], UserAuth::currentSessionId());
    respond(['status' => 'success', 'revoked' => $n]);
}

function actionCloseAccount(array $b, bool $delete): void
{
    $user = UserAuth::requireUser();
    confirmIdentity($user, $b);
    if (!empty($user['totp_enabled'])) {
        $code = (string) ($b['code'] ?? '');
        if (!checkSecondFactor($user, $code, 'totp') && !checkSecondFactor($user, $code, 'recovery')) {
            fail('Kode 2FA salah.', 400, 'INVALID_CODE', 'code');
        }
    }
    if ($delete) {
        securityNotice($user, 'Akun dihapus');
        store()->deleteUser((int) $user['id']);
    } else {
        store()->updateUser((int) $user['id'], ['is_active' => 0]);
        store()->deleteSessionsForUser((int) $user['id']);
        securityNotice($user, 'Akun dinonaktifkan');
    }
    UserAuth::endSession();
    respond(['status' => 'success']);
}

// -----------------------------------------------------------------------------
// OAuth (ORCID / Google)
// -----------------------------------------------------------------------------


function actionOAuthStart(): void
{
    $provider = (string) ($_GET['provider'] ?? '');
    $mode     = ($_GET['mode'] ?? 'login') === 'link' ? 'link' : 'login';
    if (!in_array($provider, OAuthClient::PROVIDERS, true) || !OAuthClient::configured($provider)) {
        redirectTo('/login', ['oauth_error' => 'not_configured']);
    }
    $user = UserAuth::current();
    if ($mode === 'link' && !$user) {
        redirectTo('/login', ['oauth_error' => 'login_required']);
    }
    $state = store()->createToken(null, 'oauth_state', 600, [
        'provider' => $provider,
        'mode'     => $mode,
        'user_id'  => $mode === 'link' ? (int) $user['id'] : null,
        'next'     => safeNext($_GET['next'] ?? null),
        'remember' => !empty($_GET['remember']),
    ]);
    // State juga diikat ke browser ini lewat cookie, untuk mencegah login CSRF.
    setcookie(OAUTH_COOKIE, AuthStore::hash($state), [
        'expires' => time() + 600, 'path' => '/', 'secure' => UserAuth::isHttps(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    header('Location: ' . OAuthClient::authorizeUrl($provider, $state));
    http_response_code(302);
    exit;
}

function actionOAuthCallback(): void
{
    $provider = (string) ($_GET['provider'] ?? '');
    $stateRaw = (string) ($_GET['state'] ?? '');
    $state    = store()->findToken($stateRaw, 'oauth_state');
    $cookie   = (string) ($_COOKIE[OAUTH_COOKIE] ?? '');
    setcookie(OAUTH_COOKIE, '', ['expires' => time() - 3600, 'path' => '/']);

    if (!$state || $cookie === '' || !hash_equals($cookie, AuthStore::hash($stateRaw)) || ($state['data']['provider'] ?? '') !== $provider) {
        redirectTo('/login', ['oauth_error' => 'invalid_state']);
    }
    store()->markTokenUsed((int) $state['id']);
    $data = $state['data'];
    $next = safeNext($data['next'] ?? null);

    if (!empty($_GET['error']) || empty($_GET['code'])) {
        redirectTo($data['mode'] === 'link' ? '/settings' : '/login', ['oauth_error' => 'cancelled']);
    }
    try {
        $identity = OAuthClient::exchange($provider, (string) $_GET['code']);
    } catch (Throwable $e) {
        error_log('[auth] oauth ' . $provider . ': ' . $e->getMessage());
        redirectTo($data['mode'] === 'link' ? '/settings' : '/login', ['oauth_error' => 'exchange_failed']);
    }

    // ── Penautan ke akun yang sedang login ──
    if ($data['mode'] === 'link') {
        $user = UserAuth::current();
        if (!$user || (int) $user['id'] !== (int) $data['user_id']) {
            redirectTo('/login', ['oauth_error' => 'login_required']);
        }
        if ($provider === 'orcid') {
            $err = attachOrcid((int) $user['id'], $identity['id'], true, $identity['name']);
        } else {
            $other = store()->findUserByGoogleSub($identity['id']);
            $err = ($other && (int) $other['id'] !== (int) $user['id']) ? 'taken' : null;
            if (!$err) store()->updateSecurity((int) $user['id'], ['google_sub' => $identity['id']]);
        }
        redirectTo('/settings', $err ? ['oauth_error' => 'already_linked'] : ['linked' => $provider]);
    }

    // ── Masuk ──
    $remember = !empty($data['remember']);
    $user = null;
    if ($provider === 'orcid') {
        $user = store()->findUserByOrcid($identity['id']);
        if ($user && empty($user['orcid_verified'])) {
            // ORCID tautan manual belum terbukti; jangan izinkan login dengannya.
            $user = null;
        }
        if (!$user && !registrationOpen()) {
            redirectTo('/login', ['oauth_error' => 'registration_closed']);
        }
        if (!$user) {
            // Belum ada akun untuk iD ini: lanjut daftar dengan ORCID yang sudah terbukti.
            $claim = store()->createToken(null, 'orcid_claim', 1800, ['orcid' => $identity['id'], 'name' => $identity['name']]);
            redirectTo('/register', ['orcid_claim' => $claim, 'orcid' => $identity['id'], 'name' => $identity['name']]);
        }
    } else {
        $user = store()->findUserByGoogleSub($identity['id']);
        if (!$user && $identity['email'] && $identity['email_verified']) {
            $user = store()->findUserByEmail($identity['email']);
            if ($user) {
                store()->updateSecurity((int) $user['id'], ['google_sub' => $identity['id']]);
                if (empty($user['email_verified'])) store()->updateUser((int) $user['id'], ['email_verified' => 1]);
                $user = store()->findUserById((int) $user['id']);
            }
        }
        if (!$user) {
            if (!$identity['email'] || !$identity['email_verified']) {
                redirectTo('/login', ['oauth_error' => 'email_unverified']);
            }
            if (!registrationOpen()) {
                redirectTo('/login', ['oauth_error' => 'registration_closed']);
            }
            $id = store()->createUser($identity['email'], null, $identity['name'] ?: $identity['email'], true);
            store()->updateSecurity($id, ['google_sub' => $identity['id']]);
            $user = store()->findUserById($id);
        }
    }

    if ((int) $user['is_active'] !== 1) {
        redirectTo('/login', ['oauth_error' => 'inactive']);
    }
    if (!empty($user['totp_enabled'])) {
        $challenge = store()->createToken((int) $user['id'], 'login_2fa', CHALLENGE_TTL, ['remember' => $remember]);
        redirectTo('/login', ['challenge' => $challenge, 'next' => $next]);
    }
    UserAuth::startSession($user, $remember);
    redirectTo($next, ['login' => 'oauth']);
}
