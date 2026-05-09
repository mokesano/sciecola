<?php
/**
 * DbCacheService.php — Database-backed cache.
 * Drop-in replacement for the old gzip file cache.
 *
 * Tables used: sdg_cache, orcid_profiles, doi_results
 */

require_once __DIR__ . '/Database.php';

class DbCacheService {

    private Database $db;
    private int $ttl;

    public function __construct(?int $ttl = null) {
        $this->db  = Database::getInstance();
        $this->ttl = $ttl ?? (defined('CACHE_TTL') ? (int) CACHE_TTL : 86400);
    }

    // ----------------------------------------------------------------
    // Generic key-value cache (replaces gzip files)
    // ----------------------------------------------------------------

    public function get(string $key): ?array {
        $row = $this->db->fetchOne(
            'SELECT payload, expires_at FROM sdg_cache WHERE cache_key = ?',
            [$key]
        );
        if (!$row) return null;
        if (strtotime($row['expires_at']) < time()) {
            $this->delete($key);
            return null;
        }
        return json_decode($row['payload'], true);
    }

    public function set(string $key, array $data, ?int $ttl = null): void {
        $ttl     = $ttl ?? $this->ttl;
        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $expires = date('Y-m-d H:i:s', time() + $ttl);
        $this->db->upsert('sdg_cache', [
            'cache_key'  => $key,
            'payload'    => $payload,
            'expires_at' => $expires,
            'updated_at' => date('Y-m-d H:i:s'),
        ], ['cache_key']);
    }

    public function delete(string $key): void {
        $this->db->query('DELETE FROM sdg_cache WHERE cache_key = ?', [$key]);
    }

    public function flush(): void {
        $this->db->query('DELETE FROM sdg_cache WHERE expires_at < NOW()');
    }

    // ----------------------------------------------------------------
    // ORCID profile cache
    // ----------------------------------------------------------------

    public function getOrcidProfile(string $orcid): ?array {
        $row = $this->db->fetchOne(
            'SELECT profile_json, expires_at FROM orcid_profiles WHERE orcid_id = ?',
            [$orcid]
        );
        if (!$row || strtotime($row['expires_at']) < time()) return null;
        return json_decode($row['profile_json'], true);
    }

    public function saveOrcidProfile(string $orcid, array $profile, ?int $ttl = null): void {
        $ttl = $ttl ?? $this->ttl;
        $this->db->upsert('orcid_profiles', [
            'orcid_id'     => $orcid,
            'profile_json' => json_encode($profile, JSON_UNESCAPED_UNICODE),
            'expires_at'   => date('Y-m-d H:i:s', time() + $ttl),
            'updated_at'   => date('Y-m-d H:i:s'),
        ], ['orcid_id']);
    }

    // ----------------------------------------------------------------
    // DOI result cache
    // ----------------------------------------------------------------

    public function getDoiResult(string $doi): ?array {
        $row = $this->db->fetchOne(
            'SELECT result_json, expires_at FROM doi_results WHERE doi = ?',
            [$doi]
        );
        if (!$row || strtotime($row['expires_at']) < time()) return null;
        return json_decode($row['result_json'], true);
    }

    public function saveDoiResult(string $doi, array $result, ?int $ttl = null): void {
        $ttl = $ttl ?? $this->ttl;
        $this->db->upsert('doi_results', [
            'doi'         => $doi,
            'result_json' => json_encode($result, JSON_UNESCAPED_UNICODE),
            'expires_at'  => date('Y-m-d H:i:s', time() + $ttl),
            'updated_at'  => date('Y-m-d H:i:s'),
        ], ['doi']);
    }
}
