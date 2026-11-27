<?php

declare(strict_types=1);

namespace Sciecola\Sdg;

use PDO;
use RuntimeException;
use Sciecola\Cache\CacheMigrator;
use Sciecola\Database\Db;
use Sciecola\Integration\SangiaApiClient;
use Throwable;

/**
 * @file src/Sdg/ResearcherProfileService.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Menyusun profil peneliti terpadu (dipakai ResearcherProfile.jsx, MyArticles, MyStatistics).
 *
 * Urutan sumber data:
 *   1. Database sangia_ecosystem — bila peneliti sudah punya profil & karya tertaut
 *      (hasil migrasi cache, antrean crawl, atau kunjungan sebelumnya).
 *   2. Mesin SDG lokal (SdgEngine) — init + batch dalam batas waktu; setiap hasil langsung
 *      disimpan ke database. Bila waktu habis, sisa karya dititipkan ke antrean crawl
 *      dan profil ditandai analysis.complete = false.
 * Metrik dampak diambil dari wizdam-apis (/api/v1/impact/calculate) dengan supplied_works.
 */
final class ResearcherProfileService
{
    private const SDG_COLORS = [
        1 => '#e5243b', 2 => '#dda63a', 3 => '#4c9f38', 4 => '#c5192d',
        5 => '#ff3a21', 6 => '#26bde2', 7 => '#fcc30b', 8 => '#a21942',
        9 => '#fd6925', 10 => '#dd1367', 11 => '#fd9d24', 12 => '#bf8b2e',
        13 => '#3f7e44', 14 => '#0a97d9', 15 => '#56c02b', 16 => '#00689d',
        17 => '#19486a',
    ];

    private const SDG_NAMES = [
        1 => 'No Poverty', 2 => 'Zero Hunger', 3 => 'Good Health & Well-being',
        4 => 'Quality Education', 5 => 'Gender Equality', 6 => 'Clean Water & Sanitation',
        7 => 'Affordable & Clean Energy', 8 => 'Decent Work & Economic Growth',
        9 => 'Industry, Innovation & Infrastructure', 10 => 'Reduced Inequalities',
        11 => 'Sustainable Cities & Communities', 12 => 'Responsible Consumption',
        13 => 'Climate Action', 14 => 'Life Below Water', 15 => 'Life on Land',
        16 => 'Peace, Justice & Strong Institutions', 17 => 'Partnerships for the Goals',
    ];

    private const COUNTRY_MAP = [
        'ID' => 'Indonesia', 'US' => 'United States', 'GB' => 'United Kingdom',
        'AU' => 'Australia', 'MY' => 'Malaysia', 'SG' => 'Singapore',
        'JP' => 'Japan', 'CN' => 'China', 'IN' => 'India', 'DE' => 'Germany',
        'FR' => 'France', 'NL' => 'Netherlands', 'CA' => 'Canada',
    ];

    private const BATCH_LIMIT = 5;
    private const MAX_WORKS   = 200;

    /**
     * @param array{refresh?:bool,time_budget?:float,with_impact?:bool} $opts
     * @return array{status:string,orcid:string,profile:array,works:array,data_source:string,analysis:array}
     */
    public static function build(string $orcid, array $opts = []): array
    {
        $orcid      = strtoupper(trim($orcid));
        $refresh    = (bool) ($opts['refresh'] ?? false);
        $budget     = (float) ($opts['time_budget'] ?? 25.0);
        $withImpact = (bool) ($opts['with_impact'] ?? true);
        $deadline   = microtime(true) + $budget;

        if (!preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
            throw new RuntimeException('invalid ORCID format', 400);
        }

        $loaded = $refresh ? null : self::fromDatabase($orcid);
        if ($loaded !== null) {
            [$personal, $allWorks, $totalWorks] = $loaded;
            $source   = 'database';
            $queued   = self::hasPendingCrawl($orcid);
            $analysis = ['complete' => !$queued, 'analyzed' => count($allWorks), 'total' => $totalWorks, 'queued' => $queued];
        } else {
            [$personal, $allWorks, $totalWorks, $analysis] = self::fromEngine($orcid, $refresh, $deadline);
            $source = 'engine';
        }

        $scopusId = null;
        foreach (($personal['external_ids'] ?? []) as $extId) {
            if (($extId['type'] ?? '') === 'Scopus Author ID') {
                $scopusId = $extId['value'] ?? null;
                break;
            }
        }

        $impactData = null;
        if ($withImpact) {
            $impactData = SangiaApiClient::impact($orcid, $scopusId, $allWorks, $personal,
                max(5.0, $deadline - microtime(true) + 10.0)) ?? [];
        }

        $profile = self::derive($orcid, $personal, $allWorks, $totalWorks, $impactData ?? [], $scopusId);
        $profile['analysisComplete'] = $analysis['complete'];
        if ($impactData) {
            $profile['wizdamImpact'] = [
                'composite' => $impactData['composite'] ?? null,
                'pillars'   => $impactData['pillars'] ?? null,
            ];
        }

        return [
            'status'      => 'success',
            'orcid'       => $orcid,
            'profile'     => $profile,
            'works'       => $allWorks,
            'data_source' => $source,
            'analysis'    => $analysis,
        ];
    }

