<?php
/**
 * User Preferences API
 * GET /api/user_preferences.php?orcid=
 * PUT /api/user_preferences.php (update preferences)
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
        $orcid = trim($_GET['orcid'] ?? '');
        if (!$orcid) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'ORCID required']);
            exit;
        }
        echo json_encode(getUserPreferences($orcid));
    } elseif ($method === 'PUT') {
        echo json_encode(updateUserPreferences());
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

function getUserPreferences(string $orcid): array {
    if (!defined('DB_HOST') || !DB_HOST) {
        return getSampleUserPreferences();
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $stmt = $pdo->prepare("
            SELECT * FROM user_preferences WHERE orcid = ?
        ");
        $stmt->execute([$orcid]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$prefs) {
            // Create default preferences if not exists
            $createStmt = $pdo->prepare("
                INSERT INTO user_preferences (orcid) VALUES (?)
                ON DUPLICATE KEY UPDATE updated_at = NOW()
            ");
            $createStmt->execute([$orcid]);

            $stmt->execute([$orcid]);
            $prefs = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        $customPrefs = json_decode($prefs['custom_preferences'] ?? '{}', true);

        return [
            'status' => 'success',
            'preferences' => [
                'orcid' => $prefs['orcid'],
                'language' => $prefs['language'],
                'timezone' => $prefs['timezone'],
                'theme' => $prefs['theme'],
                'notification' => [
                    'email_digest' => $prefs['notification_email_digest'],
                    'push_enabled' => (bool)$prefs['notification_push_enabled'],
                    'email_enabled' => (bool)$prefs['notification_email_enabled'],
                    'in_app_enabled' => (bool)$prefs['notification_in_app_enabled']
                ],
                'notification_preferences' => [
                    'research_area' => (bool)$prefs['research_area_notifications'],
                    'collaboration' => (bool)$prefs['collaboration_notifications'],
                    'opportunity' => (bool)$prefs['opportunity_notifications'],
                    'system' => (bool)$prefs['system_notifications']
                ],
                'privacy' => [
                    'profile_visibility' => $prefs['privacy_profile_visibility'],
                    'show_affiliations' => (bool)$prefs['privacy_show_affiliations'],
                    'show_publications' => (bool)$prefs['privacy_show_publications'],
                    'show_collaborations' => (bool)$prefs['privacy_show_collaborations']
                ],
                'newsletter_subscribed' => (bool)$prefs['newsletter_subscribed'],
                'custom_preferences' => is_array($customPrefs) ? $customPrefs : []
            ],
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return getSampleUserPreferences();
    }
}

function updateUserPreferences(): array {
    $input = json_decode(file_get_contents('php://input'), true);
    $orcid = $input['orcid'] ?? '';

    if (!$orcid) {
        return ['status' => 'error', 'message' => 'ORCID required'];
    }

    if (!defined('DB_HOST') || !DB_HOST) {
        return ['status' => 'error', 'message' => 'Database not configured'];
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_DATABASE . ';charset=utf8mb4',
            DB_USERNAME, DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        $updates = [];
        $params = [];

        // Basic preferences
        if (isset($input['language'])) {
            $updates[] = 'language = ?';
            $params[] = $input['language'];
        }
        if (isset($input['timezone'])) {
            $updates[] = 'timezone = ?';
            $params[] = $input['timezone'];
        }
        if (isset($input['theme'])) {
            $updates[] = 'theme = ?';
            $params[] = $input['theme'];
        }
        if (isset($input['newsletter_subscribed'])) {
            $updates[] = 'newsletter_subscribed = ?';
            $params[] = $input['newsletter_subscribed'] ? 1 : 0;
        }

        // Notification preferences
        if (isset($input['notification'])) {
            $notif = $input['notification'];
            if (isset($notif['email_digest'])) {
                $updates[] = 'notification_email_digest = ?';
                $params[] = $notif['email_digest'];
            }
            if (isset($notif['push_enabled'])) {
                $updates[] = 'notification_push_enabled = ?';
                $params[] = $notif['push_enabled'] ? 1 : 0;
            }
            if (isset($notif['email_enabled'])) {
                $updates[] = 'notification_email_enabled = ?';
                $params[] = $notif['email_enabled'] ? 1 : 0;
            }
            if (isset($notif['in_app_enabled'])) {
                $updates[] = 'notification_in_app_enabled = ?';
                $params[] = $notif['in_app_enabled'] ? 1 : 0;
            }
        }

        // Topic notifications
        if (isset($input['notification_preferences'])) {
            $topics = $input['notification_preferences'];
            if (isset($topics['research_area'])) {
                $updates[] = 'research_area_notifications = ?';
                $params[] = $topics['research_area'] ? 1 : 0;
            }
            if (isset($topics['collaboration'])) {
                $updates[] = 'collaboration_notifications = ?';
                $params[] = $topics['collaboration'] ? 1 : 0;
            }
            if (isset($topics['opportunity'])) {
                $updates[] = 'opportunity_notifications = ?';
                $params[] = $topics['opportunity'] ? 1 : 0;
            }
            if (isset($topics['system'])) {
                $updates[] = 'system_notifications = ?';
                $params[] = $topics['system'] ? 1 : 0;
            }
        }

        // Privacy preferences
        if (isset($input['privacy'])) {
            $privacy = $input['privacy'];
            if (isset($privacy['profile_visibility'])) {
                $updates[] = 'privacy_profile_visibility = ?';
                $params[] = $privacy['profile_visibility'];
            }
            if (isset($privacy['show_affiliations'])) {
                $updates[] = 'privacy_show_affiliations = ?';
                $params[] = $privacy['show_affiliations'] ? 1 : 0;
            }
            if (isset($privacy['show_publications'])) {
                $updates[] = 'privacy_show_publications = ?';
                $params[] = $privacy['show_publications'] ? 1 : 0;
            }
            if (isset($privacy['show_collaborations'])) {
                $updates[] = 'privacy_show_collaborations = ?';
                $params[] = $privacy['show_collaborations'] ? 1 : 0;
            }
        }

        if (empty($updates)) {
            return ['status' => 'error', 'message' => 'No preferences to update'];
        }

        $params[] = $orcid;
        $sql = "UPDATE user_preferences SET " . implode(', ', $updates) . " WHERE orcid = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return [
            'status' => 'success',
            'message' => 'Preferences updated successfully',
            'timestamp' => date('c')
        ];
    } catch (Exception $e) {
        error_log($e->getMessage());
        return ['status' => 'error', 'message' => 'Failed to update preferences'];
    }
}

function getSampleUserPreferences(): array {
    return [
        'status' => 'success',
        'preferences' => [
            'orcid' => '0000-0001-1234-5678',
            'language' => 'en',
            'timezone' => 'UTC',
            'theme' => 'light',
            'notification' => [
                'email_digest' => 'daily',
                'push_enabled' => true,
                'email_enabled' => true,
                'in_app_enabled' => true
            ],
            'notification_preferences' => [
                'research_area' => true,
                'collaboration' => true,
                'opportunity' => true,
                'system' => true
            ],
            'privacy' => [
                'profile_visibility' => 'public',
                'show_affiliations' => true,
                'show_publications' => true,
                'show_collaborations' => false
            ],
            'newsletter_subscribed' => true,
            'custom_preferences' => []
        ],
        'timestamp' => date('c')
    ];
}
