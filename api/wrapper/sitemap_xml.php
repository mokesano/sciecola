<?php
declare(strict_types=1);

/**
 * @file api/wrapper/sitemap_xml.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Dynamic XML Sitemap Endpoint.
 * 
 * Endpoints:
 * GET /sitemap.xml
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/xml; charset=utf-8');

$baseUrl = getBaseUrl();
$today = date('Y-m-d');
$urls = getStaticSitemapUrls($today);

if (defined('DB_HOST') && DB_HOST) {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME,
            DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $urls = array_merge($urls,
            fetchDynamicSitemapUrls($pdo, 'publications', 'doi', '/doi/', 'created_at', 5000, 'weekly', '0.7'),
            fetchDynamicSitemapUrls($pdo, 'researchers', 'orcid', '/orcid/', 'created_at', 5000, 'weekly', '0.7'),
            fetchDynamicSitemapUrls($pdo, 'journals', 'id', '/journals/', 'created_at', 3000, 'weekly', '0.6'),
            fetchDynamicSitemapUrls($pdo, 'institutions', 'id', '/institutions/', 'created_at', 3000, 'weekly', '0.6')
        );
    } catch (Throwable $e) {
        // Keep static URLs only.
    }
}

echo renderXmlSitemap($baseUrl, $urls);

function getBaseUrl(): string {
    if (defined('APP_URL') && APP_URL) {
        return rtrim((string) APP_URL, '/');
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme . '://' . $host;
}

function getStaticSitemapUrls(string $lastmod): array {
    return [
        ['path' => '/', 'lastmod' => $lastmod, 'changefreq' => 'daily', 'priority' => '1.0'],
        ['path' => '/sitemap', 'lastmod' => $lastmod, 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['path' => '/journals', 'lastmod' => $lastmod, 'changefreq' => 'daily', 'priority' => '0.9'],
        ['path' => '/articles', 'lastmod' => $lastmod, 'changefreq' => 'daily', 'priority' => '0.9'],
        ['path' => '/researchers', 'lastmod' => $lastmod, 'changefreq' => 'daily', 'priority' => '0.9'],
        ['path' => '/institutions', 'lastmod' => $lastmod, 'changefreq' => 'daily', 'priority' => '0.8'],
        ['path' => '/sdgs', 'lastmod' => $lastmod, 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['path' => '/analytics', 'lastmod' => $lastmod, 'changefreq' => 'weekly', 'priority' => '0.7'],
        ['path' => '/about', 'lastmod' => $lastmod, 'changefreq' => 'monthly', 'priority' => '0.6'],
        ['path' => '/contact', 'lastmod' => $lastmod, 'changefreq' => 'monthly', 'priority' => '0.6'],
    ];
}

function fetchDynamicSitemapUrls(PDO $pdo, string $table, string $idField, string $prefix, string $lastmodField, int $limit, string $changefreq, string $priority): array {
    $rows = [];
    try {
        $sql = sprintf('SELECT %s AS id, COALESCE(DATE(%s), CURDATE()) AS lastmod FROM %s WHERE %s IS NOT NULL AND %s <> "" ORDER BY %s DESC LIMIT %d',
            $idField, $lastmodField, $table, $idField, $idField, $lastmodField, $limit);
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        return [];
    }

    return array_map(static function(array $row) use ($prefix, $changefreq, $priority): array {
        return [
            'path' => $prefix . rawurlencode((string)$row['id']),
            'lastmod' => (string)$row['lastmod'],
            'changefreq' => $changefreq,
            'priority' => $priority,
        ];
    }, $rows);
}

function renderXmlSitemap(string $baseUrl, array $urls): string {
    $xml = new XMLWriter();
    $xml->openMemory();
    $xml->startDocument('1.0', 'UTF-8');
    $xml->startElement('urlset');
    $xml->writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

    foreach ($urls as $u) {
        $xml->startElement('url');
        $xml->writeElement('loc', $baseUrl . $u['path']);
        $xml->writeElement('lastmod', $u['lastmod']);
        $xml->writeElement('changefreq', $u['changefreq']);
        $xml->writeElement('priority', $u['priority']);
        $xml->endElement();
    }

    $xml->endElement();
    $xml->endDocument();
    return $xml->outputMemory();
}
