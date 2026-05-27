<?php
declare(strict_types=1);

/**
 * @file api/MailService.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Email notification service for SDG Classification Analysis API.
 * 
 * MailService — Email notification dispatcher
 * Uses PHPMailer when available; falls back to PHP mail() for local testing.
 *
 * Local testing: set MAIL_DRIVER=log in config.php to write emails to /tmp/mail.log
 */

require_once __DIR__ . '/../config/config.php';

class MailService {
    private static ?MailService $instance = null;
    private string $driver;

    private function __construct() {
        $this->driver = defined('MAIL_DRIVER') ? MAIL_DRIVER : 'log';
    }

    public static function getInstance(): self {
        if (!self::$instance) self::$instance = new self();
        return self::$instance;
    }

    /**
     * Send an email.
     * @param string $to        Recipient email address
     * @param string $subject   Subject line
     * @param string $body      HTML body
     * @param array  $options   ['from' => '...', 'reply_to' => '...', 'attachments' => [...]]
     */
    public function send(string $to, string $subject, string $body, array $options = []): bool {
        $from     = $options['from']     ?? (defined('MAIL_FROM')    ? MAIL_FROM    : 'noreply@sciecola.id');
        $fromName = $options['fromName'] ?? (defined('MAIL_FROM_NAME') ? MAIL_FROM_NAME : 'Sciecola');

        if ($this->driver === 'log') {
            return $this->logMail($to, $subject, $body, $from);
        }

        if ($this->driver === 'smtp' && class_exists('PHPMailer\PHPMailer\PHPMailer')) {
            return $this->sendViaSmtp($to, $subject, $body, $from, $fromName, $options);
        }

        // Native PHP mail() fallback
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$fromName} <{$from}>\r\n";
        return mail($to, $subject, $body, $headers);
    }

    // ─── Convenience wrappers ───────────────────────────────────────────

    public function sendWelcome(string $to, string $name): bool {
        $appUrl = defined('APP_URL') ? APP_URL : 'http://localhost';
        $body   = $this->renderTemplate('welcome', [
            'name'    => $name,
            'app_url' => $appUrl,
        ]);
        return $this->send($to, 'Selamat datang di Sciecola!', $body);
    }

    public function sendPasswordReset(string $to, string $token): bool {
        $link = (defined('APP_URL') ? APP_URL : 'http://localhost') . "/reset-password?token={$token}";
        $body = $this->renderTemplate('reset-password', ['reset_url' => $link]);
        return $this->send($to, 'Reset Kata Sandi', $body);
    }

    public function sendEmailVerification(string $to, string $token): bool {
        $appUrl = defined('APP_URL') ? APP_URL : 'http://localhost';
        $link   = $appUrl . "/verify-email?token={$token}";
        $body   = $this->renderTemplate('verify-email', [
            'otp_code'   => strtoupper(substr($token, 0, 6)),
            'verify_url' => $link,
        ]);
        return $this->send($to, 'Verifikasi Email Anda', $body);
    }

    public function sendOtpCode(string $to, string $code): bool {
        $body = $this->template('otp', ['code' => $code]);
        return $this->send($to, "Kode OTP Anda: {$code}", $body);
    }

    public function sendAnalysisComplete(string $to, string $orcid, int $count): bool {
        $body = $this->template('analysis_complete', ['orcid' => $orcid, 'count' => $count]);
        return $this->send($to, 'Analisis SDGs Selesai', $body);
    }

    // ─── Private helpers ────────────────────────────────────────────────

    /**
     * Render an HTML email template from the templates/email/ directory.
     * Replaces all {{key}} placeholders with the corresponding value from $vars.
     * Falls back to the inline template() method if the file does not exist.
     *
     * @param string $template  Template filename without .html extension (e.g. 'welcome')
     * @param array  $vars      Associative array of placeholder => value
     * @return string           Rendered HTML string
     */
    private function renderTemplate(string $template, array $vars): string {
        $path = __DIR__ . '/../templates/email/' . $template . '.html';

        if (!file_exists($path)) {
            // Derive a legacy template name for backward compatibility
            $legacyMap = [
                'welcome'         => 'welcome',
                'reset-password'  => 'password_reset',
                'verify-email'    => 'email_verification',
                'notification'    => 'analysis_complete',
            ];
            $legacyKey = $legacyMap[$template] ?? $template;
            return $this->template($legacyKey, $vars);
        }

        $html = file_get_contents($path);

        foreach ($vars as $key => $value) {
            $html = str_replace('{{' . $key . '}}', htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'), $html);
        }

        return $html;
    }

    private function sendViaSmtp(string $to, string $subject, string $body, string $from, string $fromName, array $options): bool {
        try {
            $mailer = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mailer->isSMTP();
            $mailer->Host       = defined('SMTP_HOST')   ? SMTP_HOST   : 'localhost';
            $mailer->SMTPAuth   = defined('SMTP_AUTH')   ? SMTP_AUTH   : false;
            $mailer->Username   = defined('SMTP_USER')   ? SMTP_USER   : '';
            $mailer->Password   = defined('SMTP_PASS')   ? SMTP_PASS   : '';
            $mailer->SMTPSecure = defined('SMTP_SECURE') ? SMTP_SECURE : \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mailer->Port       = defined('SMTP_PORT')   ? SMTP_PORT   : 587;
            $mailer->CharSet    = 'UTF-8';

            $mailer->setFrom($from, $fromName);
            $mailer->addAddress($to);
            if (!empty($options['reply_to'])) $mailer->addReplyTo($options['reply_to']);

            $mailer->isHTML(true);
            $mailer->Subject = $subject;
            $mailer->Body    = $body;
            $mailer->AltBody = strip_tags($body);

            foreach ($options['attachments'] ?? [] as $att) {
                $mailer->addAttachment($att['path'], $att['name'] ?? '');
            }

            $mailer->send();
            return true;
        } catch (\Exception $e) {
            error_log('[MailService] SMTP error: ' . $e->getMessage());
            return false;
        }
    }

    private function logMail(string $to, string $subject, string $body, string $from): bool {
        $logFile = '/tmp/sciecola_mail.log';
        $entry   = sprintf(
            "[%s] TO: %s | FROM: %s | SUBJECT: %s\n%s\n---\n",
            date('Y-m-d H:i:s'), $to, $from, $subject, strip_tags($body)
        );
        file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
        return true;
    }

    private function template(string $name, array $vars): string {
        $templates = [
            'welcome' => <<<HTML
<p>Halo {name},</p>
<p>Selamat datang di <strong>Sciecola</strong> — platform analitik riset berbasis SDGs.</p>
<p>Mulai dengan menganalisis publikasi Anda menggunakan ORCID ID Anda.</p>
HTML,
            'password_reset' => <<<HTML
<p>Kami menerima permintaan untuk mereset kata sandi Anda.</p>
<p><a href="{link}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Reset Kata Sandi</a></p>
<p>Link berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset.</p>
HTML,
            'email_verification' => <<<HTML
<p>Klik tombol di bawah untuk memverifikasi email Anda.</p>
<p><a href="{link}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Verifikasi Email</a></p>
HTML,
            'otp' => <<<HTML
<p>Kode OTP Anda:</p>
<h1 style="font-size:40px;letter-spacing:8px;color:#4f46e5">{code}</h1>
<p>Berlaku selama 10 menit.</p>
HTML,
            'analysis_complete' => <<<HTML
<p>Analisis SDGs untuk ORCID <strong>{orcid}</strong> telah selesai.</p>
<p><strong>{count}</strong> publikasi berhasil diklasifikasikan.</p>
HTML,
        ];

        $tpl = $templates[$name] ?? '<p>Notifikasi dari Sciecola.</p>';
        foreach ($vars as $k => $v) {
            $tpl = str_replace("{{$k}}", htmlspecialchars((string)$v), $tpl);
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
}
