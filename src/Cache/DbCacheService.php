<?php

declare(strict_types=1);

namespace Sciecola\Cache;

use Sciecola\Database\Connection;

/**
 * Database-backed cache using wizdam_ecosystem unified schema.
 *
 * Tables used:
 *   ecosystem_cache  — generic key-value cache (replaces sdg_cache)
 *   researchers      — ORCID profile cache (profile_cache_json column)
 *   publications     — DOI raw data cache (raw_data_json + sdg_cache_json columns)
 */
class DbCacheService
{
    private Connection $db;
    private int $ttl;
    private string $createdBy;

    public function __construct(?int $ttl = null, string $createdBy = 'mapper')
    {
        $this->db        = Connection::getInstance();
        $this->ttl       = $ttl ?? (defined('CACHE_TTL') ? (int) CACHE_TTL : 86400);
        $this->createdBy = $createdBy;
    }

    // -------------------------------------------------------------------------
    // Generic key-value cache  →  ecosystem_cache
    // -------------------------------------------------------------------------

    public function get(string $key): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT payload, expires_at FROM ecosystem_cache WHERE cache_key = ?',
            [$key]
        );

        if (!$row) {
            return null;
        }

        if (strtotime($row['expires_at']) < time()) {
            $this->delete($key);
            return null;
        }

        return json_decode($row['payload'], true);
    }

    public function set(string $key, array $data, ?int $ttl = null): void
    {
        $expires = date('Y-m-d H:i:s', time() + ($ttl ?? $this->ttl));

        $this->db->upsert('ecosystem_cache', [
            'cache_key'  => $key,
            'payload'    => json_encode($data, JSON_UNESCAPED_UNICODE),
            'expires_at' => $expires,
            'created_by' => $this->createdBy,
        ], ['cache_key']);
    }

    public function delete(string $key): void
    {
        $this->db->query('DELETE FROM ecosystem_cache WHERE cache_key = ?', [$key]);
    }

    public function flush(): void
    {
        $this->db->query('DELETE FROM ecosystem_cache WHERE expires_at < NOW()');
    }

    // -------------------------------------------------------------------------
    // ORCID profile cache  →  researchers.profile_cache_json
    // -------------------------------------------------------------------------

    public function getOrcidProfile(string $orcid): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT profile_cache_json, cache_expires_at
             FROM researchers
             WHERE orcid = ? AND cache_expires_at > NOW()',
            [$orcid]
        );

        if (!$row || empty($row['profile_cache_json'])) {
            return null;
        }

        return json_decode($row['profile_cache_json'], true);
    }

    public function saveOrcidProfile(string $orcid, array $profile, ?int $ttl = null): void
    {
        $expires = date('Y-m-d H:i:s', time() + ($ttl ?? $this->ttl));

        // Ekstrak nama dari profil ORCID
        $name       = $profile['name']['credit-name']['value']
                   ?? trim(
                        ($profile['name']['given-names']['value'] ?? '') . ' ' .
                        ($profile['name']['family-name']['value'] ?? '')
                      );
        $givenNames = $profile['name']['given-names']['value'] ?? null;
        $familyName = $profile['name']['family-name']['value'] ?? null;

        $this->db->upsert('researchers', [
            'orcid'              => $orcid,
            'name'               => $name ?: $orcid,
            'given_names'        => $givenNames,
            'family_name'        => $familyName,
            'profile_cache_json' => json_encode($profile, JSON_UNESCAPED_UNICODE),
            'cache_expires_at'   => $expires,
            'updated_at'         => date('Y-m-d H:i:s'),
        ], ['orcid']);
    }

    // -------------------------------------------------------------------------
    // DOI raw data cache  →  publications.raw_data_json
    // -------------------------------------------------------------------------

    public function getDoiResult(string $doi): ?array
    {
        $doi = strtolower(trim($doi));

        $row = $this->db->fetchOne(
            'SELECT raw_data_json FROM publications WHERE doi = ?',
            [$doi]
        );

        if (!$row || empty($row['raw_data_json'])) {
            return null;
        }

        return json_decode($row['raw_data_json'], true);
    }

    public function saveDoiResult(string $doi, array $result, ?int $ttl = null): void
    {
        $doi = strtolower(trim($doi));

        // Ekstrak metadata dari hasil CrossRef/OpenAlex
        $title  = $result['title'][0]    ?? $result['title']    ?? '';
        $year   = $result['published-print']['date-parts'][0][0]
               ?? $result['publication_year']
               ?? null;

        $this->db->upsert('publications', [
            'doi'          => $doi,
            'title'        => is_string($title) ? $title : json_encode($title),
            'publication_year' => $year ? (int) $year : null,
            'raw_data_json'=> json_encode($result, JSON_UNESCAPED_UNICODE),
            'updated_at'   => date('Y-m-d H:i:s'),
        ], ['doi']);
    }

    // -------------------------------------------------------------------------
    // SDG classification cache  →  publications.sdg_cache_json
    // -------------------------------------------------------------------------

    public function getSdgCache(string $doi): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT sdg_cache_json FROM publications WHERE doi = ?',
            [strtolower(trim($doi))]
        );

        if (!$row || empty($row['sdg_cache_json'])) {
            return null;
        }

        return json_decode($row['sdg_cache_json'], true);
    }

    public function saveSdgCache(string $doi, array $sdgResult): void
    {
        $doi = strtolower(trim($doi));

        $this->db->upsert('publications', [
            'doi'           => $doi,
            'title'         => $sdgResult['title'] ?? $doi,
            'sdg_cache_json'=> json_encode($sdgResult, JSON_UNESCAPED_UNICODE),
            'updated_at'    => date('Y-m-d H:i:s'),
        ], ['doi']);
    }
}
