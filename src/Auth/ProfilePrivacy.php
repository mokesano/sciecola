<?php

declare(strict_types=1);

namespace Sciecola\Auth;

use PDO;
use Sciecola\Database\Db;

/**
 * @file src/Auth/ProfilePrivacy.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Menerapkan pengaturan privasi pengguna (tabel user_preferences) pada profil publik.
 *
 * privacy_profile_visibility:
 *   public     → semua orang
 *   registered → hanya pengguna yang login
 *   private    → hanya pemilik ORCID dan admin; disembunyikan dari daftar peneliti
 * privacy_show_affiliations / _publications / _collaborations = 0 → bagian itu dikosongkan.
 *
 * Pemilik profil dan admin selalu melihat profil lengkap. Peneliti yang belum punya
 * akun (tidak ada baris user_preferences) tetap publik.
 */
final class ProfilePrivacy
{
    /** @var array<string,array<string,mixed>|null> */
    private static array $cache = [];

    /** @return array<string,mixed>|null */
    public static function prefs(string $orcid): ?array
    {
        $orcid = strtoupper($orcid);
        if (array_key_exists($orcid, self::$cache)) {
            return self::$cache[$orcid];
        }
        $row = null;
        $pdo = Db::pdo();
        if ($pdo) {
            try {
                $stmt = $pdo->prepare(
                    'SELECT privacy_profile_visibility, privacy_show_affiliations, privacy_show_publications,
                            privacy_show_collaborations FROM user_preferences WHERE orcid = ?'
                );
                $stmt->execute([$orcid]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
            } catch (\Throwable $e) {
                $row = null; // tabel belum ada → semua profil publik
            }
        }
        return self::$cache[$orcid] = $row;
    }

    public static function viewerIsPrivileged(string $orcid): bool
    {
        $viewer = UserAuth::current();
        if (!$viewer) {
            return false;
        }
        return UserAuth::isAdmin($viewer) || strtoupper((string) $viewer['orcid']) === strtoupper($orcid);
    }

    /**
     * Memeriksa akses; mengembalikan null bila boleh, atau [kode HTTP, kode error, pesan].
     *
     * @return array{0:int,1:string,2:string}|null
     */
    public static function denial(string $orcid): ?array
    {
        $p = self::prefs($orcid);
        if (!$p || self::viewerIsPrivileged($orcid)) {
            return null;
        }
        $vis = (string) ($p['privacy_profile_visibility'] ?? 'public');
        if ($vis === 'private') {
            return [403, 'PROFILE_PRIVATE', 'Pemilik profil ini memilih untuk tidak menampilkannya secara publik.'];
        }
        if ($vis === 'registered' && !UserAuth::current()) {
            return [401, 'PROFILE_LOGIN_REQUIRED', 'Profil ini hanya dapat dilihat oleh pengguna yang sudah masuk.'];
        }
        return null;
    }

    /**
     * Mengosongkan bagian profil yang disembunyikan pemiliknya.
     *
     * @param array<string,mixed> $profile hasil ResearcherProfileService (kunci 'profile')
     * @return array<string,mixed>
     */
    public static function filterProfile(string $orcid, array $profile): array
    {
        $p = self::prefs($orcid);
        if (!$p || self::viewerIsPrivileged($orcid)) {
            return $profile;
        }
        if (isset($p['privacy_show_affiliations']) && !(int) $p['privacy_show_affiliations']) {
            foreach (['univ', 'department', 'location', 'country', 'title'] as $k) {
                if (array_key_exists($k, $profile)) {
                    $profile[$k] = $k === 'title' ? 'Researcher' : '';
                }
            }
            $profile['affiliations'] = [];
        }
        if (isset($p['privacy_show_publications']) && !(int) $p['privacy_show_publications']) {
            $profile['recentPublications'] = [];
        }
        if (isset($p['privacy_show_collaborations']) && !(int) $p['privacy_show_collaborations']) {
            $profile['collaborators'] = [];
            $profile['collaboratorsCount'] = 0;
        }
        $profile['privacyFiltered'] = true;
        return $profile;
    }

    /**
     * ORCID yang memilih profil privat (untuk disaring dari daftar publik).
     *
     * @return array<string,true>
     */
    public static function privateOrcids(?PDO $pdo = null): array
    {
        if (UserAuth::isAdmin()) {
            return [];
        }
        $pdo ??= Db::pdo();
        if (!$pdo) {
            return [];
        }
        try {
            $vis = UserAuth::current() ? ["'private'"] : ["'private'", "'registered'"];
            $rows = $pdo->query(
                'SELECT orcid FROM user_preferences WHERE privacy_profile_visibility IN (' . implode(',', $vis) . ')'
            )->fetchAll(PDO::FETCH_COLUMN);
            $me = strtoupper((string) (UserAuth::current()['orcid'] ?? ''));
            $out = [];
            foreach ($rows as $o) {
                if (strtoupper((string) $o) !== $me) {
                    $out[strtoupper((string) $o)] = true;
                }
            }
            return $out;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Menyaring baris daftar (array yang punya kunci 'orcid').
     *
     * @param array<int,array<string,mixed>> $rows
     * @return array<int,array<string,mixed>>
     */
    public static function filterList(array $rows, ?PDO $pdo = null): array
    {
        $hidden = self::privateOrcids($pdo);
        if (!$hidden) {
            return $rows;
        }
        $out = array_values(array_filter($rows, static fn ($r) => !is_array($r) || !isset($hidden[strtoupper((string) ($r['orcid'] ?? ''))])));
        // Peringkat diurutkan ulang agar tidak ada nomor yang "hilang".
        foreach ($out as $i => &$r) {
            if (is_array($r) && array_key_exists('rank', $r)) {
                $r['rank'] = $i + 1;
            }
        }
        return $out;
    }
}
