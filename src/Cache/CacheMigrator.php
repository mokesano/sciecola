<?php

declare(strict_types=1);

namespace Sciecola\Cache;

use PDO;
use Throwable;

/**
 * @file src/Cache/CacheMigrator.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Memigrasikan file cache mesin SDG (api/sdgs) ke tabel unified schema.
 *
 * Sumber  : ROOT_PATH/cache/*.json.gz | *.json  (gzip, zlib, atau JSON polos)
 * Tujuan  : researchers, journals, publications, publication_authors, work_sdgs
 * Jejak   : cache_migration_log (satu baris per file cache)
 *
 * Format cache yang dikenali (semua dihasilkan oleh api/sdgs/SDG_Classification_API.php
 * dari berbagai versi):
 *   - orcid_init_*   : personal_info + works_stubs (judul, DOI, put_code)
 *   - orcid_*        : profil penuh (personal_info|researcher) + works[] berSDG
 *   - orcid_batch_*  : potongan works[] berSDG milik satu ORCID
 *   - article_*      : satu DOI berSDG
 *
 * Prinsip:
 *   - Karya tanpa DOI tidak dimigrasikan.
 *   - Metadata digabung (nilai kosong tidak menimpa nilai yang sudah ada).
 *   - Hasil SDG per DOI: hanya klasifikasi TERBARU (menurut timestamp sumber) yang disimpan,
 *     dengan label versinya di work_sdgs.sdg_version.
 *   - Setiap file diproses dalam transaksi sendiri dan dicatat di cache_migration_log.
 *   - File hanya dipindahkan ke arsip, tidak pernah dihapus.
 */
class CacheMigrator
{
    public const LOG_TABLE = 'cache_migration_log';

    /** File di folder cache yang bukan cache SDG. */
    private const IGNORED_FILES = ['crawl_queue.json'];

    /** Urutan proses: identitas peneliti dulu, lalu karya. */
    private const TYPE_PRIORITY = ['orcid_init' => 0, 'orcid_profile' => 1, 'orcid_batch' => 2, 'article' => 3, 'unknown' => 9];

    private PDO $pdo;
    private string $cacheDir;
    private string $driver;

    /** @var array<string,bool> cache keberadaan ORCID di tabel researchers */
    private array $researcherExists = [];

    /** @var array<string,int> cache id jurnal per judul */
    private array $journalIds = [];

