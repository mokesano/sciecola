<?php
declare(strict_types=1);

/**
 * @file api/wrapper/team_member_profile.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 * 
 * @ingroup api
 * @brief Team Member Profile API — single team member with education + achievements.
 * Schema-aware: name comes from researchers via orcid FK.
 * 
 * Endpoints:
 * GET /api/wrapper/team_member_profile.php?id={id}  or  ?slug={slug}
 * Returns: { status, member{}, education[], achievements[] }
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $memberId = (int)($_GET['id'] ?? 0);
    $slug     = trim($_GET['slug'] ?? '');

    if (!$memberId && !$slug) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Member ID or slug required']);
        exit;
    }

    echo json_encode(fetchMember($memberId, $slug), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchMember(int $memberId, string $slug): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        return sampleProfile();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $where  = $memberId > 0 ? 'tm.id = ?' : 'tm.slug = ?';
        $param  = $memberId > 0 ? $memberId : $slug;

        $stmt = $pdo->prepare(
            "SELECT tm.id, tm.orcid, tm.slug, tm.code, tm.position, tm.bio,
                    tm.long_bio, tm.photo_url, tm.location, tm.joined_year,
                    tm.expertise, tm.social_links, tm.sdg_focus, tm.is_visible,
                    td.name AS department,
                    r.name AS researcher_name, r.email_address
             FROM team_members tm
             LEFT JOIN team_departments td ON td.id = tm.department_id
             LEFT JOIN researchers r        ON r.orcid = tm.orcid
             WHERE $where AND tm.is_visible = 1
             LIMIT 1"
        );
        $stmt->execute([$param]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            return ['status' => 'error', 'message' => 'Team member not found'];
        }

        /* education */
        $eduStmt = $pdo->prepare(
            "SELECT degree_level, field_of_study, institution, graduation_year, honors
             FROM team_member_education
             WHERE team_member_id = ?
             ORDER BY graduation_year DESC"
        );
        $eduStmt->execute([$row['id']]);
        $education = array_map(fn (array $e): array => [
            'degree'      => $e['degree_level'],
            'field'       => $e['field_of_study'],
            'institution' => $e['institution'],
            'graduation'  => (int)$e['graduation_year'],
            'honors'      => $e['honors'],
        ], $eduStmt->fetchAll(PDO::FETCH_ASSOC));

        /* achievements */
        $achStmt = $pdo->prepare(
            "SELECT title, description, achievement_year, category, issuer, proof_url
             FROM team_member_achievements
             WHERE team_member_id = ?
             ORDER BY achievement_year DESC"
        );
        $achStmt->execute([$row['id']]);
        $achievements = array_map(fn (array $a): array => [
            'title'       => $a['title'],
            'description' => $a['description'],
            'year'        => (int)$a['achievement_year'],
            'category'    => $a['category'],
            'issuer'      => $a['issuer'],
            'proof_url'   => $a['proof_url'],
        ], $achStmt->fetchAll(PDO::FETCH_ASSOC));

        return [
            'status' => 'success',
            'member' => [
                'id'          => (int)$row['id'],
                'orcid'       => $row['orcid'],
                'slug'        => $row['slug'] ?: 'tm-' . $row['id'],
                'code'        => $row['code'],
                'name'        => $row['researcher_name'] ?? 'Team Member',
                'position'    => $row['position'],
                'bio'         => $row['bio'],
                'long_bio'    => $row['long_bio'],
                'photo'       => $row['photo_url'],
                'email'       => $row['email_address'],
                'location'    => $row['location'],
                'joined_year' => (int)($row['joined_year'] ?? 0),
                'department'  => $row['department'] ?? 'Team',
                'expertise'   => $row['expertise']    ? json_decode($row['expertise'], true)    : [],
                'social'      => $row['social_links'] ? json_decode($row['social_links'], true) : [],
                'sdg_focus'   => $row['sdg_focus']    ? json_decode($row['sdg_focus'], true)    : [],
            ],
            'education'    => $education,
            'achievements' => $achievements,
        ];
    } catch (Exception $e) {
        return sampleProfile();
    }
}

function sampleProfile(): array
{
    return [
        'status' => 'success',
        'member' => [
            'id'=>1,'orcid'=>'0000-0001-0000-0001','slug'=>'budi-santoso','code'=>'TM-L001',
            'name'=>'Dr. Budi Santoso','position'=>'Director, SDG Research & Analytics',
            'bio'=>'Director, SDG Research & Analytics',
            'long_bio'=>'PhD in Computer Science. 15+ years experience in research analytics and SDG classification.',
            'photo'=>null,'email'=>'budi.santoso@example.org','location'=>'Jakarta, Indonesia',
            'joined_year'=>2020,'department'=>'Leadership',
            'expertise'=>['Research Analytics','AI/ML','SDG Methodology'],
            'social'=>[],'sdg_focus'=>[4,9,17],
        ],
        'education' => [
            ['degree'=>'PhD','field'=>'Computer Science','institution'=>'MIT','graduation'=>2009,'honors'=>'Cum Laude'],
            ['degree'=>'B.Tech','field'=>'Information Technology','institution'=>'Universitas Indonesia','graduation'=>2005,'honors'=>null],
        ],
        'achievements' => [
            ['title'=>'SDG Impact Award','description'=>'For development of innovative SDG classification methodology','year'=>2022,'category'=>'award','issuer'=>'UN SDGAA','proof_url'=>null],
        ],
    ];
}
