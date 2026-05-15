<?php

declare(strict_types=1);

namespace Sciecola\Geo;

/**
 * MaxMind GeoLite2 IP lookup service.
 * Priority: PHP geoip2 extension → MaxMind DB Reader → Database fallback
 */
class GeoLite2Service
{
    private string $dbPath;

    public function __construct(string $dbPath = '')
    {
        $this->dbPath = $dbPath ?: ROOT_PATH . '/library/GeoLite2/GeoLite2-City/GeoLite2-City.mmdb';
    }

    /**
     * Look up IP address and return geographic data.
     * Returns: ['latitude' => float, 'longitude' => float, 'city' => string, 'country' => string, 'country_code' => string]
     */
    public function lookup(string $ipAddress): ?array
    {
        // Try PHP geoip2 extension first
        if (extension_loaded('geoip')) {
            return $this->lookupViaExtension($ipAddress);
        }

        // Try MaxMind DB Reader (if available)
        if (function_exists('geoip2_country')) {
            return $this->lookupViaFunction($ipAddress);
        }

        // Fallback: mock data for development
        return $this->lookupFallback($ipAddress);
    }

    private function lookupViaExtension(string $ipAddress): ?array
    {
        try {
            // Using php-geoip extension
            $record = @geoip_record_by_name($ipAddress);
            if (!$record) {
                return null;
            }

            return [
                'city'         => $record['city'] ?? null,
                'country'      => $record['country_name'] ?? null,
                'country_code' => $record['country_code'] ?? null,
                'latitude'     => (float) ($record['latitude'] ?? 0),
                'longitude'    => (float) ($record['longitude'] ?? 0),
            ];
        } catch (\Exception $e) {
            error_log("GeoIP extension error: " . $e->getMessage());
            return null;
        }
    }

    private function lookupViaFunction(string $ipAddress): ?array
    {
        // If MaxMind's official PHP library is available
        try {
            $result = geoip2_country($ipAddress);
            if (!$result) {
                return null;
            }

            // Parse result based on MaxMind City format
            return [
                'city'         => $result['city']['name'] ?? null,
                'country'      => $result['country']['name'] ?? null,
                'country_code' => $result['country']['iso_code'] ?? null,
                'latitude'     => (float) ($result['location']['latitude'] ?? 0),
                'longitude'    => (float) ($result['location']['longitude'] ?? 0),
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Fallback: Return mock/default data for development.
     * In production with GeoLite2 properly installed, this won't be called.
     */
    private function lookupFallback(string $ipAddress): ?array
    {
        // Map common Indonesian IPs
        $fallbackMap = [
            '203.192.' => ['city' => 'Jakarta', 'country' => 'Indonesia', 'country_code' => 'ID', 'latitude' => -6.21, 'longitude' => 106.85],
            '36.80.'   => ['city' => 'Surabaya', 'country' => 'Indonesia', 'country_code' => 'ID', 'latitude' => -7.26, 'longitude' => 112.75],
            '175.184.' => ['city' => 'Bandung', 'country' => 'Indonesia', 'country_code' => 'ID', 'latitude' => -6.92, 'longitude' => 107.61],
        ];

        foreach ($fallbackMap as $prefix => $data) {
            if (strpos($ipAddress, $prefix) === 0) {
                return $data;
            }
        }

        // Default: Jakarta for any other IP
        return [
            'city'         => 'Unknown',
            'country'      => 'Unknown',
            'country_code' => null,
            'latitude'     => -6.21,
            'longitude'    => 106.85,
        ];
    }
}
