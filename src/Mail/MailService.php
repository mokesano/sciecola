<?php

declare(strict_types=1);

namespace Sciecola\Mail;

/**
 * @file src/Mail/MailService.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pengirim email (verifikasi akun, reset sandi, kode 2FA, pemberitahuan keamanan).
 *
 * MAIL_DRIVER:
 *   log  — tulis ke logs/mail.log (pengembangan; email TIDAK terkirim)
 *   smtp — SMTP. Memakai PHPMailer bila terpasang; bila tidak, memakai klien SMTP bawaan
 *          (SSL port 465 atau STARTTLS port 587, AUTH LOGIN). Cocok untuk akun email cPanel.
 *   mail — fungsi mail() PHP (sendmail server)
 *
 * Sebelumnya driver "smtp" tanpa PHPMailer diam-diam jatuh ke mail(), dan driver "log"
 * menulis ke /tmp. Email verifikasi juga memakai 6 karakter awal token sebagai "kode",
 * sehingga kode itu membocorkan sebagian token tautan.
 */
class MailService
{
    private static ?self $instance = null;
    private string $driver;
    private ?string $lastError = null;

    private function __construct()
    {
        $this->driver = strtolower(defined('MAIL_DRIVER') ? (string) MAIL_DRIVER : (string) (getenv('MAIL_DRIVER') ?: 'log'));
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function driver(): string
    {
        return $this->driver;
    }

    /** true bila email benar-benar dikirim keluar (bukan hanya ditulis ke log). */
    public function deliversMail(): bool
    {
        return in_array($this->driver, ['smtp', 'mail'], true);
    }

    public function lastError(): ?string
    {
        return $this->lastError;
    }

    public function send(string $to, string $subject, string $body, array $options = []): bool
    {
        $this->lastError = null;
        $from     = $options['from']     ?? (defined('MAIL_FROM')      ? MAIL_FROM      : 'noreply@sciecola.id');
        $fromName = $options['fromName'] ?? (defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Sciecola');

        if ($this->driver === 'log') {
            return $this->logMail($to, $subject, $body, $from);
        }
        if ($this->driver === 'smtp') {
            if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
                return $this->sendViaPhpMailer($to, $subject, $body, $from, $fromName, $options);
            }
            return $this->sendViaNativeSmtp($to, $subject, $body, $from, $fromName);
        }

        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= 'From: ' . $this->encodeHeader($fromName) . " <{$from}>\r\n";
        $ok = mail($to, $this->encodeHeader($subject), $body, $headers);
        if (!$ok) {
            $this->lastError = 'mail() gagal';
            error_log('[MailService] mail() gagal mengirim ke ' . $to);
        }
        return $ok;
    }

    // -------------------------------------------------------------------------
    // Pesan akun
    // -------------------------------------------------------------------------

    public function sendWelcome(string $to, string $name): bool
    {
        $body = $this->renderTemplate('welcome', ['name' => $name, 'app_url' => self::appUrl()]);
        return $this->send($to, 'Selamat datang di Sciecola!', $body);
    }

    /** Tautan + kode 6 digit (kode dibuat terpisah, bukan potongan token). */
    public function sendEmailVerification(string $to, string $token, string $code = ''): bool
    {
        $link = self::route('/verify-email?token=' . rawurlencode($token));
        $body = $this->renderTemplate('verify-email', ['otp_code' => $code, 'verify_url' => $link]);
        return $this->send($to, 'Verifikasi Email Anda', $body);
    }

    public function sendPasswordReset(string $to, string $token): bool
    {
        $link = self::route('/reset-password?token=' . rawurlencode($token));
        $body = $this->renderTemplate('reset-password', ['reset_url' => $link]);
        return $this->send($to, 'Reset Kata Sandi', $body);
    }

    public function sendOtpCode(string $to, string $code): bool
    {
        $body = $this->renderTemplate('otp', ['code' => $code]);
        return $this->send($to, 'Kode masuk Sciecola', $body);
    }

    public function sendSecurityNotice(string $to, string $event): bool
    {
        $body = $this->renderTemplate('security', [
            'event'   => $event,
            'time'    => gmdate('Y-m-d H:i') . ' UTC',
            'ip'      => (string) ($_SERVER['REMOTE_ADDR'] ?? '-'),
            'app_url' => self::appUrl(),
            'forgot_url' => self::route('/forgot-password'),
        ]);
        return $this->send($to, 'Pemberitahuan keamanan akun', $body);
    }

    /** URL halaman frontend. Aplikasi memakai HashRouter, jadi rute ada setelah "#". */
    public static function route(string $path): string
    {
        return self::appUrl() . '/#' . $path;
    }

    public static function appUrl(): string
    {
        if (class_exists('Sciecola\Auth\OAuthClient')) {
            return \Sciecola\Auth\OAuthClient::appUrl();
        }
        return rtrim(defined('APP_URL') ? (string) APP_URL : (string) (getenv('APP_URL') ?: 'http://localhost'), '/');
    }

    // -------------------------------------------------------------------------
    // Templates
    // -------------------------------------------------------------------------

    private function renderTemplate(string $template, array $vars): string
    {
        $path = dirname(__DIR__, 2) . "/templates/email/{$template}.html";
        if (!file_exists($path)) {
            return $this->inlineTemplate($template, $vars);
        }
        $html = (string) file_get_contents($path);
        foreach ($vars as $key => $value) {
            $html = str_replace('{{' . $key . '}}', htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'), $html);
        }
        return $html;
    }

    private function inlineTemplate(string $name, array $vars): string
    {
        $templates = [
            'welcome' => '<p>Halo {{name}},</p><p>Selamat datang di <strong>Sciecola</strong>.</p><p><a href="{{app_url}}">Mulai sekarang</a></p>',
            'reset-password' => '<p>Kami menerima permintaan untuk mereset kata sandi akun Anda.</p>'
                . '<p><a href="{{reset_url}}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none">Reset Kata Sandi</a></p>'
                . '<p>Tautan berlaku 1 jam dan hanya bisa dipakai sekali. Abaikan email ini bila Anda tidak memintanya.</p>',
            'verify-email' => '<p>Terima kasih telah mendaftar. Kode verifikasi Anda:</p>'
                . '<h1 style="font-size:36px;letter-spacing:8px;color:#4f46e5">{{otp_code}}</h1>'
                . '<p>Atau klik: <a href="{{verify_url}}">Verifikasi Email</a></p><p>Berlaku 24 jam.</p>',
            'otp' => '<p>Kode masuk Anda:</p><h1 style="font-size:40px;letter-spacing:8px;color:#4f46e5">{{code}}</h1>'
                . '<p>Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.</p>',
            'security' => '<p>Ada perubahan keamanan pada akun Anda: <strong>{{event}}</strong></p>'
                . '<p>Waktu: {{time}}<br>Alamat IP: {{ip}}</p>'
                . '<p>Bila ini bukan Anda, segera <a href="{{forgot_url}}">reset kata sandi</a>.</p>',
        ];
        $tpl = $templates[$name] ?? '<p>Notifikasi dari Sciecola.</p>';
        foreach ($vars as $k => $v) {
            $tpl = str_replace('{{' . $k . '}}', htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8'), $tpl);
        }
        return <<<HTML
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;color:#374151;max-width:600px;margin:0 auto;padding:20px}</style></head>
        <body>
        <div style="border-bottom:3px solid #4f46e5;padding-bottom:16px;margin-bottom:24px">
          <strong style="color:#4f46e5;font-size:20px">SCIECOLA</strong>
        </div>
        {$tpl}
        <hr style="margin:24px 0;border-color:#e5e7eb">
        <p style="font-size:12px;color:#9ca3af">Sciecola — SDGs Research Analytics Platform</p>
        </body>
        </html>
        HTML;
    }

    // -------------------------------------------------------------------------
    // Drivers
    // -------------------------------------------------------------------------

    private function sendViaPhpMailer(string $to, string $subject, string $body, string $from, string $fromName, array $options): bool
    {
        try {
            $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mailer->isSMTP();
            $mailer->Host       = defined('SMTP_HOST') ? SMTP_HOST : 'localhost';
            $mailer->SMTPAuth   = defined('SMTP_AUTH') ? SMTP_AUTH : false;
            $mailer->Username   = defined('SMTP_USER') ? SMTP_USER : '';
            $mailer->Password   = defined('SMTP_PASS') ? SMTP_PASS : '';
            $mailer->SMTPSecure = defined('SMTP_SECURE') ? SMTP_SECURE : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mailer->Port       = defined('SMTP_PORT') ? SMTP_PORT : 587;
            $mailer->CharSet    = 'UTF-8';
            $mailer->setFrom($from, $fromName);
            $mailer->addAddress($to);
            if (!empty($options['reply_to'])) {
                $mailer->addReplyTo($options['reply_to']);
            }
            $mailer->isHTML(true);
            $mailer->Subject = $subject;
            $mailer->Body    = $body;
            $mailer->AltBody = strip_tags($body);
            $mailer->send();
            return true;
        } catch (\Exception $e) {
            $this->lastError = $e->getMessage();
            error_log('[MailService] SMTP error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Klien SMTP minimal tanpa dependensi. SMTP_SECURE: ssl (port 465), tls (STARTTLS,
     * port 587), atau none (tanpa enkripsi, hanya untuk server lokal).
     */
    private function sendViaNativeSmtp(string $to, string $subject, string $body, string $from, string $fromName): bool
    {
        $host   = defined('SMTP_HOST') ? (string) SMTP_HOST : 'localhost';
        $port   = defined('SMTP_PORT') ? (int) SMTP_PORT : 587;
        $secure = strtolower(defined('SMTP_SECURE') ? (string) SMTP_SECURE : 'tls');
        $user   = defined('SMTP_USER') ? (string) SMTP_USER : '';
        $pass   = defined('SMTP_PASS') ? (string) SMTP_PASS : '';

        $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
        $ctx    = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'SNI_enabled' => true, 'peer_name' => $host]]);
        $fp     = @stream_socket_client($remote, $errno, $errstr, 15, STREAM_CLIENT_CONNECT, $ctx);
        if (!$fp) {
            return $this->smtpFail("koneksi ke {$host}:{$port} gagal: {$errstr}");
        }
        stream_set_timeout($fp, 15);

        try {
            $this->smtpExpect($fp, [220]);
            $ehloHost = preg_replace('/[^a-z0-9.\-]/i', '', (string) ($_SERVER['SERVER_NAME'] ?? 'localhost')) ?: 'localhost';
            $this->smtpCmd($fp, "EHLO {$ehloHost}", [250]);
            if ($secure === 'tls') {
                $this->smtpCmd($fp, 'STARTTLS', [220]);
                $crypto = STREAM_CRYPTO_METHOD_TLS_CLIENT;
                if (defined('STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT')) {
                    $crypto |= STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT;
                }
                if (!@stream_socket_enable_crypto($fp, true, $crypto)) {
                    throw new \RuntimeException('STARTTLS gagal');
                }
                $this->smtpCmd($fp, "EHLO {$ehloHost}", [250]);
            }
            if ($user !== '') {
                $this->smtpCmd($fp, 'AUTH LOGIN', [334]);
                $this->smtpCmd($fp, base64_encode($user), [334], true);
                $this->smtpCmd($fp, base64_encode($pass), [235], true);
            }
            $this->smtpCmd($fp, 'MAIL FROM:<' . $this->cleanAddr($from) . '>', [250]);
            $this->smtpCmd($fp, 'RCPT TO:<' . $this->cleanAddr($to) . '>', [250, 251]);
            $this->smtpCmd($fp, 'DATA', [354]);

            $boundary = 'b' . bin2hex(random_bytes(8));
            $headers  = [
                'Date: ' . date('r'),
                'From: ' . $this->encodeHeader($fromName) . ' <' . $this->cleanAddr($from) . '>',
                'To: <' . $this->cleanAddr($to) . '>',
                'Subject: ' . $this->encodeHeader($subject),
                'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . (explode('@', $from)[1] ?? 'localhost') . '>',
                'MIME-Version: 1.0',
                'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
            ];
            $text = trim(html_entity_decode(strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $body)), ENT_QUOTES, 'UTF-8'));
            $msg  = implode("\r\n", $headers) . "\r\n\r\n"
                . "--{$boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($text)) . "\r\n"
                . "--{$boundary}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($body)) . "\r\n"
                . "--{$boundary}--\r\n";
            // Dot-stuffing (RFC 5321 §4.5.2).
            $msg = (string) preg_replace('/^\./m', '..', $msg);
            fwrite($fp, $msg . "\r\n.\r\n");
            $this->smtpExpect($fp, [250]);
            $this->smtpCmd($fp, 'QUIT', [221]);
            fclose($fp);
            return true;
        } catch (\Throwable $e) {
            @fclose($fp);
            return $this->smtpFail($e->getMessage());
        }
    }

