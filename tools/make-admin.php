<?php
declare(strict_types=1);

/**
 * @file tools/make-admin.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @brief Membuat atau mempromosikan akun admin dari Terminal cPanel (tanpa installer).
 *
 * Pemakaian (dari folder aplikasi):
 *   php tools/make-admin.php promote  email@domain.ac.id
 *       Jadikan akun yang sudah terdaftar sebagai admin (role = admin, email dianggap terverifikasi).
 *   php tools/make-admin.php create   email@domain.ac.id "Nama Lengkap"
 *       Buat akun admin baru. Kata sandi diminta di terminal (tidak tampil di layar/riwayat).
 *   php tools/make-admin.php demote   email@domain.ac.id
 *   php tools/make-admin.php list
 *
 * Hanya bisa dijalankan dari command line, bukan dari browser.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

define('ROOT_PATH', dirname(__DIR__));
require ROOT_PATH . '/config/config.php';
require ROOT_PATH . '/includes/autoload.php';

use Sciecola\Auth\AuthStore;

function out(string $msg): void { fwrite(STDOUT, $msg . PHP_EOL); }
function fail(string $msg): void { fwrite(STDERR, 'Gagal: ' . $msg . PHP_EOL); exit(1); }

function ask_password(): string
{
    $isTty = function_exists('posix_isatty') ? posix_isatty(STDIN) : true;
    if ($isTty && DIRECTORY_SEPARATOR === '/') {
        fwrite(STDOUT, 'Kata sandi (min. 8 karakter): ');
        shell_exec('stty -echo');
        $p1 = trim((string) fgets(STDIN));
        shell_exec('stty echo');
        fwrite(STDOUT, PHP_EOL . 'Ulangi kata sandi: ');
        shell_exec('stty -echo');
        $p2 = trim((string) fgets(STDIN));
        shell_exec('stty echo');
        fwrite(STDOUT, PHP_EOL);
    } else {
        fwrite(STDOUT, 'Kata sandi (min. 8 karakter): ');
        $p1 = trim((string) fgets(STDIN));
        fwrite(STDOUT, 'Ulangi kata sandi: ');
        $p2 = trim((string) fgets(STDIN));
    }
    if ($p1 !== $p2) fail('kata sandi tidak sama.');
    if (mb_strlen($p1) < 8 || strlen($p1) > 72) fail('kata sandi harus 8–72 karakter.');
    return $p1;
}

$cmd   = $argv[1] ?? '';
$email = strtolower(trim((string) ($argv[2] ?? '')));

try {
    $store = AuthStore::get();
} catch (Throwable $e) {
    fail('database tidak dapat dihubungi (' . $e->getMessage() . '). Periksa DB_* di .env.');
}

switch ($cmd) {
    case 'list':
        $rows = $store->pdo()->query("SELECT id, email, name, role, is_active, email_verified FROM user_accounts ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            out(sprintf('#%-4d %-6s %-8s %-10s %s (%s)', $r['id'], $r['role'], $r['is_active'] ? 'aktif' : 'nonaktif',
                $r['email_verified'] ? 'verified' : 'unverified', $r['email'], $r['name']));
        }
        if (!$rows) out('Belum ada akun.');
        break;

    case 'promote':
    case 'demote':
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('email tidak valid.');
        $u = $store->findUserByEmail($email);
        if (!$u) fail("akun {$email} belum terdaftar. Daftar dulu di situs, atau pakai perintah 'create'.");
        $store->updateUser((int) $u['id'], $cmd === 'promote'
            ? ['role' => 'admin', 'email_verified' => 1, 'is_active' => 1]
            : ['role' => 'user']);
        \Sciecola\Support\AppSettings::audit(null, $cmd === 'promote' ? 'cli.promote' : 'cli.demote', $email);
        out($cmd === 'promote' ? "OK: {$email} sekarang admin." : "OK: {$email} sekarang pengguna biasa.");
        break;

    case 'create':
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('email tidak valid.');
        if ($store->findUserByEmail($email)) fail("akun {$email} sudah ada. Pakai perintah 'promote'.");
        $name = trim((string) ($argv[3] ?? '')) ?: $email;
        $id = $store->createUser($email, password_hash(ask_password(), PASSWORD_DEFAULT), $name, true);
        $store->updateUser($id, ['role' => 'admin']);
        \Sciecola\Support\AppSettings::audit(null, 'cli.create_admin', $email);
        out("OK: akun admin {$email} dibuat. Silakan masuk di situs.");
        break;

    default:
        out("Pemakaian:\n  php tools/make-admin.php promote <email>\n  php tools/make-admin.php create <email> \"Nama\"\n  php tools/make-admin.php demote <email>\n  php tools/make-admin.php list");
        exit($cmd === '' ? 0 : 1);
}
