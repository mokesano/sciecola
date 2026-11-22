<?php
declare(strict_types=1);

/**
 * @file api/wrapper/research_matching.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Research Matching API.
 * 
 * Endpoints:
 * GET /api/research_matching (get sample matches)
 * POST /api/research_matching (calculate matches)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        echo json_encode(calculateMatches());
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function calculateMatches(): array {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input)) {
        return [
            'status' => 'success',
            'matches' => \Sciecola\Support\EmptyData::like(getSampleMatches()),
            'timestamp' => date('c')
        ];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return [
            'status' => 'success',
            'matches' => \Sciecola\Support\EmptyData::like(getSampleMatches()),
            'timestamp' => date('c')
        ];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        // Kriteria pencarian dari halaman Research Matching
        $wantSdgs = array_values(array_filter(array_map('intval', (array) ($input['sdgGoals'] ?? $input['sdgs'] ?? [])),
            fn ($n) => $n >= 1 && $n <= 17));
        $keywords = array_values(array_filter(preg_split('/[\s,;]+/', mb_strtolower(trim(
            ($input['keywords'] ?? '') . ' ' . ($input['expertise'] ?? '')))) ?: [], fn ($w) => mb_strlen($w) >= 3));
        $location    = mb_strtolower(trim((string) ($input['location'] ?? '')));
        $institution = mb_strtolower(trim((string) ($input['institution'] ?? '')));

        // Kandidat: peneliti + SDG nyata dari karya mereka (work_sdgs) + jumlah publikasi & kolaborator
        $stmt = $pdo->query("
            SELECT r.orcid, r.name, r.h_index, r.country, r.collaboration_status, r.profile_photo_url,
                   i.name AS institution,
                   (SELECT GROUP_CONCAT(DISTINCT ws.sdg_number)
                      FROM publication_authors pa JOIN work_sdgs ws ON ws.doi = pa.doi
                     WHERE pa.orcid = r.orcid) AS sdgs,
                   (SELECT GROUP_CONCAT(DISTINCT re.field_name) FROM researcher_expertise re WHERE re.orcid = r.orcid) AS expertise,
                   (SELECT COUNT(DISTINCT pa.doi) FROM publication_authors pa WHERE pa.orcid = r.orcid) AS pub_count,
                   (SELECT COUNT(DISTINCT co.name) FROM publication_authors pa
                      JOIN publication_authors co ON co.doi = pa.doi AND (co.orcid IS NULL OR co.orcid <> r.orcid)
                     WHERE pa.orcid = r.orcid) AS collab_count
            FROM researchers r
            LEFT JOIN institutions i ON i.id = r.institution_id
            WHERE r.collaboration_status IS NULL OR r.collaboration_status != 'busy'
        ");
        $researchers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $matches = [];
        foreach ($researchers as $match) {
            $sdgs      = array_values(array_filter(array_map('intval', explode(',', (string) ($match['sdgs'] ?? '')))));
            $expertise = array_values(array_filter(explode(',', (string) ($match['expertise'] ?? ''))));
            $haystack  = mb_strtolower(implode(' ', $expertise) . ' ' . $match['name']);

            if ($location !== '' && !str_contains(mb_strtolower((string) $match['country']), $location)) continue;
            if ($institution !== '' && !str_contains(mb_strtolower((string) $match['institution']), $institution)) continue;

            // Skor kecocokan yang bisa dijelaskan: irisan SDG (70%) + kata kunci keahlian (30%)
            $reasons  = [];
            $sdgShare = 0.0;
            if ($wantSdgs) {
                $common   = array_values(array_intersect($wantSdgs, $sdgs));
                $sdgShare = count($common) / count($wantSdgs);
                if ($common) $reasons[] = 'Fokus SDG yang sama: ' . implode(', ', array_map(fn ($n) => "SDG $n", $common));
            }
            $kwShare = 0.0;
            if ($keywords) {
                $hits    = array_values(array_filter($keywords, fn ($k) => str_contains($haystack, $k)));
                $kwShare = count($hits) / count($keywords);
                if ($hits) $reasons[] = 'Kata kunci cocok: ' . implode(', ', $hits);
            }
            if (!$wantSdgs && !$keywords) {
                $score = null; // tanpa kriteria tidak ada dasar untuk memberi skor
            } else {
                $weightSdg = $wantSdgs ? ($keywords ? 0.7 : 1.0) : 0.0;
                $weightKw  = $keywords ? ($wantSdgs ? 0.3 : 1.0) : 0.0;
                $score = (int) round(100 * ($sdgShare * $weightSdg + $kwShare * $weightKw));
                if ($score === 0) continue;
            }

            $matches[] = [
                'id'             => $match['orcid'],
                'orcid'          => $match['orcid'],
                'name'           => $match['name'],
                'title'          => implode(', ', $expertise) ?: 'Researcher',
                'institution'    => $match['institution'] ?? '',
                'location'       => $match['country'] ?? '',
                'avatar'         => $match['profile_photo_url'] ?: null,
                'match_score'    => $score,
                'match_reasons'  => $reasons,
                'sdg_focus'      => $sdgs,
                'h_index'        => (int) $match['h_index'],
                'publications'   => (int) $match['pub_count'],
                'collaborations' => (int) $match['collab_count'],
                'availability'   => $match['collaboration_status'] === 'open' ? 'Available for new projects' : 'Limited availability',
                'response_time'  => null,
            ];
        }
        usort($matches, fn ($x, $y) => ($y['match_score'] ?? 0) <=> ($x['match_score'] ?? 0)
            ?: $y['publications'] <=> $x['publications']);
        $matches = array_slice($matches, 0, 20);

        return [
            'status' => 'success',
            'matches' => $matches,
            'total' => count($matches),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return [
            'status' => 'success',
            'matches' => \Sciecola\Support\EmptyData::like(getSampleMatches()),
            'timestamp' => date('c')
        ];
    }
}

function getSampleMatches(): array {
    return [
        [
            'id' => 1,
            'name' => 'Dr. Sarah Chen',
            'match_score' => 96,
            'match_reasons' => [
                'Similar research focus on climate change',
                'Complementary expertise in ocean systems',
                'Active in SDG 13 & 14',
                'Previous collaboration success rate: 94%'
            ],
            'sdg_focus' => [13, 14, 15],
            'h_index' => 52,
            'publications' => 234,
            'collaborations' => 47,
            'availability' => 'Available for new projects',
            'response_time' => '< 24 hours'
        ],
        [
            'id' => 2,
            'name' => 'Prof. Ahmed Hassan',
            'match_score' => 93,
            'match_reasons' => [
                'Expertise in sustainable energy systems',
                'Strong publication record in related fields',
                'Active collaboration network',
                'Geographic diversity for global impact'
            ],
            'sdg_focus' => [7, 9, 11],
            'h_index' => 48,
            'publications' => 189,
            'collaborations' => 63,
            'availability' => 'Available for new projects',
            'response_time' => '< 48 hours'
        ]
    ];
}