    /** @param resource $fp */
    private function smtpCmd($fp, string $cmd, array $expect, bool $secret = false): string
    {
        fwrite($fp, $cmd . "\r\n");
        try {
            return $this->smtpExpect($fp, $expect);
        } catch (\RuntimeException $e) {
            throw new \RuntimeException(($secret ? '[kredensial]' : strtok($cmd, ' ')) . ': ' . $e->getMessage());
        }
    }

    /** @param resource $fp */
    private function smtpExpect($fp, array $expect): string
    {
        $resp = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $resp .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        $code = (int) substr($resp, 0, 3);
        if (!in_array($code, $expect, true)) {
            throw new \RuntimeException(trim($resp) !== '' ? trim($resp) : 'tidak ada respons server');
        }
        return $resp;
    }

    private function smtpFail(string $msg): bool
    {
        $this->lastError = $msg;
        error_log('[MailService] SMTP: ' . $msg);
        return false;
    }

    private function cleanAddr(string $addr): string
    {
        return (string) preg_replace('/[\r\n<>]/', '', trim($addr));
    }

    private function encodeHeader(string $value): string
    {
        $value = str_replace(["\r", "\n"], '', $value);
        return preg_match('/[^\x20-\x7E]/', $value) ? '=?UTF-8?B?' . base64_encode($value) . '?=' : $value;
    }

    private function logMail(string $to, string $subject, string $body, string $from): bool
    {
        $dir = dirname(__DIR__, 2) . '/logs';
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        // Tautan dipertahankan sebagai "teks (URL)" agar bisa diuji tanpa server email.
        $text = (string) preg_replace('#<a\s[^>]*href="([^"]+)"[^>]*>(.*?)</a>#is', '$2 ($1)', $body);
        $text = trim((string) preg_replace("/\n{3,}/", "\n\n", html_entity_decode(strip_tags(
            (string) preg_replace('#<(style|head)[^>]*>.*?</\1>#is', '', str_replace(['</p>', '<br>'], ["\n", "\n"], $text))
        ), ENT_QUOTES, 'UTF-8')));
        $entry = sprintf("[%s] TO: %s | FROM: %s | SUBJECT: %s\n%s\n---\n",
            date('Y-m-d H:i:s'), $to, $from, $subject, $text);
        return (bool) @file_put_contents($dir . '/mail.log', $entry, FILE_APPEND | LOCK_EX);
    }
}
