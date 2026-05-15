<?php

declare(strict_types=1);

namespace Sciecola\Geo;

use MaxMind\Db\Reader;
use MaxMind\Db\Reader\InvalidDatabaseException;

/**
 * MaxMind GeoLite2 IP geolocation service.
 * Uses the bundled MaxMind DB Reader at library/MaxMind/ to read the binary .mmdb file directly.
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
            error_log("GeoLite2 database error: " . $e->getMessage());
            return null;
        } catch (\Exception $e) {
            error_log("GeoLite2 lookup error for IP {$ipAddress}: " . $e->getMessage());
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
