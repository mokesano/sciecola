<?php

declare(strict_types=1);

namespace Sciecola\Geo;

use MaxMind\Db\Reader;
use MaxMind\Db\Reader\InvalidDatabaseException;

/**
 * MaxMind GeoLite2 IP geolocation service.
 *
 * Priority (graceful fallback):
 * 1. PHP geoip2 extension (reads .mmdb directly)
 * 2. PHP geoip extension (old but functional, uses its own DB)
 * 3. Bundled MaxMind DB Reader (pure PHP, works without extensions)
 *
 * If any method fails, silently falls through to next priority.
 */
class GeoLite2Service
{
    private static ?Reader $reader = null;
    private static string  $loadedPath = '';

    private string $dbPath;

    public function __construct(string $dbPath = '')
    {
        $this->dbPath = $dbPath !== ''
            ? $dbPath
            : ROOT_PATH . '/library/GeoLite2/GeoLite2-City/GeoLite2-City.mmdb';
    }

    /**
     * Look up an IP address.
     *
     * @return array{city: string|null, country: string|null, country_code: string|null, latitude: float, longitude: float}|null
     */
    public function lookup(string $ipAddress): ?array
    {
        // Skip private/reserved ranges
        if ($this->isPrivateIp($ipAddress)) {
            return null;
        }

        // Try each method in priority order
        $result = $this->tryGeoip2Extension($ipAddress);
        if ($result !== null) {
            return $result;
        }

        $result = $this->tryGeoipExtension($ipAddress);
        if ($result !== null) {
            return $result;
        }

        $result = $this->tryBundledReader($ipAddress);
        if ($result !== null) {
            return $result;
        }

        return null;
    }

    /**
     * Try: PHP geoip2 extension (native MaxMind support).
     * This is the newest method and works directly with .mmdb files.
     *
     * @return array{city: string|null, country: string|null, country_code: string|null, latitude: float, longitude: float}|null
     */
    private function tryGeoip2Extension(string $ipAddress): ?array
    {
        if (!extension_loaded('geoip2')) {
            return null;
        }

        try {
            // The geoip2 extension provides geoip2_* functions
            // for reading MaxMind DB files directly
            if (!function_exists('geoip2_db_filename')) {
                return null;
            }

            // Get the database file path configured in php.ini
            $dbFile = @geoip2_db_filename(GEOIP2_CITY);
            if (!$dbFile || !file_exists($dbFile)) {
                return null;
            }

            // Use the geoip2 extension's reader (if available)
            $record = @geoip2_record_by_name($ipAddress);
            if (!is_array($record)) {
                return null;
            }

            return [
                'city'         => $record['city']['names']['en'] ?? null,
                'country'      => $record['country']['names']['en'] ?? null,
                'country_code' => $record['country']['iso_code'] ?? null,
                'latitude'     => (float) ($record['location']['latitude'] ?? 0.0),
                'longitude'    => (float) ($record['location']['longitude'] ?? 0.0),
            ];
        } catch (\Throwable $e) {
            error_log("geoip2 extension lookup failed for {$ipAddress}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Try: Old PHP geoip extension (legacy but functional).
     * Uses the legacy GeoIP2 database format, not our .mmdb file.
     * Still provides useful geolocation data if available.
     *
     * @return array{city: string|null, country: string|null, country_code: string|null, latitude: float, longitude: float}|null
     */
    private function tryGeoipExtension(string $ipAddress): ?array
    {
        if (!extension_loaded('geoip')) {
            return null;
        }

        try {
            // Old geoip extension functions
            if (!function_exists('geoip_record_by_name')) {
                return null;
            }

            $record = @geoip_record_by_name($ipAddress);
            if (!is_array($record)) {
                return null;
            }

            return [
                'city'         => $record['city'] ?? null,
                'country'      => $record['country_name'] ?? null,
                'country_code' => $record['country_code'] ?? null,
                'latitude'     => (float) ($record['latitude'] ?? 0.0),
                'longitude'    => (float) ($record['longitude'] ?? 0.0),
            ];
        } catch (\Throwable $e) {
            error_log("geoip extension lookup failed for {$ipAddress}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Try: Bundled pure-PHP MaxMind DB Reader (fallback).
     * Works without any extensions. Reads GeoLite2-City.mmdb directly.
     *
     * @return array{city: string|null, country: string|null, country_code: string|null, latitude: float, longitude: float}|null
     */
    private function tryBundledReader(string $ipAddress): ?array
    {
        try {
            $reader = $this->getReader();
            if ($reader === null) {
                return null;
            }

            $record = $reader->get($ipAddress);
            if ($record === null) {
                return null;
            }

            return [
                'city'         => $record['city']['names']['en'] ?? null,
                'country'      => $record['country']['names']['en'] ?? null,
                'country_code' => $record['country']['iso_code'] ?? null,
                'latitude'     => (float) ($record['location']['latitude'] ?? 0.0),
                'longitude'    => (float) ($record['location']['longitude'] ?? 0.0),
            ];
        } catch (InvalidDatabaseException $e) {
            error_log("Bundled MaxMind reader error: " . $e->getMessage());
            return null;
        } catch (\Exception $e) {
            error_log("Bundled MaxMind reader lookup error for {$ipAddress}: " . $e->getMessage());
            return null;
        }
    }

    private function getReader(): ?Reader
    {
        if (self::$reader !== null && self::$loadedPath === $this->dbPath) {
            return self::$reader;
        }

        if (!file_exists($this->dbPath)) {
            error_log("GeoLite2 database not found: {$this->dbPath}");
            return null;
        }

        try {
            self::$reader     = new Reader($this->dbPath);
            self::$loadedPath = $this->dbPath;
            return self::$reader;
        } catch (\Exception $e) {
            error_log("Failed to open GeoLite2 database: " . $e->getMessage());
            return null;
        }
    }

    private function isPrivateIp(string $ip): bool
    {
        return !filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
    }
}
