<?php

declare(strict_types=1);

namespace Sciecola\Marketplace;

use PDO;
use Sciecola\Community\Notifications;
use Sciecola\Premium\Premium;
use Sciecola\Support\AppSettings;
use Sciecola\Support\ResearcherRecord;

/**
 * @file src/Marketplace/OpportunityCuration.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Kurasi peluang Pasar Inovasi: penilaian publik, biaya penayangan, keputusan admin.
 *
 * Alur:
 *  1. Peluang dari pengguna tampil langsung dengan curation_status = 'review' ("Dalam kurasi").
 *  2. Pengguna ber-ORCID menilai: endorse ("Layak") atau report ("Laporkan" + alasan).
 *     Laporan ≥ autoHideReports dan lebih banyak dari dukungan → 'auto_hidden' (disembunyikan
 *     sampai admin memutuskan). Dukungan tidak pernah menyetujui otomatis.
 *  3. Biaya penayangan: fee_status unpaid → pending (pemasang mengirim bukti) → paid (admin
 *     mengonfirmasi) atau waived (dibebaskan / biaya 0).
 *  4. Admin: approve (hanya bila biaya paid/waived) → 'approved' ("Terverifikasi"),
 *     hold (+catatan) → 'on_hold' (disembunyikan), restore → 'review', atau hapus.
 *  Pemasang menerima notifikasi untuk setiap keputusan.
 */
final class OpportunityCuration
{
    public const STATUSES = ['review', 'approved', 'on_hold', 'auto_hidden'];
    public const PUBLIC_STATUSES = ['review', 'approved'];
    public const FEE_STATUSES = ['unpaid', 'pending', 'paid', 'waived'];
    public const REPORT_REASONS = ['spam', 'misleading', 'not_research', 'duplicate', 'other'];

    private static bool $ready = false;

    public static function ensure(PDO $pdo): void
    {
        if (self::$ready) {
            return;
        }
        $driver = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $marker = (defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2)) . '/cache/.opportunity_curation_v1';
        if ($driver === 'mysql' && is_file($marker)) {
            self::$ready = true;
            return;
        }
        $added = false;
        foreach ([
            'curation_status'  => "VARCHAR(20) NOT NULL DEFAULT 'review'",
            'curation_note'    => 'TEXT NULL',
            'curated_by'       => 'INTEGER NULL',
            'curated_at'       => 'TIMESTAMP NULL',
            'fee_status'       => "VARCHAR(10) NOT NULL DEFAULT 'unpaid'",
            'fee_amount'       => 'DECIMAL(15,2) NULL',
            'fee_currency'     => 'VARCHAR(3) NULL',
            'fee_reference'    => 'VARCHAR(255) NULL',
            'fee_submitted_at' => 'TIMESTAMP NULL',
            'fee_confirmed_at' => 'TIMESTAMP NULL',
        ] as $col => $def) {
            $added = self::addColumn($pdo, $driver, $col, $def) || $added;
        }
        if ($added) {
            // Peluang yang sudah ada sebelum fitur ini (dibuat admin / data lama) dianggap terverifikasi.
            $pdo->exec("UPDATE innovation_opportunities SET curation_status = 'approved', fee_status = 'waived'
                         WHERE curated_at IS NULL AND fee_reference IS NULL AND fee_amount IS NULL");
        }
        $tail = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
        $uint = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
        $pdo->exec("CREATE TABLE IF NOT EXISTS opportunity_curation_votes (
            opportunity_id {$uint} NOT NULL,
            user_id {$uint} NOT NULL,
            vote VARCHAR(10) NOT NULL,
            reason VARCHAR(20) NULL,
            note VARCHAR(500) NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (opportunity_id, user_id)
        ){$tail}");
        if ($driver === 'mysql') {
            @file_put_contents($marker, date('c'));
        }
        self::$ready = true;
    }

    private static function addColumn(PDO $pdo, string $driver, string $col, string $def): bool
    {
        try {
            if ($driver === 'sqlite') {
                $cols = array_column($pdo->query('PRAGMA table_info(innovation_opportunities)')->fetchAll(PDO::FETCH_ASSOC), 'name');
                $exists = in_array($col, $cols, true);
            } else {
                $st = $pdo->prepare('SHOW COLUMNS FROM innovation_opportunities LIKE ?');
                $st->execute([$col]);
                $exists = (bool) $st->fetch();
            }
            if ($exists) {
                return false;
            }
            $pdo->exec("ALTER TABLE innovation_opportunities ADD COLUMN {$col} {$def}");
            return true;
        } catch (\Throwable $e) {
            error_log('[OpportunityCuration] ' . $col . ': ' . $e->getMessage());
            return false;
        }
    }

    public static function settings(): array
    {
        return AppSettings::group('marketplace') + AppSettings::DEFAULTS['marketplace'];
    }

