<?php
/**
 * File: /includes/functions.php
 * Kumpulan fungsi utama untuk Sicola (Diambil dari logika inti wizdam-sicola.php v2.0.1)
 * Fitur Utama: Anti-Timeout Proxy & Batching Processor
 */

if (!defined('ROOT_PATH')) {
    exit('Direct script access is not allowed.');
}

// ================================================================
// 1. KONSTANTA APLIKASI
// ================================================================
define('AJAX_BATCH_SIZE', 5);

// ================================================================
// 2. FUNGSI DETEKSI & PROXY ROUTER
// ================================================================

/**
 * Mendeteksi apakah request saat ini adalah request AJAX/API
 * berdasarkan parameter _sdg atau proxy_action
 */
function is_api_request() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['_sdg'])) {
        return true;
    } elseif (isset($_GET['proxy_action'])) {
        return true;
    }
    return false;
}

/**
 * Menangani request API secara Proxy.
 * Ini adalah kode inti "Anti-Timeout" dari wizdam-sicola.php yang mem-bypass WAF,
 * menangani batch (offset & limit), dan membersihkan output API menjadi JSON murni.
 * 
 * @param string $api_file_path Lokasi absolut ke file SDG_Classification_API.php
 */
function handle_api_proxy_request($api_file_path) {
    $_sdg_post = null;
    
    // Tangkap parameter
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['_sdg'])) {
        $_sdg_post = $_POST;
    } elseif (isset($_GET['proxy_action'])) {
        $_sdg_post = array_merge(['_sdg' => $_GET['proxy_action']], $_GET);
    }

    if ($_sdg_post !== null) {
        // Bersihkan semua output buffer yang mungkin ada sebelumnya
        while (ob_get_level()) ob_end_clean();
        header('Content-Type: application/json; charset=utf-8');

        if (!file_exists($api_file_path)) {
            http_response_code(503);
            echo json_encode(['status' => 'error', 'message' => 'File API tidak ditemukan: ' . $api_file_path]);
            exit;
        }

        $pxa    = $_sdg_post['_sdg'];
        $params = [];

        // Validasi dan set up parameter berdasarkan aksi
        switch ($pxa) {
            case 'init':
                if (empty($_sdg_post['orcid'])) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'orcid required']); exit; }
                $params = ['orcid' => trim($_sdg_post['orcid']), 'action' => 'init'];
                if (!empty($_sdg_post['refresh'])) $params['refresh'] = 'true';
                break;
            case 'batch':
                if (empty($_sdg_post['orcid'])) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'orcid required']); exit; }
                $params = [
                    'orcid'  => trim($_sdg_post['orcid']),
                    'action' => 'batch',
                    'offset' => (int)($_sdg_post['offset'] ?? 0),
                    'limit'  => (int)($_sdg_post['limit'] ?? AJAX_BATCH_SIZE)
                ];
                if (!empty($_sdg_post['refresh'])) $params['refresh'] = 'true';
                break;
            case 'summary':
                if (empty($_sdg_post['orcid'])) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'orcid required']); exit; }
                $params = ['orcid' => trim($_sdg_post['orcid']), 'action' => 'summary'];
                break;
            case 'doi':
                if (empty($_sdg_post['doi'])) { http_response_code(400); echo json_encode(['status'=>'error','message'=>'doi required']); exit; }
                $params = ['doi' => trim($_sdg_post['doi'])];
                if (!empty($_sdg_post['refresh'])) $params['refresh'] = 'true';
                break;
            default:
                http_response_code(400); echo json_encode(['status'=>'error','message'=>'Unknown action: ' . htmlspecialchars($pxa)]); exit;
        }

        // Manipulasi Superglobal untuk membohongi API seolah-olah ini request GET langsung
        $orig_get = $_GET;
        $_GET = $params;
        $orig_method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $_SERVER['REQUEST_METHOD'] = 'GET';
        
        $prev_err = ini_get('display_errors');
        ini_set('display_errors', '0');
        
        // Mulai penangkapan output
        ob_start();
        try { 
            require $api_file_path; 
        } catch (Throwable $t) {
            ob_end_clean(); 
            $_GET = $orig_get; 
            ini_set('display_errors', $prev_err);
            http_response_code(500); 
            echo json_encode(['status'=>'error','message'=>'Fatal: ' . $t->getMessage()]); 
            exit;
        }
        $raw = ob_get_clean();
        
        // Kembalikan Superglobal ke kondisi awal
        ini_set('display_errors', $prev_err);
        $_GET = $orig_get;
        $_SERVER['REQUEST_METHOD'] = $orig_method; 

        // Ekstraksi JSON (Membuang pesan error PHP yang mungkin terikut di awal output)
        $jpos = false;
        for ($i = 0, $l = strlen($raw); $i < $l; $i++) { 
            if ($raw[$i] === '{' || $raw[$i] === '[') { 
                $jpos = $i; 
                break; 
            } 
        }
        
        $json_str = ($jpos !== false) ? substr($raw, $jpos) : '';
        
        if (empty($json_str)) { 
            http_response_code(500); 
            echo json_encode(['status'=>'error','message'=>'API tidak menghasilkan output']); 
            exit; 
        }
        
        // Validasi struktur JSON
        json_decode($json_str);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Output API bukan JSON: ' . json_last_error_msg(),
                'raw' => base64_encode(substr(strip_tags($raw), 0, 300))
            ]);
            exit;
        }
        
        // Keluarkan output JSON murni
        echo $json_str;
        exit;
    }
}