    // =========================================================================
    // Sumber 1: database
    // =========================================================================

    /** @return array{0:array,1:list<array>,2:int}|null */
    private static function fromDatabase(string $orcid): ?array
    {
        $pdo = Db::pdo();
        if ($pdo === null) {
            return null;
        }
        try {
            $st = $pdo->prepare('SELECT name, given_names, family_name, profile_cache_json FROM researchers WHERE orcid = ?');
            $st->execute([$orcid]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            if (!$r || empty($r['profile_cache_json'])) {
                return null; // belum ada profil (biodata) dari ORCID
            }

            $st = $pdo->prepare(
                'SELECT p.doi, p.title, p.abstract, p.publication_year, p.type, p.volume, p.issue, p.pages,
                        p.publisher, p.citation_count, p.raw_data_json, j.title AS journal
                 FROM publications p
                 LEFT JOIN journals j ON j.id = p.journal_id
                 WHERE p.doi IN (SELECT doi FROM publication_authors WHERE orcid = ?)
                 ORDER BY p.publication_year DESC'
            );
            $st->execute([$orcid]);
            $rows = $st->fetchAll(PDO::FETCH_ASSOC);
            if ($rows === []) {
                return null;
            }
            $rows = array_slice($rows, 0, self::MAX_WORKS);
            $dois = array_column($rows, 'doi');
            $in   = implode(',', array_fill(0, count($dois), '?'));

            $authors = [];
            $st = $pdo->prepare("SELECT doi, name, orcid FROM publication_authors WHERE doi IN ($in) ORDER BY doi, sequence");
            $st->execute($dois);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $a) {
                $authors[$a['doi']][] = ['name' => $a['name'], 'orcid' => $a['orcid']];
            }

            $sdgs = [];
            $st = $pdo->prepare("SELECT doi, sdg_number, confidence FROM work_sdgs WHERE doi IN ($in) ORDER BY confidence DESC");
            $st->execute($dois);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $s) {
                $sdgs[$s['doi']][] = 'SDG' . (int) $s['sdg_number'];
            }

            $works = [];
            foreach ($rows as $p) {
                $raw = json_decode((string) ($p['raw_data_json'] ?? ''), true) ?: [];
                $works[] = [
                    'title'          => $p['title'],
                    'doi'            => $p['doi'],
                    'put_code'       => $raw['put_code'] ?? null,
                    'abstract'       => $p['abstract'] ?? '',
                    'contributors'   => $authors[$p['doi']] ?? [],
                    'journal'        => $p['journal'] ?? '',
                    'volume'         => $p['volume'],
                    'issue'          => $p['issue'],
                    'pages'          => $p['pages'],
                    'year'           => $p['publication_year'] !== null ? (int) $p['publication_year'] : null,
                    'keywords'       => is_array($raw['keywords'] ?? null) ? $raw['keywords'] : [],
                    'work_type'      => $p['type'],
                    'cited_by_count' => (int) $p['citation_count'],
                    'sdgs'           => $sdgs[$p['doi']] ?? [],
                ];
            }

            $personal = json_decode((string) $r['profile_cache_json'], true) ?: [];
            $personal['name']  = ($personal['name'] ?? '') !== '' ? $personal['name'] : $r['name'];
            $personal['orcid'] = $orcid;
            $total = max(count($works), (int) ($personal['total_works'] ?? 0));

            return [$personal, $works, $total];
        } catch (Throwable) {
            return null;
        }
    }

    // =========================================================================
    // Sumber 2: mesin SDG lokal (hasil disimpan ke database)
    // =========================================================================

    /** @return array{0:array,1:list<array>,2:int,3:array} */
    private static function fromEngine(string $orcid, bool $refresh, float $deadline): array
    {
        try {
            $init = SdgEngine::orcidInit($orcid, $refresh);
        } catch (Throwable $e) {
            throw new RuntimeException('ORCID fetch failed: ' . $e->getMessage(), 502);
        }
        self::persist($init, 'profile:orcid_init:' . $orcid);

        $personal   = $init['personal_info'] ?? [];
        $totalWorks = (int) ($init['total_works'] ?? 0);
        $limitWorks = min($totalWorks, self::MAX_WORKS);

        $allWorks = [];
        $offset   = 0;
        while ($offset < $limitWorks && microtime(true) < $deadline) {
            try {
                $batch = SdgEngine::orcidBatch($orcid, $offset, self::BATCH_LIMIT, $refresh);
            } catch (Throwable) {
                break; // sisanya dilanjutkan oleh antrean crawl
            }
            self::persist($batch, "profile:orcid_batch:{$orcid}:{$offset}");
            foreach (($batch['works'] ?? []) as $w) {
                if (is_array($w)) {
                    $allWorks[] = $w;
                }
            }
            $next   = (int) ($batch['next_offset'] ?? ($offset + self::BATCH_LIMIT));
            $offset = max($next, $offset + 1);
            if (!empty($batch['is_done'])) {
                $offset = $limitWorks;
            }
        }

        $complete = $offset >= $limitWorks;
        if (!$complete) {
            try {
                CrawlQueue::enqueue('orcid', $orcid, 6, 'researcher_profile');
            } catch (Throwable) {
                // antrean opsional
            }
        }

        return [$personal, $allWorks, $totalWorks, [
            'complete' => $complete,
            'analyzed' => min($offset, $limitWorks),
            'total'    => $totalWorks,
            'queued'   => !$complete,
        ]];
    }

    /** Apakah sisa analisis peneliti ini masih menunggu di antrean crawl. */
    private static function hasPendingCrawl(string $orcid): bool
    {
        try {
            foreach (CrawlQueue::read() as $job) {
                if (($job['identifier'] ?? '') === $orcid && in_array($job['status'] ?? '', ['pending', 'running'], true)) {
                    return true;
                }
            }
        } catch (Throwable) {
        }
        return false;
    }

    /** Menyimpan hasil mesin ke database (diam-diam dilewati bila DB tidak tersedia). */
    private static function persist(array $payload, string $label): void
    {
        $pdo = Db::pdo();
        if ($pdo === null) {
            return;
        }
        try {
            $root = defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2);
            (new CacheMigrator($pdo, $root . '/cache'))->migrateData($payload, $label);
        } catch (Throwable) {
            // tampilan tetap jalan walau penyimpanan gagal
        }
    }

    // =========================================================================
    // Penyusunan profil (logika asli api/wrapper/researcher_profile.php)
    // =========================================================================

    private static function derive(string $orcid, array $personal, array $allWorks, int $totalWorks, array $impactData, ?string $scopusId): array
    {
        // Publication trend
        $yearCounts   = [];
        $firstPubYear = null;
        foreach ($allWorks as $work) {
            $year = (int)($work['year'] ?? 0);
            if ($year < 1980 || $year > 2100) continue;
            $yearCounts[$year] = ($yearCounts[$year] ?? 0) + 1;
            if ($firstPubYear === null || $year < $firstPubYear) $firstPubYear = $year;
        }
        ksort($yearCounts);
        $publicationTrend = array_values(array_map(
            fn($y, $c) => ['year' => (string)$y, 'count' => $c],
            array_keys($yearCounts),
            array_values($yearCounts)
        ));

        // Collaborators (unique contributors, counted by co-occurrences)
        $collaboratorMap = [];
        foreach ($allWorks as $work) {
            foreach (($work['contributors'] ?? []) as $c) {
                $name = trim($c['name'] ?? '');
                if (empty($name)) continue;
                if (!isset($collaboratorMap[$name])) {
                    $collaboratorMap[$name] = ['count' => 0, 'orcid' => $c['orcid'] ?? null];
                }
                $collaboratorMap[$name]['count']++;
            }
        }
        uasort($collaboratorMap, fn($a, $b) => $b['count'] - $a['count']);
        $collaborators = [];
        $idx = 1;
        foreach (array_slice($collaboratorMap, 0, 20, true) as $cName => $meta) {
            $collaborators[] = [
                'id'             => $idx++,
                'name'           => $cName,
                'univ'           => '',
                'avatar'         => null,
                'collaborations' => $meta['count'],
                'orcid'          => $meta['orcid'],
            ];
        }

        // SDG focus (from classified works)
        $sdgCounts = [];
        foreach ($allWorks as $work) {
            foreach (($work['sdgs'] ?? []) as $sdg) {
                $n = (int)preg_replace('/[^0-9]/', '', (string)$sdg);
                if ($n >= 1 && $n <= 17) $sdgCounts[$n] = ($sdgCounts[$n] ?? 0) + 1;
            }
        }
        arsort($sdgCounts);
        $totalSdg = max(1, array_sum($sdgCounts));
        $sdgFocus = [];
        foreach ($sdgCounts as $n => $cnt) {
            $sdgFocus[] = [
                'sdg'        => $n,
                'name'       => self::SDG_NAMES[$n] ?? "SDG $n",
                'percentage' => (int)round($cnt / $totalSdg * 100),
                'color'      => self::SDG_COLORS[$n] ?? '#6b7280',
                'count'      => $cnt,
            ];
        }

        // Top keywords (from works, excluding generic SDG keywords)
        $stopWords  = ['partnerships','global cooperation','sustainable development','international support'];
        $kwFreq = [];
        foreach ($allWorks as $work) {
            foreach (($work['keywords'] ?? []) as $kw) {
                $kw = strtolower(trim($kw));
                if (strlen($kw) < 3 || strlen($kw) > 60 || in_array($kw, $stopWords)) continue;
                $kwFreq[$kw] = ($kwFreq[$kw] ?? 0) + 1;
            }
        }
        // Also add researcher's own keywords
        foreach (($personal['keywords'] ?? []) as $kw) {
            $kw = strtolower(trim($kw));
            if (!empty($kw)) $kwFreq[$kw] = ($kwFreq[$kw] ?? 0) + 10;
        }
        arsort($kwFreq);
        $topKeywords = [];
        foreach (array_slice($kwFreq, 0, 20, true) as $text => $freq) {
            $topKeywords[] = ['text' => ucwords($text), 'size' => min(40, max(10, $freq * 3))];
        }

        // Recent publications (sorted newest first)
        usort($allWorks, fn($a, $b) => (int)($b['year'] ?? 0) - (int)($a['year'] ?? 0));
        $recentPublications = [];
        foreach (array_slice($allWorks, 0, 20) as $i => $work) {
            $sdgsNum = array_values(array_filter(
                array_map(fn($s) => (int)preg_replace('/[^0-9]/', '', (string)$s), $work['sdgs'] ?? []),
                fn($n) => $n >= 1 && $n <= 17
            ));
            $recentPublications[] = [
                'id'        => $i + 1,
                'doi'       => $work['doi'] ?? null,
                'title'     => $work['title'] ?? '',
                'journal'   => $work['journal'] ?? '',
                'year'      => (int)($work['year'] ?? 0),
                'sdgs'      => $sdgsNum,
                'views'     => 0,
                'citations' => (int)($work['cited_by_count'] ?? $work['citations'] ?? 0),
                'abstract'  => $work['abstract'] ?? '',
                'authors'   => array_map(fn($c) => $c['name'] ?? '', $work['contributors'] ?? []),
                'put_code'  => $work['put_code'] ?? null,
                'thumbnail' => null,
            ];
        }

        // Affiliations from personal_info
        $affiliations = [];
        $affSeen = [];
        foreach (($personal['affiliations'] ?? []) as $aff) {
            $org = trim($aff['organization'] ?? '');
            if (empty($org) || in_array($org, $affSeen)) continue;
            $affSeen[] = $org;
            $affiliations[] = [
                'name'       => $org,
                'department' => $aff['department'] ?? null,
                'role'       => $aff['role'] ?? null,
                'is_current' => (bool)($aff['is_current'] ?? false),
                'articles'   => 0,
                'percentage' => 0,
                'logo'       => null,
            ];
        }
        if (!empty($affiliations)) {
            $affiliations[0]['articles']   = $totalWorks;
            $affiliations[0]['percentage'] = 100;
        }

        // Personal fields
        $primaryAff  = $personal['affiliations'][0] ?? [];
        $address     = $primaryAff['address'] ?? [];
        $countryCode = $address['country'] ?? '';
        $country     = self::COUNTRY_MAP[$countryCode] ?? ($countryCode ?: 'Unknown');
        $city        = $address['city'] ?? '';
        $location    = $city ? "$city, $country" : $country;

        $scopusUrl = null;
        foreach (($personal['external_ids'] ?? []) as $extId) {
            if (($extId['type'] ?? '') === 'Scopus Author ID') {
                $scopusUrl = $extId['url'] ?? null;
                break;
            }
        }

        // Metrik dampak: academic_metrics dari wizdam-apis (Scopus) bila tersedia; selain itu
        // dihitung dari jumlah sitasi per karya (cited_by_count OpenAlex di data mesin SDG).
        $academic      = is_array($impactData['academic_metrics'] ?? null) ? $impactData['academic_metrics'] : [];
        $workCitations = array_map(fn($w) => (int)($w['cited_by_count'] ?? $w['citations'] ?? 0), $allWorks);
        rsort($workCitations);
        $hFromWorks = 0;
        foreach ($workCitations as $idx => $c) {
            if ($c >= $idx + 1) { $hFromWorks = $idx + 1; } else { break; }
        }
        $totalCitations = (int)($academic['citation_count'] ?? 0) ?: array_sum($workCitations);
        $hIndex         = (int)($academic['h_index'] ?? 0) ?: $hFromWorks;
        $i10Index       = count(array_filter($workCitations, fn($c) => $c >= 10));
        $citationTrend  = [];

        return [
                // Identity
                'name'         => $personal['name'] ?? '',
                'orcid'        => $orcid,
                'avatar'       => null,
                'verified'     => false,
                'title'        => $primaryAff['role'] ?? 'Researcher',
                'univ'         => $personal['institutions'][0] ?? ($primaryAff['organization'] ?? ''),
                'department'   => $primaryAff['department'] ?? '',
                'location'     => $location,
                'email'        => $personal['emails'][0] ?? null,
                'scopusId'     => $scopusId,
                'researcherId' => null,
                'country'      => $country,
                'bio'          => $personal['bio'] ?? null,

                // Metrics
                'publications'       => $totalWorks,
                'citations'          => $totalCitations,
                'hIndex'             => $hIndex,
                'i10Index'           => $i10Index,
                'collaboratorsCount' => count($collaborators),
                'views'              => 0,
                'downloads'          => 0,
                'sdgsInvolved'       => count($sdgCounts),
                'yearsActive'        => $firstPubYear ? "$firstPubYear - Sekarang" : 'N/A',
                'firstPublication'   => $firstPubYear ?? 0,

                // Research
                'researchInterests' => $personal['keywords'] ?? [],
                'sdgFocus'          => $sdgFocus,
                'topKeywords'       => $topKeywords,

                // Trends
                'publicationTrend' => $publicationTrend,
                'citationTrend'    => $citationTrend,

                // Collections
                'recentPublications' => $recentPublications,
                'collaborators'      => $collaborators,
                'affiliations'       => $affiliations,

                // Links
                'socialLinks' => [
                    'googleScholar' => null,
                    'scopus'        => $scopusUrl,
                    'orcid'         => "https://orcid.org/$orcid",
                    'linkedin'      => null,
                    'researchgate'  => null,
                ],
            ];
    }
}
