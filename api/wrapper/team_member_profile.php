<?php
/**
 * Team Member Profile API
 * GET /api/team_member_profile.php?id={memberId} or ?slug={slug}
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $memberId = (int)($_GET['id'] ?? 0);
        $slug     = trim($_GET['slug'] ?? '');

        if (!$memberId && !$slug) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Member ID or slug required']);
            exit;
        }

        echo json_encode(getTeamMemberProfile($memberId, $slug));
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getTeamMemberProfile(int $memberId, string $slug): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleTeamMemberProfile();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where  = $memberId > 0 ? 'tm.id = ?' : 'tm.slug = ?';
        $params = [$memberId > 0 ? $memberId : $slug];

        $stmt = $pdo->prepare("
            SELECT tm.id, tm.name, tm.slug, tm.code, tm.email, tm.phone,
                   tm.bio, tm.long_bio, tm.avatar_url, tm.role, tm.location,
                   tm.joined_year, td.name as department, tm.sdg_focus
            FROM team_members tm
            LEFT JOIN team_departments td ON td.id = tm.department_id
            WHERE $where
        ");
        $stmt->execute($params);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$member) {
            return ['status' => 'error', 'message' => 'Team member not found'];
        }

        $sdgFocus = json_decode($member['sdg_focus'] ?? '[]', true);

        // Fetch education history
        $eduStmt = $pdo->prepare("
            SELECT degree_level, field_of_study, institution, graduation_year, honors
            FROM team_member_education
            WHERE team_member_id = ?
            ORDER BY graduation_year DESC
        ");
        $eduStmt->execute([$member['id']]);
        $education = $eduStmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch achievements
        $achStmt = $pdo->prepare("
            SELECT title, description, achievement_year, category, issuer, proof_url
            FROM team_member_achievements
            WHERE team_member_id = ?
            ORDER BY achievement_year DESC
        ");
        $achStmt->execute([$member['id']]);
        $achievements = $achStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'status'  => 'success',
            'member'  => [
                'id'         => (int)$member['id'],
                'name'       => $member['name'],
                'slug'       => $member['slug'],
                'code'       => $member['code'],
                'email'      => $member['email'],
                'phone'      => $member['phone'],
                'bio'        => $member['bio'],
                'long_bio'   => $member['long_bio'],
                'avatar'     => $member['avatar_url'],
                'role'       => $member['role'],
                'location'   => $member['location'],
                'joined_year' => (int)($member['joined_year'] ?? 0),
                'department' => $member['department'],
                'sdg_focus'  => is_array($sdgFocus) ? $sdgFocus : []
            ],
            'education' => array_map(function ($row) {
                return [
                    'degree'     => $row['degree_level'],
                    'field'      => $row['field_of_study'],
                    'institution' => $row['institution'],
                    'graduation' => (int)$row['graduation_year'],
                    'honors'     => $row['honors']
                ];
            }, $education),
            'achievements' => array_map(function ($row) {
                return [
                    'title'    => $row['title'],
                    'description' => $row['description'],
                    'year'     => (int)$row['achievement_year'],
                    'category' => $row['category'],
                    'issuer'   => $row['issuer'],
                    'proof_url' => $row['proof_url']
                ];
            }, $achievements),
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleTeamMemberProfile();
    }
}

function getSampleTeamMemberProfile(): array {
    return [
        'status'  => 'success',
        'member'  => [
            'id'         => 1,
            'name'       => 'Dr. Budi Santoso',
            'slug'       => 'budi-santoso',
            'code'       => 'TM-L001',
            'email'      => 'budi.santoso@sdgmapper.org',
            'phone'      => '+62-812-3456-7890',
            'bio'        => 'Director, SDG Research & Analytics',
            'long_bio'   => 'PhD in Computer Science from MIT. 15+ years experience in research analytics and SDG classification. Led development of Wizdam Impact Score methodology.',
            'avatar'     => 'https://via.placeholder.com/300/6366f1/ffffff?text=BS',
            'role'       => 'Leadership',
            'location'   => 'Jakarta, Indonesia',
            'joined_year' => 2020,
            'department' => 'Leadership',
            'sdg_focus'  => [4, 9, 17]
        ],
        'education' => [
            [
                'degree'      => 'PhD',
                'field'       => 'Computer Science',
                'institution' => 'Massachusetts Institute of Technology',
                'graduation'  => 2009,
                'honors'      => 'Cum Laude'
            ],
            [
                'degree'      => 'M.Tech',
                'field'       => 'Computer Science',
                'institution' => 'Indian Institute of Technology Delhi',
                'graduation'  => 2007,
                'honors'      => null
            ],
            [
                'degree'      => 'B.Tech',
                'field'       => 'Information Technology',
                'institution' => 'Universitas Indonesia',
                'graduation'  => 2005,
                'honors'      => 'Cum Laude'
            ]
        ],
        'achievements' => [
            [
                'title'       => 'Fellow of the Royal Society',
                'description' => 'Elected for contributions to AI and sustainable development',
                'year'        => 2023,
                'category'    => 'award',
                'issuer'      => 'Royal Society',
                'proof_url'   => 'https://example.com/frs-certificate'
            ],
            [
                'title'       => 'SDG Impact Award',
                'description' => 'For development of innovative SDG classification methodology',
                'year'        => 2022,
                'category'    => 'award',
                'issuer'      => 'UN SDGAA',
                'proof_url'   => null
            ]
        ],
        'timestamp' => date('c')
    ];
}