    /** Biaya verifikasi sedang berlaku? Hanya bila layanan premium & fitur verifikasi menyala. */
    public static function feeActive(): bool
    {
        $s = self::settings();
        return Premium::active('verified_listing') && !empty($s['feeEnabled']) && (int) $s['feeAmount'] > 0;
    }

    /**
     * Biaya untuk peluang baru: [status, jumlah, mata uang, sumber].
     * Gratis bila: dipasang admin, premium mati, biaya 0, atau anggota premium masih punya kuota tahunan.
     */
    public static function feeForNewListing(PDO $pdo, ?array $user, bool $byAdmin): array
    {
        if ($byAdmin || !self::feeActive()) {
            return ['waived', null, null, $byAdmin ? 'admin' : 'free'];
        }
        $m = Premium::membershipFor($pdo, $user);
        if ($m && Premium::consume($pdo, 'm:' . $m['id'], 'verified_listing', date('Y'), Premium::verifiedQuota($m))) {
            return ['waived', null, null, 'membership'];
        }
        $s = self::settings();
        return ['unpaid', (float) $s['feeAmount'], (string) $s['feeCurrency'], 'fee'];
    }

    /** @return array<int, array{endorse:int, report:int}> */
    public static function counts(PDO $pdo, array $ids): array
    {
        $out = [];
        $ids = array_values(array_filter(array_map('intval', $ids)));
        if (!$ids) return $out;
        $rows = $pdo->query('SELECT opportunity_id, vote, COUNT(*) AS n FROM opportunity_curation_votes
                              WHERE opportunity_id IN (' . implode(',', $ids) . ') GROUP BY opportunity_id, vote')
            ->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            $id = (int) $r['opportunity_id'];
            $out[$id] ??= ['endorse' => 0, 'report' => 0];
            if (isset($out[$id][$r['vote']])) $out[$id][$r['vote']] = (int) $r['n'];
        }
        return $out;
    }

    /** @return array<int, array{vote:string, reason:?string}> */
    public static function votesOf(PDO $pdo, int $userId): array
    {
        $st = $pdo->prepare('SELECT opportunity_id, vote, reason FROM opportunity_curation_votes WHERE user_id = ?');
        $st->execute([$userId]);
        $out = [];
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $out[(int) $r['opportunity_id']] = ['vote' => $r['vote'], 'reason' => $r['reason']];
        }
        return $out;
    }

    /**
     * Simpan penilaian publik. $vote = endorse | report | clear.
     * @return array{endorse:int, report:int, status:string, auto_hidden:bool}
     */
    public static function vote(PDO $pdo, array $opp, array $user, string $vote, ?string $reason, ?string $note): array
    {
        $oid = (int) $opp['id'];
        $uid = (int) $user['id'];
        $pdo->prepare('DELETE FROM opportunity_curation_votes WHERE opportunity_id = ? AND user_id = ?')->execute([$oid, $uid]);
        if ($vote !== 'clear') {
            $pdo->prepare('INSERT INTO opportunity_curation_votes (opportunity_id, user_id, vote, reason, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
                ->execute([$oid, $uid, $vote, $vote === 'report' ? $reason : null,
                           $vote === 'report' && $note ? mb_substr($note, 0, 500) : null, date('Y-m-d H:i:s')]);
        }
        $c = self::counts($pdo, [$oid])[$oid] ?? ['endorse' => 0, 'report' => 0];
        $status = (string) $opp['curation_status'];
        $hidden = false;
        $limit = (int) self::settings()['autoHideReports'];
        if ($status === 'review' && $c['report'] >= $limit && $c['report'] > $c['endorse']) {
            $pdo->prepare("UPDATE innovation_opportunities SET curation_status = 'auto_hidden', updated_at = ? WHERE id = ?")
                ->execute([date('Y-m-d H:i:s'), $oid]);
            $status = 'auto_hidden';
            $hidden = true;
            self::notifyPoster($pdo, $opp, 'Peluang Anda disembunyikan sementara',
                'Beberapa pengguna melaporkan peluang ini. Admin akan meninjaunya sebelum ditampilkan kembali.', null);
        }
        return $c + ['status' => $status, 'auto_hidden' => $hidden];
    }

    public static function notifyPoster(PDO $pdo, array $opp, string $title, ?string $message, ?int $actorId): void
    {
        if (empty($opp['posted_by_orcid'])) return;
        $acc = ResearcherRecord::accountFor($pdo, (string) $opp['posted_by_orcid']);
        if ($acc) {
            Notifications::notify($pdo, (int) $acc['id'], 'system',
                $title . ': "' . mb_substr((string) $opp['title'], 0, 100) . '"', $message,
                '/innovation-marketplace?opp=' . (int) $opp['id'], $actorId);
        }
    }

    public static function find(PDO $pdo, int $id): ?array
    {
        $st = $pdo->prepare('SELECT * FROM innovation_opportunities WHERE id = ?');
        $st->execute([$id]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }
}
