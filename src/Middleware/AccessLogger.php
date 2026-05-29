<?php

declare(strict_types=1);

namespace Sciecola\Middleware;

use Sciecola\Database\Connection;
use Sciecola\Geo\GeoLite2Service;

/**
 * @file src/Middleware/AccessLogger.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup src
 * @brief Implementation for logging HTTP requests with geolocation and User-Agent information.
 * 
 * Records each HTTP request into the access_logs table,
 * enriching with GeoLite2 geolocation and User-Agent parsing.
 */

class AccessLogger
{
    private Connection     $db;
    private GeoLite2Service $geo;

    public function __construct()
    {
        $this->db  = Connection::getInstance();
        $this->geo = new GeoLite2Service();
    }

    public function log(): void
    {
        try {
            $ip      = $this->getClientIp();
            $geo     = $this->geo->lookup($ip);
            $ua      = $_SERVER['HTTP_USER_AGENT'] ?? '';
            $parsed  = $this->parseUserAgent($ua);
            $traffic = $this->classifyTrafficSource();
            $utm     = $this->extractUtm();

            $this->db->insert('access_logs', [
                'user_orcid'      => $_SESSION['orcid'] ?? null,
                'ip_address'      => $ip,
                'page_path'       => $this->getPagePath(),
                'http_method'     => $_SERVER['REQUEST_METHOD'] ?? 'GET',
                'http_status'     => http_response_code() ?: 200,
                'device_type'     => $parsed['device_type'],
                'browser'         => $parsed['browser'],
                'os'              => $parsed['os'],
                'city'            => $geo['city'] ?? null,
                'country'         => $geo['country'] ?? null,
                'latitude'        => $geo['latitude'] ?? null,
                'longitude'       => $geo['longitude'] ?? null,
                'session_id'      => session_id() ?: null,
                'session_duration' => null,
                'referrer'        => $_SERVER['HTTP_REFERER'] ?? null,
                'traffic_source'  => $traffic,
                'utm_source'      => $utm['source'],
                'utm_medium'      => $utm['medium'],
                'utm_campaign'    => $utm['campaign'],
                'is_bot'          => $parsed['is_bot'] ? 1 : 0,
                'visit_type'      => $parsed['is_bot'] ? 'bot' : 'normal',
            ]);
        } catch (\Exception $e) {
            // Never break the request — log silently
            error_log("AccessLogger error: " . $e->getMessage());
        }
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private function getClientIp(): string
    {
        foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
            $val = $_SERVER[$key] ?? '';
            if ($val !== '') {
                // X-Forwarded-For may contain a comma-separated list
                $ip = trim(explode(',', $val)[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }

    private function getPagePath(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        // Strip query string
        $pos = strpos($uri, '?');
        return $pos !== false ? substr($uri, 0, $pos) : $uri;
    }

    /** @return array{browser: string, os: string, device_type: string, is_bot: bool} */
    private function parseUserAgent(string $ua): array
    {
        $ua_lower = strtolower($ua);

        // Bot detection
        $botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'slurp', 'bingbot',
                        'googlebot', 'baiduspider', 'yandex', 'ahrefsbot', 'semrushbot'];
        $isBot = false;
        foreach ($botPatterns as $pattern) {
            if (str_contains($ua_lower, $pattern)) {
                $isBot = true;
                break;
            }
        }

        // Browser detection
        $browser = 'Other';
        if (str_contains($ua_lower, 'edg/') || str_contains($ua_lower, 'edge/')) {
            $browser = 'Edge';
        } elseif (str_contains($ua_lower, 'firefox/')) {
            $browser = 'Firefox';
        } elseif (str_contains($ua_lower, 'opr/') || str_contains($ua_lower, 'opera/')) {
            $browser = 'Opera';
        } elseif (str_contains($ua_lower, 'chrome/')) {
            $browser = 'Chrome';
        } elseif (str_contains($ua_lower, 'safari/') && str_contains($ua_lower, 'applewebkit')) {
            $browser = 'Safari';
        }

        // OS detection
        $os = 'Other';
        if (str_contains($ua_lower, 'windows')) {
            $os = 'Windows';
        } elseif (str_contains($ua_lower, 'iphone') || str_contains($ua_lower, 'ipad')) {
            $os = 'iOS';
        } elseif (str_contains($ua_lower, 'mac os x') || str_contains($ua_lower, 'macintosh')) {
            $os = 'macOS';
        } elseif (str_contains($ua_lower, 'android')) {
            $os = 'Android';
        } elseif (str_contains($ua_lower, 'linux')) {
            $os = 'Linux';
        }

        // Device type
        $deviceType = 'desktop';
        if (str_contains($ua_lower, 'mobile') || str_contains($ua_lower, 'iphone')) {
            $deviceType = 'mobile';
        } elseif (str_contains($ua_lower, 'ipad') || str_contains($ua_lower, 'tablet')) {
            $deviceType = 'tablet';
        }

        return ['browser' => $browser, 'os' => $os, 'device_type' => $deviceType, 'is_bot' => $isBot];
    }

    private function classifyTrafficSource(): string
    {
        $referrer = $_SERVER['HTTP_REFERER'] ?? '';
        $utmMedium = $_GET['utm_medium'] ?? '';

        if ($utmMedium === 'email') {
            return 'email';
        }
        if ($utmMedium === 'social' || $utmMedium === 'social-media') {
            return 'social';
        }
        if ($utmMedium === 'cpc' || $utmMedium === 'ppc') {
            return 'paid';
        }
        if ($referrer === '') {
            return 'direct';
        }

        $socialDomains = ['facebook.com', 'twitter.com', 'x.com', 'linkedin.com',
                          'instagram.com', 'youtube.com', 't.co', 'pinterest.com'];
        $searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
                          'baidu.com', 'yandex.com'];

        $host = parse_url($referrer, PHP_URL_HOST) ?? '';
        $host = ltrim($host, 'www.');

        foreach ($socialDomains as $domain) {
            if (str_ends_with($host, $domain)) {
                return 'social';
            }
        }
        foreach ($searchEngines as $domain) {
            if (str_ends_with($host, $domain)) {
                return 'organic';
            }
        }

        return 'referral';
    }

    /** @return array{source: string|null, medium: string|null, campaign: string|null} */
    private function extractUtm(): array
    {
        return [
            'source'   => isset($_GET['utm_source'])   ? substr($_GET['utm_source'],   0, 100) : null,
            'medium'   => isset($_GET['utm_medium'])   ? substr($_GET['utm_medium'],   0, 100) : null,
            'campaign' => isset($_GET['utm_campaign']) ? substr($_GET['utm_campaign'], 0, 100) : null,
        ];
    }
}
