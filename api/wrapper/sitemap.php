<?php
/**
 * Dynamic Sitemap API
 * GET /api/wrapper/sitemap.php
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    echo json_encode([
        'status' => 'success',
        'data' => buildSitemap(),
        'generated_at' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function buildSitemap(): array
{
    $staticGroups = getStaticGroups();

    if (!defined('DB_HOST') || !DB_HOST) {
        return array_merge($staticGroups, [
            [
                'title' => 'Konten Dinamis',
                'links' => [
                    ['label' => 'Contoh Artikel', 'to' => '/articles/10.1016/j.jclepro.2023.001'],
                    ['label' => 'Contoh Peneliti', 'to' => '/researchers/0000-0002-5152-9727'],
                    ['label' => 'Contoh Jurnal', 'to' => '/journals/jcp-2024'],
                    ['label' => 'Contoh Institusi', 'to' => '/institutions/1'],
                ],
            ],
        ]);
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME,
            DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $dynamicGroups = [
            [
                'title' => 'Artikel Terbaru',
                'links' => fetchDynamicLinks($pdo, 'publications', 'doi', 'title', '/articles/', 8, 'created_at'),
            ],
            [
                'title' => 'Peneliti Teratas',
                'links' => fetchDynamicLinks($pdo, 'researchers', 'orcid', 'name', '/researchers/', 8, 'citation_count'),
            ],
            [
                'title' => 'Jurnal Populer',
                'links' => fetchDynamicLinks($pdo, 'journals', 'id', 'title', '/journals/', 8, 'created_at'),
            ],
            [
                'title' => 'Institusi Aktif',
                'links' => fetchDynamicLinks($pdo, 'institutions', 'id', 'name', '/institutions/', 8, 'id'),
            ],
        ];

        $dynamicGroups = array_values(array_filter($dynamicGroups, fn($group) => !empty($group['links'])));

        return array_merge($staticGroups, $dynamicGroups);
    } catch (Exception $e) {
        return $staticGroups;
    }
}

function fetchDynamicLinks(PDO $pdo, string $table, string $idField, string $labelField, string $pathPrefix, int $limit, string $sortField): array
{
    $sql = sprintf(
        'SELECT %s AS item_id, %s AS item_label FROM %s WHERE %s IS NOT NULL AND %s <> "" ORDER BY %s DESC LIMIT %d',
        $idField,
        $labelField,
        $table,
        $idField,
        $idField,
        $sortField,
        $limit
    );

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return array_map(static function(array $row) use ($pathPrefix): array {
        return [
            'label' => (string)($row['item_label'] ?: $row['item_id']),
            'to' => $pathPrefix . rawurlencode((string)$row['item_id']),
        ];
    }, $rows);
}

function getStaticGroups(): array
{
    return [
        [
            'title' => 'Halaman Utama',
            'links' => [
                ['label' => 'Beranda', 'to' => '/'],
                ['label' => 'Dashboard', 'to' => '/dashboard'],
                ['label' => 'Feeds', 'to' => '/feeds'],
                ['label' => 'Statistik Saya', 'to' => '/my-statistics'],
            ],
        ],
        [
            'title' => 'Eksplorasi Riset',
            'links' => [
                ['label' => 'Jurnal', 'to' => '/journals'],
                ['label' => 'Artikel', 'to' => '/articles'],
                ['label' => 'Peneliti', 'to' => '/researchers'],
                ['label' => 'Institusi', 'to' => '/institutions'],
                ['label' => 'SDGs Cluster', 'to' => '/sdgs'],
                ['label' => 'Analytics', 'to' => '/analytics'],
                ['label' => 'Trends Analysis', 'to' => '/trends-analysis'],
                ['label' => 'Insights AI', 'to' => '/insights'],
            ],
        ],
        [
            'title' => 'Kolaborasi',
            'links' => [
                ['label' => 'Collaboration Hub', 'to' => '/collaboration'],
                ['label' => 'Project Management', 'to' => '/projects'],
                ['label' => 'Research Matching', 'to' => '/research-matching'],
                ['label' => 'Innovation Marketplace', 'to' => '/innovation-marketplace'],
                ['label' => 'Messages', 'to' => '/messages'],
                ['label' => 'Notifications', 'to' => '/notifications'],
            ],
        ],
        [
            'title' => 'Tentang & Dukungan',
            'links' => [
                ['label' => 'Tentang Kami', 'to' => '/about'],
                ['label' => 'Sejarah', 'to' => '/history'],
                ['label' => 'Tim', 'to' => '/teams'],
                ['label' => 'Sponsor', 'to' => '/sponsors'],
                ['label' => 'Partner', 'to' => '/partners'],
                ['label' => 'Kontak', 'to' => '/contact'],
                ['label' => 'Help Center', 'to' => '/help'],
                ['label' => 'FAQ', 'to' => '/docs/faq'],
                ['label' => 'Sitemap', 'to' => '/sitemap'],
            ],
        ],
        [
            'title' => 'Legal & Dokumen',
            'links' => [
                ['label' => 'Terms', 'to' => '/terms'],
                ['label' => 'Privacy', 'to' => '/privacy'],
                ['label' => 'Documentation', 'to' => '/docs/documentation'],
                ['label' => 'API Reference', 'to' => '/docs/api-reference'],
                ['label' => 'System Status', 'to' => '/system-status'],
                ['label' => 'Uptime Page', 'to' => '/uptime'],
            ],
        ],
    ];
}
