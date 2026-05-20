<?php
/**
 * Admin Teams API — super admin CRUD for team_members.
 *
 *   GET    ?action=list                → all members incl. hidden
 *   GET    ?action=departments         → departments + researcher candidates
 *   POST   ?action=create              → insert team member
 *   POST   ?action=update&id=N         → update existing
 *   POST   ?action=delete&id=N         → remove member
 *   POST   ?action=toggle_visibility&id=N
 *
 * Body (create/update) JSON:
 *   { orcid, department_id, position, bio, long_bio, photo_url,
 *     slug, code, location, joined_year,
 *     expertise:[...], social_links:{...}, sdg_focus:[...],
 *     display_order, is_visible }
 *
 * NOTE: This endpoint MUST be guarded by upstream auth (admin role).
 *       Frontend uses /admin route which already requires admin.
 */

declare(strict_types=1);
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

try {
    if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
    $configFile = ROOT_PATH . '/config/config.php';
    if (file_exists($configFile)) require_once $configFile;

    $action = $_GET['action'] ?? 'list';
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        switch ($action) {
            case 'list':         echo json_encode(listMembers());     break;
            case 'departments':  echo json_encode(listDepartments()); break;
            default:
                http_response_code(400);
                echo json_encode(['status'=>'error','message'=>'Invalid GET action']);
        }
        exit;
    }

    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['status'=>'error','message'=>'Method not allowed']);
        exit;
    }

    $id   = (int)($_GET['id'] ?? 0);
    $body = json_decode(file_get_contents('php://input') ?: '', true) ?? [];

    switch ($action) {
        case 'create':              echo json_encode(createMember($body));         break;
        case 'update':              echo json_encode(updateMember($id, $body));    break;
        case 'delete':              echo json_encode(deleteMember($id));           break;
        case 'toggle_visibility':   echo json_encode(toggleVisibility($id));       break;
        default:
            http_response_code(400);
            echo json_encode(['status'=>'error','message'=>'Invalid POST action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>$e->getMessage()]);
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function pdo(): PDO
{
    return new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
        DB_USERNAME, DB_PASSWORD,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
}

function dbConfigured(): bool
{
    return defined('DB_HOST') && DB_HOST;
}

/* ─── list / departments ─────────────────────────────────────────────────── */

function listMembers(): array
{
    if (!dbConfigured()) {
        return ['status'=>'success','members'=>[]];
    }
    try {
        $stmt = pdo()->query(
            "SELECT tm.id, tm.orcid, tm.slug, tm.code, tm.position, tm.bio,
                    tm.long_bio, tm.photo_url, tm.location, tm.joined_year,
                    tm.expertise, tm.social_links, tm.sdg_focus,
                    tm.display_order, tm.is_visible, tm.department_id,
                    td.name AS department,
                    r.name AS researcher_name
             FROM team_members tm
             LEFT JOIN team_departments td ON td.id = tm.department_id
             LEFT JOIN researchers r        ON r.orcid = tm.orcid
             ORDER BY tm.display_order ASC, td.id ASC, r.name ASC"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $members = array_map(fn (array $r): array => [
            'id'             => (int)$r['id'],
            'orcid'          => $r['orcid'],
            'name'           => $r['researcher_name'] ?? '(researcher missing)',
            'slug'           => $r['slug'],
            'code'           => $r['code'],
            'position'       => $r['position'],
            'bio'            => $r['bio'],
            'long_bio'       => $r['long_bio'],
            'photo_url'      => $r['photo_url'],
            'location'       => $r['location'],
            'joined_year'    => (int)($r['joined_year'] ?? 0),
            'department_id'  => (int)$r['department_id'],
            'department'     => $r['department'],
            'expertise'      => $r['expertise']     ? json_decode($r['expertise'], true)     : [],
            'social_links'   => $r['social_links']  ? json_decode($r['social_links'], true)  : [],
            'sdg_focus'      => $r['sdg_focus']     ? json_decode($r['sdg_focus'], true)     : [],
            'display_order'  => (int)$r['display_order'],
            'is_visible'     => (bool)$r['is_visible'],
        ], $rows);

        return ['status'=>'success','members'=>$members,'total'=>count($members)];
    } catch (Exception $e) {
        return ['status'=>'error','message'=>$e->getMessage()];
    }
}

function listDepartments(): array
{
    if (!dbConfigured()) {
        return ['status'=>'success','departments'=>[],'researchers'=>[]];
    }
    try {
        $pdo  = pdo();
        $depts = $pdo->query("SELECT id, name, description FROM team_departments ORDER BY id ASC")
                     ->fetchAll(PDO::FETCH_ASSOC);

        /* researcher candidates not yet on the team */
        $researchers = $pdo->query(
            "SELECT r.orcid, r.name, r.country
             FROM researchers r
             LEFT JOIN team_members tm ON tm.orcid = r.orcid
             WHERE tm.id IS NULL
             ORDER BY r.name ASC
             LIMIT 200"
        )->fetchAll(PDO::FETCH_ASSOC);

        return [
            'status'      => 'success',
            'departments' => array_map(fn ($d): array => [
                'id' => (int)$d['id'],
                'name' => $d['name'],
                'description' => $d['description'],
            ], $depts),
            'researchers' => $researchers,
        ];
    } catch (Exception $e) {
        return ['status'=>'error','message'=>$e->getMessage()];
    }
}

/* ─── create / update / delete ───────────────────────────────────────────── */

function validateMember(array $data, bool $isCreate = true): array
{
    $errors = [];
    if ($isCreate && empty($data['orcid']))       $errors['orcid']         = 'required';
    if (empty($data['department_id']))            $errors['department_id'] = 'required';
    if (empty($data['position']))                 $errors['position']      = 'required';
    return $errors;
}

function createMember(array $data): array
{
    $errors = validateMember($data, true);
    if ($errors) {
        http_response_code(422);
        return ['status'=>'error','errors'=>$errors];
    }
    if (!dbConfigured()) {
        return ['status'=>'success','message'=>'DB not configured (no-op)','id'=>null];
    }

    try {
        $pdo = pdo();
        $stmt = $pdo->prepare(
            "INSERT INTO team_members
                (orcid, department_id, position, bio, long_bio, photo_url,
                 slug, code, location, joined_year,
                 expertise, social_links, sdg_focus,
                 display_order, is_visible)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            $data['orcid'],
            (int)$data['department_id'],
            $data['position'],
            $data['bio']         ?? null,
            $data['long_bio']    ?? null,
            $data['photo_url']   ?? null,
            $data['slug']        ?? null,
            $data['code']        ?? null,
            $data['location']    ?? null,
            !empty($data['joined_year']) ? (int)$data['joined_year'] : null,
            !empty($data['expertise'])    ? json_encode($data['expertise'])    : null,
            !empty($data['social_links']) ? json_encode($data['social_links']) : null,
            !empty($data['sdg_focus'])    ? json_encode($data['sdg_focus'])    : null,
            (int)($data['display_order'] ?? 0),
            !empty($data['is_visible']) ? 1 : 0,
        ]);
        return ['status'=>'success','id'=>(int)$pdo->lastInsertId(),'message'=>'Team member created'];
    } catch (Exception $e) {
        http_response_code(500);
        return ['status'=>'error','message'=>$e->getMessage()];
    }
}

function updateMember(int $id, array $data): array
{
    if ($id <= 0) {
        http_response_code(400);
        return ['status'=>'error','message'=>'id required'];
    }
    $errors = validateMember($data, false);
    if ($errors) {
        http_response_code(422);
        return ['status'=>'error','errors'=>$errors];
    }
    if (!dbConfigured()) {
        return ['status'=>'success','message'=>'DB not configured (no-op)'];
    }

    try {
        $stmt = pdo()->prepare(
            "UPDATE team_members SET
                department_id = ?, position = ?, bio = ?, long_bio = ?, photo_url = ?,
                slug = ?, code = ?, location = ?, joined_year = ?,
                expertise = ?, social_links = ?, sdg_focus = ?,
                display_order = ?, is_visible = ?
             WHERE id = ?"
        );
        $stmt->execute([
            (int)$data['department_id'],
            $data['position'],
            $data['bio']         ?? null,
            $data['long_bio']    ?? null,
            $data['photo_url']   ?? null,
            $data['slug']        ?? null,
            $data['code']        ?? null,
            $data['location']    ?? null,
            !empty($data['joined_year']) ? (int)$data['joined_year'] : null,
            !empty($data['expertise'])    ? json_encode($data['expertise'])    : null,
            !empty($data['social_links']) ? json_encode($data['social_links']) : null,
            !empty($data['sdg_focus'])    ? json_encode($data['sdg_focus'])    : null,
            (int)($data['display_order'] ?? 0),
            !empty($data['is_visible']) ? 1 : 0,
            $id,
        ]);
        return ['status'=>'success','message'=>'Team member updated'];
    } catch (Exception $e) {
        http_response_code(500);
        return ['status'=>'error','message'=>$e->getMessage()];
    }
}

function deleteMember(int $id): array
{
    if ($id <= 0) {
        http_response_code(400);
        return ['status'=>'error','message'=>'id required'];
    }
    if (!dbConfigured()) {
        return ['status'=>'success','message'=>'DB not configured (no-op)'];
    }
    try {
        pdo()->prepare("DELETE FROM team_members WHERE id = ?")->execute([$id]);
        return ['status'=>'success','message'=>'Team member deleted'];
    } catch (Exception $e) {
        http_response_code(500);
        return ['status'=>'error','message'=>$e->getMessage()];
    }
}

function toggleVisibility(int $id): array
{
    if ($id <= 0) {
        http_response_code(400);
        return ['status'=>'error','message'=>'id required'];
    }
    if (!dbConfigured()) {
        return ['status'=>'success','message'=>'DB not configured (no-op)'];
    }
    try {
        pdo()->prepare("UPDATE team_members SET is_visible = 1 - is_visible WHERE id = ?")
             ->execute([$id]);
        return ['status'=>'success','message'=>'Visibility toggled'];
    } catch (Exception $e) {
        http_response_code(500);
        return ['status'=>'error','message'=>$e->getMessage()];
    }
}
