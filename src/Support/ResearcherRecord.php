<?php

declare(strict_types=1);

namespace Sciecola\Support;

use PDO;

/**
 * @file src/Support/ResearcherRecord.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Pastikan ORCID ada di tabel researchers sebelum dipakai sebagai foreign key.
 *
 * research_projects.lead_orcid, project_members.orcid, opportunity_applications.applicant_orcid
 * dan innovation_opportunities.posted_by_orcid merujuk ke researchers(orcid). Pengguna yang
 * baru menautkan ORCID belum tentu sudah punya baris di sana, sehingga insert gagal.
 * Helper ini menambahkan baris minimal (orcid + nama dari akun) bila belum ada.
 */
final class ResearcherRecord
{
    public static function ensure(PDO $pdo, string $orcid, string $name = ''): bool
    {
        $orcid = strtoupper(trim($orcid));
        if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
            return false;
        }
        try {
            $st = $pdo->prepare('SELECT 1 FROM researchers WHERE orcid = ?');
            $st->execute([$orcid]);
            if ($st->fetchColumn()) {
                return true;
            }
            $name = trim($name) !== '' ? trim($name) : $orcid;
            $pdo->prepare('INSERT INTO researchers (orcid, name) VALUES (?, ?)')->execute([$orcid, mb_substr($name, 0, 255)]);
            return true;
        } catch (\Throwable $e) {
            error_log('[ResearcherRecord] ' . $e->getMessage());
            return false;
        }
    }

    /** Nama akun Sciecola yang menautkan ORCID ini (null bila belum ada akun). */
    public static function accountFor(PDO $pdo, string $orcid): ?array
    {
        try {
            $st = $pdo->prepare('SELECT id, name, email FROM user_accounts WHERE orcid = ? AND is_active = 1');
            $st->execute([strtoupper($orcid)]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            return $r ?: null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