    public function __construct(PDO $pdo, string $cacheDir)
    {
        $this->pdo      = $pdo;
        $this->cacheDir = rtrim($cacheDir, '/\\');
        $this->driver   = (string) $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    // =========================================================================
    // Public API
    // =========================================================================

    /** Membuat tabel log migrasi bila belum ada. */
    public function ensureLogTable(): void
    {
        if ($this->driver === 'sqlite') {
            $sql = 'CREATE TABLE IF NOT EXISTS ' . self::LOG_TABLE . ' (
                file_name    VARCHAR(255) PRIMARY KEY,
                file_type    VARCHAR(20)  NOT NULL,
                status       VARCHAR(10)  NOT NULL,
                message      VARCHAR(500) NULL,
                records_json TEXT         NULL,
                file_size    INTEGER      NOT NULL DEFAULT 0,
                file_mtime   INTEGER      NOT NULL DEFAULT 0,
                processed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                archived_at  TIMESTAMP    NULL,
                archive_path VARCHAR(255) NULL
            )';
        } elseif ($this->driver === 'pgsql') {
            $sql = 'CREATE TABLE IF NOT EXISTS ' . self::LOG_TABLE . ' (
                file_name    VARCHAR(255) PRIMARY KEY,
                file_type    VARCHAR(20)  NOT NULL,
                status       VARCHAR(10)  NOT NULL,
                message      VARCHAR(500) NULL,
                records_json TEXT         NULL,
                file_size    BIGINT       NOT NULL DEFAULT 0,
                file_mtime   BIGINT       NOT NULL DEFAULT 0,
                processed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                archived_at  TIMESTAMP    NULL,
                archive_path VARCHAR(255) NULL
            )';
        } else {
            $sql = 'CREATE TABLE IF NOT EXISTS ' . self::LOG_TABLE . " (
                file_name    VARCHAR(255) NOT NULL PRIMARY KEY,
                file_type    VARCHAR(20)  NOT NULL,
                status       ENUM('migrated','skipped','failed') NOT NULL,
                message      VARCHAR(500) NULL,
                records_json TEXT         NULL COMMENT 'Ringkasan baris yang ditulis',
                file_size    INT UNSIGNED NOT NULL DEFAULT 0,
                file_mtime   INT UNSIGNED NOT NULL DEFAULT 0,
                processed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                archived_at  TIMESTAMP    NULL,
                archive_path VARCHAR(255) NULL,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        }
        $this->pdo->exec($sql);
    }

    /**
     * Ringkasan status cache & database untuk halaman admin.
     *
     * @return array<string,mixed>
     */
    public function status(): array
    {
        $files  = $this->listFiles();
        $logged = $this->loggedFiles();

        $byType   = [];
        $counts   = ['pending' => 0, 'migrated' => 0, 'skipped' => 0, 'failed' => 0];
        $bytes    = 0;
        foreach ($files as $f) {
            $byType[$f['type']] = ($byType[$f['type']] ?? 0) + 1;
            $bytes += $f['size'];
            $state = $this->fileState($f, $logged);
            $counts[$state]++;
        }

        $archived = (int) $this->pdo->query(
            'SELECT COUNT(*) FROM ' . self::LOG_TABLE . ' WHERE archived_at IS NOT NULL'
        )->fetchColumn();

        $db = [];
        foreach (['researchers', 'publications', 'publication_authors', 'journals', 'work_sdgs'] as $table) {
            try {
                $db[$table] = (int) $this->pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
            } catch (Throwable) {
                $db[$table] = null; // tabel belum dibuat
            }
        }

        $lastRun = $this->pdo->query('SELECT MAX(processed_at) FROM ' . self::LOG_TABLE)->fetchColumn();

        return [
            'files' => [
                'total'      => count($files),
                'size_kb'    => round($bytes / 1024, 1),
                'by_type'    => $byType ?: new \stdClass(),
                'pending'    => $counts['pending'],
                'migrated'   => $counts['migrated'],
                'skipped'    => $counts['skipped'],
                'failed'     => $counts['failed'],
                'archived'   => $archived,
            ],
            'db'       => $db,
            'last_run' => $lastRun ?: null,
        ];
    }

    /**
     * Memproses satu batch file yang belum dimigrasikan.
     *
     * @param int  $limit        Jumlah file maksimum per panggilan
     * @param bool $retryFailed  Ikutkan file yang sebelumnya gagal
     * @param float $timeBudget  Batas waktu (detik) agar aman dari max_execution_time hosting
     * @return array<string,mixed>
     */
    public function migrateBatch(int $limit = 25, bool $retryFailed = false, float $timeBudget = 20.0): array
    {
        $started = microtime(true);
        $files   = $this->listFiles();
        $logged  = $this->loggedFiles();

        $queue = [];
        foreach ($files as $f) {
            $state = $this->fileState($f, $logged);
            if ($state === 'pending' || ($retryFailed && $state === 'failed')) {
                $queue[] = $f;
            }
        }

        $results = [];
        $totals  = ['migrated' => 0, 'skipped' => 0, 'failed' => 0];

        foreach ($queue as $i => $file) {
            if ($i >= $limit || (microtime(true) - $started) > $timeBudget) {
                break;
            }
            $r = $this->migrateFile($file);
            $totals[$r['status']]++;
            $results[] = $r;
        }

        $remaining = count($queue) - count($results);

        return [
            'processed' => count($results),
            'totals'    => $totals,
            'remaining' => $remaining,
            'done'      => $remaining === 0,
            'elapsed'   => round(microtime(true) - $started, 2),
            'results'   => $results,
        ];
    }

    /**
     * Memindahkan file yang sudah berstatus migrated/skipped ke cache/archive/<waktu>/.
     * File pending atau failed tidak disentuh.
     *
     * @return array<string,mixed>
     */
    public function archiveMigrated(): array
    {
        $rows = $this->pdo->query(
            'SELECT file_name, file_mtime, file_size FROM ' . self::LOG_TABLE
            . " WHERE status IN ('migrated','skipped') AND archived_at IS NULL"
        )->fetchAll(PDO::FETCH_ASSOC);

        $relDir  = 'archive/' . date('Ymd_His');
        $absDir  = $this->cacheDir . '/' . $relDir;
        $moved   = 0;
        $missing = 0;
        $changed = 0;
        $errors  = [];

        $upd = $this->pdo->prepare(
            'UPDATE ' . self::LOG_TABLE . ' SET archived_at = CURRENT_TIMESTAMP, archive_path = ? WHERE file_name = ?'
        );

        foreach ($rows as $row) {
            $src = $this->cacheDir . '/' . $row['file_name'];
            if (!is_file($src)) {
                $missing++;
                continue;
            }
            // File berubah sejak dimigrasikan → biarkan agar dimigrasikan ulang.
            if ((int) filemtime($src) !== (int) $row['file_mtime'] || (int) filesize($src) !== (int) $row['file_size']) {
                $changed++;
                continue;
            }
            if (!is_dir($absDir) && !@mkdir($absDir, 0750, true) && !is_dir($absDir)) {
                return ['moved' => 0, 'errors' => ["Tidak bisa membuat folder arsip: cache/{$relDir}"]];
            }
            if (@rename($src, $absDir . '/' . $row['file_name'])) {
                $upd->execute([$relDir, $row['file_name']]);
                $moved++;
            } else {
                $errors[] = $row['file_name'];
            }
        }

        return [
            'moved'        => $moved,
            'archive_path' => $moved > 0 ? 'cache/' . $relDir : null,
            'missing'      => $missing,
            'changed'      => $changed,
            'errors'       => array_slice($errors, 0, 20),
        ];
    }

    // =========================================================================
    // File discovery
    // =========================================================================

    /**
     * Daftar file cache di folder utama (tidak rekursif; folder sessions/ dan archive/ diabaikan).
     *
     * @return list<array{name:string,path:string,type:string,size:int,mtime:int}>
     */
    public function listFiles(): array
    {
        if (!is_dir($this->cacheDir)) {
            return [];
        }
        $paths = array_merge(
            glob($this->cacheDir . '/*.json.gz') ?: [],
            glob($this->cacheDir . '/*.json') ?: []
        );

        $files = [];
        foreach ($paths as $path) {
            $name = basename($path);
            if (in_array($name, self::IGNORED_FILES, true) || !is_file($path)) {
                continue;
            }
            $files[] = [
                'name'  => $name,
                'path'  => $path,
                'type'  => self::typeFromName($name),
                'size'  => (int) filesize($path),
                'mtime' => (int) filemtime($path),
            ];
        }

        usort($files, static function (array $a, array $b): int {
            $pa = self::TYPE_PRIORITY[$a['type']] ?? 9;
            $pb = self::TYPE_PRIORITY[$b['type']] ?? 9;
            return $pa <=> $pb ?: strcmp($a['name'], $b['name']);
        });

        return $files;
    }

    public static function typeFromName(string $name): string
    {
        return match (true) {
            str_starts_with($name, 'orcid_init_')  => 'orcid_init',
            str_starts_with($name, 'orcid_batch_') => 'orcid_batch',
            str_starts_with($name, 'orcid_')       => 'orcid_profile',
            str_starts_with($name, 'article_')     => 'article',
            default                                => 'unknown',
        };
    }

    /** @return array<string,array{status:string,file_mtime:int,file_size:int}> */
    private function loggedFiles(): array
    {
        $out  = [];
        $stmt = $this->pdo->query(
            'SELECT file_name, status, file_mtime, file_size FROM ' . self::LOG_TABLE . ' WHERE archived_at IS NULL'
        );
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $out[$row['file_name']] = $row;
        }
        return $out;
    }

    /** pending | migrated | skipped | failed — file yang berubah sejak dicatat dianggap pending lagi. */
    private function fileState(array $file, array $logged): string
    {
        $log = $logged[$file['name']] ?? null;
        if ($log === null) {
            return 'pending';
        }
        if ((int) $log['file_mtime'] !== $file['mtime'] || (int) $log['file_size'] !== $file['size']) {
            return 'pending';
        }
        return (string) $log['status'];
    }

    // =========================================================================
    // Per-file migration
    // =========================================================================

    /** @return array{file:string,type:string,status:string,message:string,records:array<string,int>} */
    private function migrateFile(array $file): array
    {
        $records = ['researchers' => 0, 'publications' => 0, 'authors' => 0, 'sdg_rows' => 0, 'no_doi' => 0];
        $status  = 'migrated';
        $message = '';

        try {
            $data = self::decodeFile($file['path']);
            if (!is_array($data)) {
                throw new MigrationSkip('Isi file tidak bisa dibaca (bukan gzip/zlib/JSON yang valid)');
            }
            if (($data['status'] ?? 'success') === 'error') {
                throw new MigrationSkip('Cache berisi respons error dari mesin SDG');
            }

            $this->pdo->beginTransaction();
            $message = $this->migratePayload($file, $data, $records);
            $this->pdo->commit();

            if ($records['publications'] === 0 && $records['researchers'] === 0) {
                $status  = 'skipped';
                $message = $message ?: 'Tidak ada data yang bisa dimigrasikan';
            }
        } catch (MigrationSkip $e) {
            $this->rollBack();
            $status  = 'skipped';
            $message = $e->getMessage();
        } catch (Throwable $e) {
            $this->rollBack();
            $status  = 'failed';
            $message = mb_substr($e->getMessage(), 0, 480);
        }

        $this->writeLog($file, $status, $message, $records);

        return [
            'file'    => $file['name'],
            'type'    => $file['type'],
            'status'  => $status,
            'message' => $message,
            'records' => $records,
        ];
    }

    /** Mengarahkan payload ke migrator sesuai bentuk datanya. */
    private function migratePayload(array $file, array $data, array &$records): string
    {
        $timestamp = self::sourceTimestamp($data, $file['mtime']);
        $version   = self::versionLabel($data['api_version'] ?? null);
        $orcid     = self::detectOrcid($data, $file['name']);

        // Artikel tunggal
        if (isset($data['doi']) && !isset($data['works']) && !isset($data['works_stubs'])) {
            $this->migrateWork($data, null, $version, $timestamp, $records);
            return $records['publications'] ? 'DOI ' . self::normalizeDoi((string) $data['doi']) : 'Artikel tanpa DOI/judul';
        }

        if ($orcid === null) {
            throw new MigrationSkip('ORCID tidak ditemukan di file maupun nama file');
        }

        $person = $data['personal_info'] ?? $data['researcher'] ?? null;
        if (is_array($person) || isset($data['researcher_sdg_summary'])) {
            $this->upsertResearcherProfile($orcid, is_array($person) ? $person : [], $data, $timestamp);
            $records['researchers']++;
        } else {
            $this->ensureResearcher($orcid, null, $timestamp);
        }

        // orcid_init: daftar karya tanpa SDG
        foreach (($data['works_stubs'] ?? []) as $stub) {
            if (is_array($stub)) {
                $this->migrateWork($stub, $orcid, $version, $timestamp, $records, false);
            }
        }

        // orcid_profile & orcid_batch: karya berSDG
        foreach (($data['works'] ?? []) as $work) {
            if (is_array($work)) {
                $this->migrateWork($work, $orcid, $version, $timestamp, $records);
            }
        }

        return sprintf('ORCID %s: %d karya', $orcid, $records['publications']);
    }

    // =========================================================================
    // Researchers
    // =========================================================================

    private function upsertResearcherProfile(string $orcid, array $person, array $data, int $timestamp): void
    {
        $name = trim((string) ($person['name'] ?? ''));
        if ($name === '' || str_starts_with($name, 'Peneliti ')) {
            $name = null; // nama fallback mesin SDG, jangan timpa nama asli
        }

        $profile = $person;
        foreach (['researcher_sdg_summary', 'contributor_profile', 'researcher_sdg_contributions', 'total_works'] as $k) {
            if (isset($data[$k])) {
                $profile[$k] = $data[$k];
            }
        }
        $profile['_source_timestamp'] = date('c', $timestamp);

        $this->ensureResearcher($orcid, $name, $timestamp);

        // Hanya timpa profil bila sumber ini lebih baru dari yang tersimpan.
        $current = $this->fetchValue('SELECT profile_cache_json FROM researchers WHERE orcid = ?', [$orcid]);
        $currentTs = 0;
        if (is_string($current) && $current !== '') {
            $decoded   = json_decode($current, true);
            $currentTs = isset($decoded['_source_timestamp']) ? (int) strtotime((string) $decoded['_source_timestamp']) : 0;
        }
        if ($timestamp < $currentTs) {
            return;
        }

        [$given, $family] = $name !== null ? self::splitName($name) : [null, null];

        $sql = 'UPDATE researchers SET profile_cache_json = ?, cache_expires_at = ?, updated_at = CURRENT_TIMESTAMP'
             . ($name !== null ? ', name = ?, given_names = ?, family_name = ?' : '')
             . ' WHERE orcid = ?';
        $params = [json_encode($profile, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE), date('Y-m-d H:i:s', $timestamp + 7 * 86400)];
        if ($name !== null) {
            array_push($params, self::cut($name, 255), self::cut($given, 150), self::cut($family, 150));
        }
        $params[] = $orcid;
        $this->pdo->prepare($sql)->execute($params);
    }

    /** Memastikan baris researchers ada (nama sementara = ORCID bila belum diketahui). */
    private function ensureResearcher(string $orcid, ?string $name, int $timestamp): void
    {
        if (!empty($this->researcherExists[$orcid])) {
            return;
        }
        $exists = $this->fetchValue('SELECT 1 FROM researchers WHERE orcid = ?', [$orcid]);
        if (!$exists) {
            [$given, $family] = $name !== null ? self::splitName($name) : [null, null];
            $this->pdo->prepare(
                'INSERT INTO researchers (orcid, name, given_names, family_name, cache_expires_at) VALUES (?, ?, ?, ?, ?)'
            )->execute([
                $orcid,
                self::cut($name ?? $orcid, 255),
                self::cut($given, 150),
                self::cut($family, 150),
                date('Y-m-d H:i:s', $timestamp + 7 * 86400),
            ]);
        }
        $this->researcherExists[$orcid] = true;
    }

    private function researcherKnown(string $orcid): bool
    {
        if (!isset($this->researcherExists[$orcid])) {
            $this->researcherExists[$orcid] = (bool) $this->fetchValue('SELECT 1 FROM researchers WHERE orcid = ?', [$orcid]);
        }
        return $this->researcherExists[$orcid];
    }

    // =========================================================================
    // Works → publications, journals, publication_authors, work_sdgs
    // =========================================================================

    private function migrateWork(
        array $work,
        ?string $ownerOrcid,
        string $version,
        int $timestamp,
        array &$records,
        bool $withSdg = true
    ): void {
        $doi = self::normalizeDoi((string) ($work['doi'] ?? ''));
        if ($doi === '') {
            $records['no_doi']++;
            return; // karya tanpa DOI tidak dimigrasikan
        }

        $title = $work['title'] ?? '';
        if (is_array($title)) {
            $title = (string) ($title[0] ?? '');
        }
        $title = trim(html_entity_decode((string) $title, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        if ($title === '') {
            return;
        }

        $journalTitle = trim((string) ($work['journal'] ?? $work['journal_title'] ?? ''));
        $journalId    = $journalTitle !== '' ? $this->journalId($journalTitle, $work['publisher'] ?? null) : null;

        $abstract = trim((string) ($work['abstract'] ?? ''));
        $year     = self::extractYear($work);
        $type     = $work['work_type'] ?? $work['type'] ?? null;
        $cited    = isset($work['cited_by_count']) && is_numeric($work['cited_by_count']) ? (int) $work['cited_by_count'] : 0;

        $raw = $work;
        unset($raw['detailed_analysis']); // detail SDG disimpan di work_sdgs

        $this->upsert('publications', [
            'doi'              => $doi,
            'title'            => self::cut($title, 1024),
            'abstract'         => $abstract !== '' ? $abstract : null,
            'publication_year' => $year,
            'type'             => self::cut(is_string($type) && $type !== '' ? $type : null, 50),
            'journal_id'       => $journalId,
            'volume'           => self::cut(self::str($work['volume'] ?? null), 20),
            'issue'            => self::cut(self::str($work['issue'] ?? null), 20),
            'pages'            => self::cut(self::str($work['pages'] ?? null), 50),
            'publisher'        => self::cut(self::str($work['publisher'] ?? null), 255),
            'citation_count'   => $cited,
            'raw_data_json'    => json_encode($raw, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
        ], ['doi'], [
            'title'            => 'keep_longer',
            'abstract'         => 'coalesce',
            'publication_year' => 'coalesce',
            'type'             => 'coalesce',
            'journal_id'       => 'coalesce',
            'volume'           => 'coalesce',
            'issue'            => 'coalesce',
            'pages'            => 'coalesce',
            'publisher'        => 'coalesce',
            'citation_count'   => 'greatest',
            'raw_data_json'    => 'new',
        ]);
        $records['publications']++;

        $records['authors'] += $this->syncAuthors($doi, $work, $ownerOrcid);

        if ($withSdg) {
            $records['sdg_rows'] += $this->syncSdgs($doi, $work, $version, $timestamp);
        }
    }

    private function journalId(string $title, mixed $publisher): int
    {
        $title = self::cut($title, 512);
        $key   = mb_strtolower($title);
        if (isset($this->journalIds[$key])) {
            return $this->journalIds[$key];
        }
        $id = $this->fetchValue('SELECT id FROM journals WHERE title = ? LIMIT 1', [$title]);
        if (!$id) {
            $this->pdo->prepare('INSERT INTO journals (title, publisher) VALUES (?, ?)')
                ->execute([$title, self::cut(self::str($publisher), 255)]);
            $id = $this->pdo->lastInsertId();
        }
        return $this->journalIds[$key] = (int) $id;
    }

    /**
     * Menulis daftar penulis. Daftar diganti hanya bila sumber baru setidaknya selengkap yang ada.
     * Pemilik ORCID file dicocokkan ke salah satu penulis berdasarkan nama.
     */
    private function syncAuthors(string $doi, array $work, ?string $ownerOrcid): int
    {
        $authors = self::parseAuthors($work['contributors'] ?? $work['authors'] ?? []);
        $existing = (int) $this->fetchValue('SELECT COUNT(*) FROM publication_authors WHERE doi = ?', [$doi]);

        if ($authors === [] && $existing === 0 && $ownerOrcid !== null) {
            // Karya stub tanpa daftar penulis: catat pemilik ORCID sebagai penulis.
            $ownerName = (string) $this->fetchValue('SELECT name FROM researchers WHERE orcid = ?', [$ownerOrcid]);
            $authors   = [['name' => $ownerName !== '' ? $ownerName : $ownerOrcid, 'orcid' => $ownerOrcid]];
        }

        if ($authors !== [] && count($authors) >= $existing) {
            $this->pdo->prepare('DELETE FROM publication_authors WHERE doi = ?')->execute([$doi]);
            $ins = $this->pdo->prepare(
                'INSERT INTO publication_authors (doi, orcid, name, given_names, family_name, sequence) VALUES (?, ?, ?, ?, ?, ?)'
            );
            foreach (array_values($authors) as $i => $a) {
                $orcid = $a['orcid'] && $this->researcherKnown($a['orcid']) ? $a['orcid'] : null;
                [$given, $family] = self::splitName($a['name']);
                $ins->execute([$doi, $orcid, self::cut($a['name'], 255), self::cut($given, 150), self::cut($family, 150), min($i + 1, 255)]);
            }
            $written = count($authors);
        } else {
            $written = 0;
        }

        if ($ownerOrcid !== null) {
            $this->linkOwner($doi, $ownerOrcid);
        }

        return $written;
    }

    /** Menautkan pemilik ORCID ke baris penulis yang namanya cocok. */
    private function linkOwner(string $doi, string $ownerOrcid): void
    {
        if ($this->fetchValue('SELECT 1 FROM publication_authors WHERE doi = ? AND orcid = ?', [$doi, $ownerOrcid])) {
            return;
        }
        $ownerName = (string) $this->fetchValue('SELECT name FROM researchers WHERE orcid = ?', [$ownerOrcid]);
        $ownerTokens = self::nameTokens($ownerName);
        if ($ownerTokens === []) {
            return;
        }

        $stmt = $this->pdo->prepare('SELECT id, name FROM publication_authors WHERE doi = ? AND orcid IS NULL ORDER BY sequence');
        $stmt->execute([$doi]);
        $best = null;
        $bestScore = 0;
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $score = count(array_intersect($ownerTokens, self::nameTokens((string) $row['name'])));
            if ($score > $bestScore) {
                $best = (int) $row['id'];
                $bestScore = $score;
            }
        }
        if ($best !== null) {
            $this->pdo->prepare('UPDATE publication_authors SET orcid = ? WHERE id = ?')->execute([$ownerOrcid, $best]);
        }
    }

    /**
     * Menyimpan SDG hasil klasifikasi. Satu DOI hanya menyimpan klasifikasi terbaru.
     */
    private function syncSdgs(string $doi, array $work, string $version, int $timestamp): int
    {
        $confidence = is_array($work['sdg_confidence'] ?? null) ? $work['sdg_confidence'] : [];
        $sdgs       = is_array($work['sdgs'] ?? null) ? $work['sdgs'] : null;

        // Format v5.2.2 (ringkas): hanya sdg_scores
        if ($sdgs === null && is_array($work['sdg_scores'] ?? null)) {
            $sdgs = [];
            foreach ($work['sdg_scores'] as $code => $score) {
                if (is_numeric($score) && (float) $score >= 0.30) {
                    $sdgs[] = $code;
                    $confidence[$code] = (float) $score;
                }
            }
        }
        if ($sdgs === null) {
            return 0; // tidak ada hasil klasifikasi di sumber ini
        }

        $latest = $this->fetchValue('SELECT MAX(classified_at) FROM work_sdgs WHERE doi = ?', [$doi]);
        if ($latest && strtotime((string) $latest) > $timestamp) {
            return 0; // sudah ada klasifikasi yang lebih baru
        }

        $this->pdo->prepare('DELETE FROM work_sdgs WHERE doi = ?')->execute([$doi]);

        $detailed     = is_array($work['detailed_analysis'] ?? null) ? $work['detailed_analysis'] : [];
        $contributors = is_array($work['contributor_types'] ?? null) ? $work['contributor_types'] : [];
        $pathways     = is_array($work['contribution_pathways'] ?? null) ? $work['contribution_pathways'] : [];

        $ins = $this->pdo->prepare(
            'INSERT INTO work_sdgs (doi, sdg_number, sdg_version, confidence, classification_detail, classified_at) VALUES (?, ?, ?, ?, ?, ?)'
        );

        $written = 0;
        $seen    = [];
        foreach ($sdgs as $code) {
            $n = (int) preg_replace('/\D/', '', (string) $code);
            if ($n < 1 || $n > 17 || isset($seen[$n])) {
                continue;
            }
            $seen[$n] = true;
            $key  = 'SDG' . $n;
            $conf = isset($confidence[$key]) && is_numeric($confidence[$key])
                ? max(0.0, min(1.0, (float) $confidence[$key]))
                : null;
            $detail = array_filter([
                'analysis'             => $detailed[$key] ?? null,
                'contributor_type'     => $contributors[$key] ?? null,
                'contribution_pathway' => $pathways[$key] ?? null,
                'source_version'       => $version,
            ], static fn ($v) => $v !== null);

            $ins->execute([
                $doi, $n, $version,
                $conf !== null ? round($conf, 4) : null,
                json_encode($detail, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
                date('Y-m-d H:i:s', $timestamp),
            ]);
            $written++;
        }
        return $written;
    }

    // =========================================================================
    // Log
    // =========================================================================

    private function writeLog(array $file, string $status, string $message, array $records): void
    {
        $this->upsert(self::LOG_TABLE, [
            'file_name'    => $file['name'],
            'file_type'    => $file['type'],
            'status'       => $status,
            'message'      => self::cut($message, 500),
            'records_json' => json_encode($records, JSON_INVALID_UTF8_SUBSTITUTE),
            'file_size'    => $file['size'],
            'file_mtime'   => $file['mtime'],
            'processed_at' => date('Y-m-d H:i:s'),
            'archived_at'  => null,
            'archive_path' => null,
        ], ['file_name'], [
            'file_type' => 'new', 'status' => 'new', 'message' => 'new', 'records_json' => 'new',
            'file_size' => 'new', 'file_mtime' => 'new', 'processed_at' => 'new',
            'archived_at' => 'new', 'archive_path' => 'new',
        ]);
    }

    // =========================================================================
    // DB helpers (MySQL, PostgreSQL, SQLite)
    // =========================================================================

    /**
     * INSERT … ON DUPLICATE KEY / ON CONFLICT dengan strategi per kolom:
     * new | coalesce | greatest | keep_longer
     *
     * @param array<string,mixed>  $row
     * @param list<string>         $keys
     * @param array<string,string> $strategy
     */
    private function upsert(string $table, array $row, array $keys, array $strategy): void
    {
        $cols   = array_keys($row);
        $sql    = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $cols),
            implode(', ', array_fill(0, count($cols), '?'))
        );

        $mysql = $this->driver === 'mysql';
        $sets  = [];
        foreach ($strategy as $col => $how) {
            $new = $mysql ? "VALUES({$col})" : "excluded.{$col}";
            $old = $mysql ? $col : "{$table}.{$col}";
            $max = $this->driver === 'sqlite' ? 'MAX' : 'GREATEST';
            $len = $this->driver === 'mysql' ? 'CHAR_LENGTH' : 'LENGTH';
            $sets[] = $col . ' = ' . match ($how) {
                'coalesce'    => "COALESCE({$new}, {$old})",
                'greatest'    => "{$max}(COALESCE({$old}, 0), COALESCE({$new}, 0))",
                'keep_longer' => "CASE WHEN {$old} IS NULL OR {$len}({$new}) > {$len}({$old}) THEN {$new} ELSE {$old} END",
                default       => $new,
            };
        }

        $sql .= $mysql
            ? ' ON DUPLICATE KEY UPDATE ' . implode(', ', $sets)
            : ' ON CONFLICT (' . implode(', ', $keys) . ') DO UPDATE SET ' . implode(', ', $sets);

        $this->pdo->prepare($sql)->execute(array_values($row));
    }

    private function fetchValue(string $sql, array $params = []): mixed
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $v = $stmt->fetchColumn();
        return $v === false ? null : $v;
    }

    private function rollBack(): void
    {
        if ($this->pdo->inTransaction()) {
            $this->pdo->rollBack();
        }
    }

    // =========================================================================
    // Pure helpers
    // =========================================================================

    /** Membaca gzip (gzencode), zlib (gzcompress), atau JSON polos. */
    public static function decodeFile(string $path): ?array
    {
        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            return null;
        }
        if (str_starts_with($raw, "\x1f\x8b")) {
            $raw = @gzdecode($raw);
        } elseif (in_array(substr($raw, 0, 2), ["\x78\x01", "\x78\x5e", "\x78\x9c", "\x78\xda"], true)) {
            $raw = @gzuncompress($raw);
        }
        if (!is_string($raw)) {
            return null;
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : null;
    }

    public static function normalizeDoi(string $doi): string
    {
        $doi = trim($doi);
        $doi = preg_replace('#^(https?://)?(dx\.)?doi\.org/#i', '', $doi) ?? $doi;
        $doi = preg_replace('/^doi:\s*/i', '', $doi) ?? $doi;
        $doi = strtolower(trim($doi));
        return str_starts_with($doi, '10.') ? mb_substr($doi, 0, 512) : '';
    }

    public static function detectOrcid(array $data, string $fileName): ?string
    {
        $candidates = [
            $data['orcid'] ?? null,
            $data['personal_info']['orcid'] ?? null,
            $data['researcher']['orcid'] ?? null,
        ];
        if (preg_match('/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i', $fileName, $m)) {
            $candidates[] = $m[1];
        }
        foreach ($candidates as $c) {
            if (is_string($c) && preg_match('/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i', trim($c))) {
                return strtoupper(trim($c));
            }
        }
        return null;
    }

    /** Label versi pendek untuk work_sdgs.sdg_version (VARCHAR 10). */
    public static function versionLabel(mixed $apiVersion): string
    {
        if (is_string($apiVersion) && preg_match('/v?(\d+(?:\.\d+){0,2})/i', $apiVersion, $m)) {
            return substr('v' . $m[1], 0, 10);
        }
        return 'legacy';
    }

    public static function sourceTimestamp(array $data, int $fallback): int
    {
        $ts = isset($data['timestamp']) ? strtotime((string) $data['timestamp']) : false;
        return $ts ?: $fallback;
    }

    public static function extractYear(array $work): ?int
    {
        foreach (['year', 'publication_year'] as $k) {
            if (isset($work[$k]) && is_numeric($work[$k])) {
                $y = (int) $work[$k];
                return ($y >= 1900 && $y <= 2100) ? $y : null;
            }
        }
        if (!empty($work['published_date']) && preg_match('/^(\d{4})/', (string) $work['published_date'], $m)) {
            return (int) $m[1];
        }
        return null;
    }

    /**
     * @param mixed $list  ['Nama', ...] atau [['name'=>..., 'orcid'=>...], ...]
     * @return list<array{name:string,orcid:?string}>
     */
    public static function parseAuthors(mixed $list): array
    {
        if (!is_array($list)) {
            return [];
        }
        $out = [];
        foreach ($list as $a) {
            $name  = is_array($a) ? ($a['name'] ?? '') : $a;
            $orcid = is_array($a) ? ($a['orcid'] ?? null) : null;
            $name  = trim((string) $name);
            if ($name === '') {
                continue;
            }
            $orcid = is_string($orcid) && preg_match('/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i', $orcid, $m) ? strtoupper($m[1]) : null;
            $out[] = ['name' => $name, 'orcid' => $orcid];
        }
        return $out;
    }

    /**
     * "Barbosa, Cássia H." → ["Cássia H.", "Barbosa"]; "Susiana Susiana" → ["Susiana", "Susiana"]
     * @return array{0:?string,1:?string}
     */
    public static function splitName(?string $name): array
    {
        $name = trim((string) $name);
        if ($name === '') {
            return [null, null];
        }
        if (str_contains($name, ',')) {
            [$family, $given] = array_map('trim', explode(',', $name, 2));
            return [$given !== '' ? $given : null, $family];
        }
        $parts = preg_split('/\s+/', $name) ?: [$name];
        if (count($parts) === 1) {
            return [null, $parts[0]];
        }
        $family = array_pop($parts);
        return [implode(' ', $parts), $family];
    }

    /** @return list<string> token nama (huruf kecil, tanpa aksen, ≥3 huruf) */
    public static function nameTokens(string $name): array
    {
        $ascii = function_exists('iconv') ? (@iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name) ?: $name) : $name;
        $tokens = preg_split('/[^a-z]+/', strtolower($ascii)) ?: [];
        return array_values(array_unique(array_filter($tokens, static fn ($t) => strlen($t) >= 3)));
    }

    private static function str(mixed $v): ?string
    {
        if ($v === null || is_array($v)) {
            return null;
        }
        $v = trim((string) $v);
        return $v === '' ? null : $v;
    }

    private static function cut(?string $v, int $len): ?string
    {
        return $v === null ? null : mb_substr($v, 0, $len);
    }
}

/** Penanda file yang sengaja dilewati (bukan error). */
final class MigrationSkip extends \RuntimeException
{
}
