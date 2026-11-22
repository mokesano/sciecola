<?php

declare(strict_types=1);

namespace Sciecola\Sdg;

/**
 * @file src/Sdg/CrawlQueue.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup src
 * @brief Penyimpanan antrean crawl ORCID/DOI (ROOT/cache/crawl_queue.json).
 *        Dipakai oleh api/wrapper/crawl_queue.php dan oleh halaman profil yang
 *        menitipkan sisa analisis ke antrean.
 */
final class CrawlQueue
{
    public static function file(): string
    {
        $root = defined('ROOT_PATH') ? ROOT_PATH : dirname(__DIR__, 2);
        return $root . '/cache/crawl_queue.json';
    }

    /** @return list<array<string,mixed>> */
    public static function read(): array
    {
        $file = self::file();
        if (!is_file($file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data)) {
            return [];
        }
        // Format lama bisa berupa map {job_id: job}; normalisasi ke list.
        return array_values(array_filter($data, 'is_array'));
    }

    public static function write(array $queue): void
    {
        $dir = dirname(self::file());
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        file_put_contents(
            self::file(),
            json_encode(array_values($queue), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE),
            LOCK_EX
        );
    }

    /**
     * Menambahkan pekerjaan bila belum ada yang menunggu/berjalan untuk identifier yang sama.
     * @return array{job_id:string,duplicate:bool}
     */
    public static function enqueue(string $type, string $identifier, int $priority = 5, string $source = 'admin'): array
    {
        $queue = self::read();
        foreach ($queue as $job) {
            if (($job['identifier'] ?? '') === $identifier && in_array($job['status'] ?? '', ['pending', 'running'], true)) {
                return ['job_id' => (string) $job['id'], 'duplicate' => true];
            }
        }
        $jobId   = 'job-' . substr(bin2hex(random_bytes(8)), 0, 12);
        $queue[] = [
            'id'         => $jobId,
            'type'       => $type,
            'identifier' => $identifier,
            'priority'   => $priority,
            'status'     => 'pending',
            'attempts'   => 0,
            'progress'   => null,
            'result'     => null,
            'error'      => null,
            'source'     => $source,
            'created_at' => date('c'),
            'updated_at' => date('c'),
        ];
        usort($queue, static fn ($a, $b) => ($b['priority'] ?? 5) <=> ($a['priority'] ?? 5)
            ?: strcmp((string) ($a['created_at'] ?? ''), (string) ($b['created_at'] ?? '')));
        self::write($queue);
        return ['job_id' => $jobId, 'duplicate' => false];
    }
}