// ================================================================
// 3. HELPER RESPONSE
// ================================================================

function send_json_response(array $data, int $status = 200): void {
    while (ob_get_level()) ob_end_clean();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// ================================================================
// 4. API WRAPPER ROUTER
// ================================================================

function is_wrapper_api_request(): bool {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    return (bool) preg_match('#^/api/[^/]+\.php$#i', $uri);
}

function route_api_wrapper(): void {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (!preg_match('#^/api/([^/]+\.php)$#i', $uri, $m)) {
        send_json_response(['status' => 'error', 'message' => 'Invalid API path'], 400);
    }

    $filename = basename($m[1]);

    static $allowed = [
        'analytics.php', 'article_profile.php', 'articles.php', 'auth.php',
        'cache_handler.php', 'collaboration.php', 'innovation_marketplace.php',
        'journal_profile.php', 'journals.php',
        'leaderboard.php', 'log_history.php', 'my_activity.php',
        'my_articles.php', 'my_collections.php', 'my_profile.php',
        'my_statistics.php', 'platform_stats.php', 'projects.php',
        'researcher_distribution.php', 'researcher_profile.php', 'researchers.php',
        'research_matching.php', 'sdg_distribution.php', 'trends.php',
    ];

    if (!in_array($filename, $allowed, true)) {
        send_json_response(['status' => 'error', 'message' => 'Endpoint tidak ditemukan'], 404);
    }

    $wrapperFile = ROOT_PATH . '/api/wrapper/' . $filename;
    if (!file_exists($wrapperFile)) {
        send_json_response(['status' => 'error', 'message' => 'Endpoint belum tersedia'], 503);
    }

    require $wrapperFile;
    exit;
}

// ================================================================
// 5. DEFINISI DATA GLOBAL
// ================================================================

/**
 * Mengembalikan array Definisi SDG dengan SVG icons resmi UN
 */
function get_sdg_definitions() {
    return [
        'SDG1'  => ['title'=>'No Poverty', 'color'=>'#e5243b','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_1.svg'],
        'SDG2'  => ['title'=>'Zero Hunger', 'color'=>'#dda63a','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_2.svg'],
        'SDG3'  => ['title'=>'Good Health and Well-being', 'color'=>'#4c9f38','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_3.svg'],
        'SDG4'  => ['title'=>'Quality Education', 'color'=>'#c5192d','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_4.svg'],
        'SDG5'  => ['title'=>'Gender Equality', 'color'=>'#ff3a21','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_5.svg'],
        'SDG6'  => ['title'=>'Clean Water and Sanitation', 'color'=>'#26bde2','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_6.svg'],
        'SDG7'  => ['title'=>'Affordable and Clean Energy', 'color'=>'#fcc30b','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_7.svg'],
        'SDG8'  => ['title'=>'Decent Work and Economic Growth', 'color'=>'#a21942','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_8.svg'],
        'SDG9'  => ['title'=>'Industry, Innovation and Infrastructure', 'color'=>'#fd6925','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_9.svg'],
        'SDG10' => ['title'=>'Reduced Inequalities', 'color'=>'#dd1367','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_10.svg'],
        'SDG11' => ['title'=>'Sustainable Cities and Communities', 'color'=>'#fd9d24','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_11.svg'],
        'SDG12' => ['title'=>'Responsible Consumption and Production', 'color'=>'#bf8b2e','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_12.svg'],
        'SDG13' => ['title'=>'Climate Action', 'color'=>'#3f7e44','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_13.svg'],
        'SDG14' => ['title'=>'Life Below Water', 'color'=>'#0a97d9','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_14.svg'],
        'SDG15' => ['title'=>'Life on Land', 'color'=>'#56c02b','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_15.svg'],
        'SDG16' => ['title'=>'Peace, Justice and Strong Institutions', 'color'=>'#00689d','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_16.svg'],
        'SDG17' => ['title'=>'Partnerships for the Goals', 'color'=>'#19486a','svg_url'=>'https://assets.sangia.org/img/SDGs_icon_SVG/Artboard_17.svg'],
    ];
}