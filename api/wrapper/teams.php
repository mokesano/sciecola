<?php
/**
 * Public Teams API — list of platform team members (managed by super admin).
 * Schema-aware: name comes from researchers via orcid FK; team_members holds
 *   position, bio, photo, expertise, social_links, display_order, slug, code,
 *   long_bio, joined_year, location, sdg_focus, is_visible.
 *
 * GET /api/wrapper/teams.php?department=all|<slug>&limit=100
 * Returns: { status, members[], total, department_counts{}, timestamp }
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $department = trim($_GET['department'] ?? 'all');
    $limit      = min(200, max(1, (int)($_GET['limit'] ?? 100)));

    [$members, $deptCounts, $departments] = fetchTeam($department, $limit);

    echo json_encode([
        'status'             => 'success',
        'members'            => $members,
        'departments'        => $departments,
        'department_counts'  => $deptCounts,
        'total'              => count($members),
        'timestamp'          => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function fetchTeam(string $departmentFilter, int $limit): array
{
    if (!defined('DB_HOST') || !DB_HOST) {
        return [sampleMembers(), sampleDeptCounts(), sampleDepartments()];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        /* Departments + counts */
        $deptStmt = $pdo->query(
            "SELECT td.id, td.name,
                    SUM(CASE WHEN tm.is_visible = 1 THEN 1 ELSE 0 END) AS cnt
             FROM team_departments td
             LEFT JOIN team_members tm ON tm.department_id = td.id
             GROUP BY td.id, td.name
             ORDER BY td.id ASC"
        );
        $departments = [];
        $deptCounts  = [];
        foreach ($deptStmt->fetchAll(PDO::FETCH_ASSOC) as $d) {
            $departments[] = ['id' => (int)$d['id'], 'name' => $d['name']];
            $deptCounts[$d['name']] = (int)$d['cnt'];
        }

        /* Main list — join researchers for name */
        $where  = ['tm.is_visible = 1'];
        $params = [];
        if ($departmentFilter !== 'all' && $departmentFilter !== '') {
            $where[] = 'td.name = ?';
            $params[] = $departmentFilter;
        }
        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $sql = "SELECT tm.id, tm.orcid, tm.slug, tm.code, tm.position, tm.bio,
                       tm.long_bio, tm.photo_url, tm.location, tm.joined_year,
                       tm.expertise, tm.social_links, tm.sdg_focus,
                       tm.display_order, td.name AS department,
                       r.name AS researcher_name
                FROM team_members tm
                LEFT JOIN team_departments td ON td.id = tm.department_id
                LEFT JOIN researchers r        ON r.orcid = tm.orcid
                $whereClause
                ORDER BY tm.display_order ASC, td.id ASC, r.name ASC
                LIMIT ?";
        $params[] = $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $members = array_map(fn (array $r): array => [
                'id'          => (int)$r['id'],
                'orcid'       => $r['orcid'],
                'slug'        => $r['slug'] ?: 'tm-' . $r['id'],
                'code'        => $r['code'],
                'name'        => $r['researcher_name'] ?? 'Team Member',
                'position'    => $r['position'],
                'bio'         => $r['bio'],
                'long_bio'    => $r['long_bio'],
                'photo'       => $r['photo_url'],
                'location'    => $r['location'],
                'joined_year' => (int)($r['joined_year'] ?? 0),
                'department'  => $r['department'] ?? 'Team',
                'expertise'   => $r['expertise']     ? json_decode($r['expertise'], true)     : [],
                'social'      => $r['social_links']  ? json_decode($r['social_links'], true)  : [],
                'sdg_focus'   => $r['sdg_focus']     ? json_decode($r['sdg_focus'], true)     : [],
            ], $rows);
            return [$members, $deptCounts, $departments];
        }
    } catch (Exception $e) { /* fall through */ }

    return [sampleMembers(), sampleDeptCounts(), sampleDepartments()];
}

function sampleDepartments(): array
{
    return [
        ['id'=>1,'name'=>'Leadership'],
        ['id'=>2,'name'=>'Research'],
        ['id'=>3,'name'=>'Engineering'],
        ['id'=>4,'name'=>'Advisory'],
    ];
}

function sampleDeptCounts(): array
{
    return ['Leadership'=>2,'Research'=>3,'Engineering'=>3,'Advisory'=>2];
}

function sampleMembers(): array
{
    return [
        ['id'=>1,'orcid'=>'0000-0001-0000-0001','slug'=>'budi-santoso','code'=>'TM-L001','name'=>'Dr. Budi Santoso','position'=>'Director, SDG Research & Analytics','bio'=>'Director, SDG Research & Analytics','long_bio'=>'PhD in Computer Science. 15+ years experience in research analytics and SDG classification.','photo'=>null,'location'=>'Jakarta, Indonesia','joined_year'=>2020,'department'=>'Leadership','expertise'=>['Research Analytics','AI/ML','SDG Methodology'],'social'=>[],'sdg_focus'=>[4,9,17]],
        ['id'=>2,'orcid'=>'0000-0001-0000-0002','slug'=>'siti-nurhaliza','code'=>'TM-A001','name'=>'Siti Nurhaliza','position'=>'Senior AI/ML Engineer','bio'=>'Senior AI/ML Engineer','long_bio'=>'M.Tech in AI. Expert in machine learning and NLP for SDG classification.','photo'=>null,'location'=>'Bandung, Indonesia','joined_year'=>2021,'department'=>'Engineering','expertise'=>['NLP','MLOps','Python'],'social'=>[],'sdg_focus'=>[4,9]],
        ['id'=>3,'orcid'=>'0000-0001-0000-0003','slug'=>'eko-wijaya','code'=>'TM-R001','name'=>'Eko Wijaya','position'=>'Research Analyst','bio'=>'Research Analyst','long_bio'=>'MSc in Environmental Science. Focus on SDG impact assessment.','photo'=>null,'location'=>'Surabaya, Indonesia','joined_year'=>2022,'department'=>'Research','expertise'=>['SDG Impact','Climate Science'],'social'=>[],'sdg_focus'=>[13,14,15]],
    ];
}
