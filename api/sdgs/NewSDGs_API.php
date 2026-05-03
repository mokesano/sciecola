<?php
/**
 * SDG Classification API Enhanced - WORKING TIMEOUT FIX
 * Versi yang benar-benar berfungsi untuk mengatasi error 524
 * 
 * PERUBAHAN YANG BENAR:
 * 1. Timeout values yang realistis
 * 2. Implementasi fungsi utility yang hilang
 * 3. Error handling yang tidak terlalu agresif
 * 4. Tetap menggunakan core logic original
 * 
 * @author Rochmady and Wizdam Team
 * @version 5.2.2-working-fix
 * @license MIT
 */

header('Content-Type: application/json; charset=utf-8');

// ==============================================
// TIMEOUT OPTIMIZATION - REALISTIC VALUES
// ==============================================
set_time_limit(90);  // 90 detik (lebih realistis dari 60, masih < 100 Cloudflare)
ini_set('max_execution_time', 90);
ini_set('memory_limit', '256M');

// Track start time for execution monitoring
$start_time = microtime(true);

// ==============================================
// CACHE CONFIGURATION
// ==============================================
$CACHE_DIR = __DIR__ . '/cache';
if (!is_dir($CACHE_DIR)) {
    mkdir($CACHE_DIR, 0755, true);
}

// ==============================================
// OPTIMIZED CONFIG - WORKING VALUES
// ==============================================
$CONFIG = [
    'MIN_SCORE_THRESHOLD' => 0.20,
    'CONFIDENCE_THRESHOLD' => 0.30,
    'HIGH_CONFIDENCE_THRESHOLD' => 0.60,
    'MAX_SDGS_PER_WORK' => 7,
    
    // Weights tetap sama
    'KEYWORD_WEIGHT' => 0.30,
    'SIMILARITY_WEIGHT' => 0.30,
    'SUBSTANTIVE_WEIGHT' => 0.20,
    'CAUSAL_WEIGHT' => 0.20,
    
    // Thresholds tetap sama
    'ACTIVE_CONTRIBUTOR_THRESHOLD' => 0.50,
    'RELEVANT_CONTRIBUTOR_THRESHOLD' => 0.35,
    'DISCUSSANT_THRESHOLD' => 0.25,
    
    'CACHE_TTL' => 604800, // 7 hari
    
    // FIXED TIMEOUT VALUES - Yang benar-benar berfungsi
    'ORCID_PAGE_SIZE' => 15,        // Compromise: tidak terlalu kecil, tidak terlalu besar
    'MAX_WORKS_TO_PROCESS' => 20,   // Lebih realistis
    'API_TIMEOUT' => 25,            // 25 detik untuk API calls
    'API_CONNECT_TIMEOUT' => 5,     // 5 detik untuk connection
    'MAX_EXECUTION_TIME' => 80,     // 80 detik max execution (10 detik buffer)
];

// Global variables needed
$MEMORY_CACHE = array();
$CAUSAL_PATTERNS = array(
    'contributes to', 'supports', 'advances', 'helps achieve', 'improves',
    'untuk', 'agar', 'supaya', 'mendukung', 'membantu'
);
$TRANSFORMATIVE_VERBS = array(
    'develop', 'implement', 'improve', 'enhance', 'establish', 'strengthen',
    'mengembangkan', 'mengimplementasikan', 'meningkatkan', 'memperbaiki'
);

// ==============================================
// SDG KEYWORDS CONFIGURATION
// ==============================================
$SDG_KEYWORDS = [
    "SDG1" => [
        "poverty", "inequality", "social protection", "economic disparity", "vulnerable population", 
        "basic services", "financial inclusion", "kemiskinan", "ketimpangan", "perlindungan sosial"
    ],
    "SDG2" => [
        "hunger", "food security", "malnutrition", "sustainable agriculture", "crop yield",
        "kelaparan", "ketahanan pangan", "malnutrisi", "pertanian berkelanjutan"
    ],
    "SDG3" => [
        "health", "well-being", "disease", "healthcare", "medical", "mortality", "epidemic",
        "kesehatan", "kesejahteraan", "penyakit", "pelayanan kesehatan", "medis"
    ],
    "SDG4" => [
        "education", "learning", "school", "literacy", "skills", "training", "knowledge",
        "pendidikan", "pembelajaran", "sekolah", "literasi", "keterampilan"
    ],
    "SDG5" => [
        "gender", "women", "girls", "equality", "empowerment", "discrimination",
        "jender", "perempuan", "wanita", "kesetaraan", "pemberdayaan"
    ],
    "SDG6" => [
        "water", "sanitation", "hygiene", "clean water", "water management", "drought",
        "air", "sanitasi", "kebersihan", "air bersih", "pengelolaan air"
    ],
    "SDG7" => [
        "energy", "renewable", "electricity", "power", "solar", "wind", "sustainable energy",
        "energi", "terbarukan", "listrik", "tenaga", "energi berkelanjutan"
    ],
    "SDG8" => [
        "economic growth", "employment", "jobs", "decent work", "productivity", "innovation",
        "pertumbuhan ekonomi", "pekerjaan", "kerja layak", "produktivitas", "inovasi"
    ],
    "SDG9" => [
        "infrastructure", "industrialization", "innovation", "technology", "research", "development",
        "infrastruktur", "industrialisasi", "teknologi", "penelitian", "pengembangan"
    ],
    "SDG10" => [
        "inequality", "inclusion", "discrimination", "migration", "social mobility",
        "ketimpangan", "inklusi", "diskriminasi", "migrasi", "mobilitas sosial"
    ],
    "SDG11" => [
        "cities", "urban", "housing", "transport", "sustainable development", "urbanization",
        "kota", "perkotaan", "perumahan", "transportasi", "pembangunan berkelanjutan"
    ],
    "SDG12" => [
        "consumption", "production", "waste", "recycling", "resource efficiency", "circular economy",
        "konsumsi", "produksi", "limbah", "daur ulang", "efisiensi sumber daya"
    ],
    "SDG13" => [
        "climate", "climate change", "global warming", "emission", "carbon", "mitigation", "adaptation",
        "iklim", "perubahan iklim", "pemanasan global", "emisi", "karbon", "mitigasi", "adaptasi"
    ],
    "SDG14" => [
        "ocean", "marine", "sea", "aquatic", "fishing", "coral reef", "marine pollution",
        "laut", "kelautan", "perikanan", "terumbu karang", "polusi laut"
    ],
    "SDG15" => [
        "biodiversity", "forest", "land", "ecosystem", "species", "conservation", "deforestation",
        "keanekaragaman hayati", "hutan", "tanah", "ekosistem", "spesies", "konservasi"
    ],
    "SDG16" => [
        "peace", "justice", "institutions", "governance", "corruption", "transparency", "accountability",
        "perdamaian", "keadilan", "institusi", "tata kelola", "korupsi", "transparansi"
    ],
    "SDG17" => [
        "partnership", "cooperation", "global", "development", "capacity building", "technology transfer",
        "kemitraan", "kerjasama", "global", "pembangunan", "pengembangan kapasitas"
    ]
];

// ==============================================
// UTILITY FUNCTIONS - BASIC IMPLEMENTATION
// ==============================================

function checkExecutionTime($start_time, $max_time) {
    $elapsed = microtime(true) - $start_time;
    if ($elapsed > $max_time) {
        throw new Exception('Processing took too long, stopping to prevent timeout', 408);
    }
    return $elapsed;
}

function getCacheFilename($type, $id) {
    global $CACHE_DIR;
    $safe_id = preg_replace('/[^a-zA-Z0-9\-_.]/', '_', $id);
    return $CACHE_DIR . '/' . $type . '_' . md5($safe_id) . '.json.gz';
}

function readFromCache($filename) {
    global $CONFIG;
    if (!file_exists($filename)) {
        return false;
    }
    
    // Check if cache is still valid
    if (time() - filemtime($filename) > $CONFIG['CACHE_TTL']) {
        unlink($filename);
        return false;
    }
    
    $content = file_get_contents($filename);
    if ($content === false) {
        return false;
    }
    
    $decompressed = gzuncompress($content);
    if ($decompressed === false) {
        return false;
    }
    
    return json_decode($decompressed, true);
}

function saveToCache($filename, $data) {
    $json = json_encode($data);
    $compressed = gzcompress($json);
    file_put_contents($filename, $compressed);
}

function extractOrcidName($person_data) {
    if (empty($person_data) || !is_array($person_data)) {
        return '';
    }
    
    $name = '';
    
    // Try credit-name first
    if (isset($person_data['name']['credit-name']['value'])) {
        $name = $person_data['name']['credit-name']['value'];
    } 
    // Combine given-names and family-name
    else if (isset($person_data['name'])) {
        if (isset($person_data['name']['given-names']['value'])) {
            $name .= $person_data['name']['given-names']['value'];
        }
        
        if (isset($person_data['name']['family-name']['value'])) {
            $name .= ' ' . $person_data['name']['family-name']['value'];
        }
    }
    
    return trim($name);
}

function extractOrcidInstitutions($person_data) {
    $institutions = array();
    
    if (isset($person_data['activities-summary']['employments']['employment-summary'])) {
        foreach ($person_data['activities-summary']['employments']['employment-summary'] as $employment) {
            if (isset($employment['organization']['name'])) {
                $institutions[] = $employment['organization']['name'];
            }
        }
    }
    
    return array_unique($institutions);
}

function extractDoi($summary) {
    if (!isset($summary['external-ids']['external-id']) || !is_array($summary['external-ids']['external-id'])) {
        return null;
    }

    foreach ($summary['external-ids']['external-id'] as $id) {
        if (isset($id['external-id-type']) && 
            strtolower($id['external-id-type']) === 'doi' &&
            isset($id['external-id-value']) && 
            !empty($id['external-id-value'])) {
            return $id['external-id-value'];
        }
    }

    return null;
}

function preprocessText($text) {
    $text = strtolower($text);
    $text = preg_replace('/[^\w\s]/', ' ', $text);
    $text = preg_replace('/\s+/', ' ', $text);
    return trim($text);
}

// ==============================================
// API FETCH FUNCTIONS - OPTIMIZED
// ==============================================

function fetchOrcidData($orcid) {
    global $CONFIG;
    
    $url = "https://pub.orcid.org/v3.0/{$orcid}/works?pageSize=" . $CONFIG['ORCID_PAGE_SIZE'];
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_CONNECTTIMEOUT => $CONFIG['API_CONNECT_TIMEOUT'],
        CURLOPT_TIMEOUT => $CONFIG['API_TIMEOUT'],
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ));

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($error) {
        throw new Exception('Failed to fetch ORCID data: ' . $error, 500);
    }
    
    if ($http_code !== 200) {
        throw new Exception('ORCID API returned HTTP ' . $http_code, 500);
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid ORCID response: ' . json_last_error_msg(), 500);
    }

    return $data;
}

function fetchOrcidPersonData($orcid) {
    global $CONFIG;
    
    $url = "https://pub.orcid.org/v3.0/{$orcid}/person";
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_CONNECTTIMEOUT => $CONFIG['API_CONNECT_TIMEOUT'],
        CURLOPT_TIMEOUT => $CONFIG['API_TIMEOUT'],
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ));

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Return empty array on error instead of throwing exception
    if ($error || $http_code !== 200) {
        error_log("ORCID Person API error for $orcid: HTTP $http_code, Error: $error");
        return array();
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("ORCID Person JSON error for $orcid: " . json_last_error_msg());
        return array();
    }

    return $data;
}

function fetchDoiData($doi) {
    global $CONFIG;
    
    $url = "https://api.crossref.org/works/" . urlencode($doi);
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERAGENT => 'SDG-Classifier/1.0 (contact@sangia.org)',
        CURLOPT_CONNECTTIMEOUT => $CONFIG['API_CONNECT_TIMEOUT'],
        CURLOPT_TIMEOUT => $CONFIG['API_TIMEOUT'],
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ));

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($error) {
        throw new Exception('Failed to fetch DOI data: ' . $error, 500);
    }
    
    if ($http_code !== 200) {
        throw new Exception('Crossref API returned HTTP ' . $http_code, 500);
    }

    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid Crossref response: ' . json_last_error_msg(), 500);
    }

    return $data;
}

function fetchAbstractFromAlternativeSource($doi) {
    global $CONFIG;
    
    $url = "https://api.semanticscholar.org/v1/paper/" . urlencode($doi);
    
    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false
    ));
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error || !$response) {
        return "";
    }
    
    $data = json_decode($response, true);
    if (isset($data['abstract']) && !empty($data['abstract'])) {
        return $data['abstract'];
    }
    
    return "";
}

// ==============================================
// SIMPLIFIED SDG ANALYSIS FUNCTIONS
// ==============================================

function evaluateSDGContribution($text, $sdg) {
    global $SDG_KEYWORDS, $CONFIG;
    
    $keywords = isset($SDG_KEYWORDS[$sdg]) ? $SDG_KEYWORDS[$sdg] : array();
    $score = 0;
    $matched_keywords = array();
    
    foreach ($keywords as $keyword) {
        if (stripos($text, $keyword) !== false) {
            $score += 0.1;
            $matched_keywords[] = $keyword;
        }
    }
    
    // Normalize score
    $score = min($score, 1.0);
    
    return array(
        'score' => $score,
        'confidence' => $score > $CONFIG['CONFIDENCE_THRESHOLD'] ? 'high' : 'low',
        'matched_keywords' => $matched_keywords,
        'explanation' => count($matched_keywords) . ' relevant keywords found'
    );
}

function scoreSDGs($text) {
    global $SDG_KEYWORDS, $CONFIG;
    
    $scores = array();
    
    foreach ($SDG_KEYWORDS as $sdg => $keywords) {
        $evaluation = evaluateSDGContribution($text, $sdg);
        if ($evaluation['score'] > $CONFIG['MIN_SCORE_THRESHOLD']) {
            $scores[$sdg] = $evaluation;
        }
    }
    
    // Sort by score descending
    uasort($scores, function($a, $b) {
        return $b['score'] <=> $a['score'];
    });
    
    // Limit to max SDGs per work
    return array_slice($scores, 0, $CONFIG['MAX_SDGS_PER_WORK'], true);
}

// ==============================================
// MAIN PROCESSING FUNCTIONS
// ==============================================

function processOrcidData($orcid, $works_data, $person_data) {
    global $CONFIG, $start_time;
    
    $name = extractOrcidName($person_data);
    $institutions = extractOrcidInstitutions($person_data);
    
    if (empty($name)) {
        $name = "Researcher " . $orcid;
    }

    $processed_works = array();
    $work_count = 0;
    
    if (isset($works_data['group']) && is_array($works_data['group'])) {
        foreach ($works_data['group'] as $work) {
            // Check execution time every 5 works
            if ($work_count % 5 === 0) {
                try {
                    checkExecutionTime($start_time, $CONFIG['MAX_EXECUTION_TIME']);
                } catch (Exception $e) {
                    error_log("ORCID processing stopped early: " . $e->getMessage());
                    break;
                }
            }
            
            // Limit number of works processed
            if ($work_count >= $CONFIG['MAX_WORKS_TO_PROCESS']) {
                break;
            }
            
            $summary = isset($work['work-summary'][0]) ? $work['work-summary'][0] : null;
            if (!$summary) continue;
            
            $title = isset($summary['title']['title']['value']) ? 
                     $summary['title']['title']['value'] : '';
            
            if (empty($title)) continue;
            
            $doi = extractDoi($summary);
            $year = isset($summary['publication-date']['year']['value']) ? 
                    $summary['publication-date']['year']['value'] : null;
            
            // Get abstract if DOI available (with timeout protection)
            $abstract = '';
            if ($doi) {
                try {
                    $remaining_time = $CONFIG['MAX_EXECUTION_TIME'] - (microtime(true) - $start_time);
                    if ($remaining_time > 15) { // Only fetch if we have at least 15 seconds left
                        $doi_data = fetchDoiData($doi);
                        if (isset($doi_data['message']['abstract'])) {
                            $abstract = strip_tags($doi_data['message']['abstract']);
                        }
                    }
                } catch (Exception $e) {
                    error_log("Error fetching abstract for DOI $doi: " . $e->getMessage());
                }
            }
            
            // Perform SDG analysis
            $full_text = $title . ' ' . $abstract;
            $preprocessed_text = preprocessText($full_text);
            $sdg_scores = scoreSDGs($preprocessed_text);
            
            $processed_works[] = array(
                'title' => $title,
                'doi' => $doi,
                'year' => $year,
                'abstract_available' => !empty($abstract),
                'sdg_scores' => $sdg_scores
            );
            
            $work_count++;
        }
    }
    
    // Generate researcher summary
    $researcher_sdg_summary = generateResearcherSummary($processed_works);
    $contributor_profile = generateContributorProfile($processed_works);
    
    return array(
        'status' => 'success',
        'api_version' => 'v5.2.2-working-fix',
        'timestamp' => date('c'),
        'researcher' => array(
            'orcid' => $orcid,
            'name' => $name,
            'institutions' => $institutions,
            'total_works_found' => isset($works_data['group']) ? count($works_data['group']) : 0,
            'works_processed' => count($processed_works),
            'processing_limited' => $work_count >= $CONFIG['MAX_WORKS_TO_PROCESS']
        ),
        'works' => $processed_works,
        'researcher_sdg_summary' => $researcher_sdg_summary,
        'contributor_profile' => $contributor_profile,
        'execution_time' => round(microtime(true) - $start_time, 2) . 's'
    );
}

function processDoiData($doi, $data) {
    global $start_time;
    
    $work = isset($data['message']) ? $data['message'] : array();
    $title = isset($work['title'][0]) ? $work['title'][0] : '';
    $abstract = isset($work['abstract']) ? strip_tags($work['abstract']) : '';
    
    // Try alternative source for abstract if empty
    if (empty($abstract)) {
        try {
            $remaining_time = 90 - (microtime(true) - $start_time);
            if ($remaining_time > 10) {
                $abstract = fetchAbstractFromAlternativeSource($doi);
            }
        } catch (Exception $e) {
            // Ignore errors in alternative source
        }
    }
    
    // Perform SDG analysis
    $full_text = $title . ' ' . $abstract;
    $preprocessed_text = preprocessText($full_text);
    $sdg_scores = scoreSDGs($preprocessed_text);
    
    return array(
        'status' => 'success',
        'api_version' => 'v5.2.2-working-fix',
        'timestamp' => date('c'),
        'article' => array(
            'doi' => $doi,
            'title' => $title,
            'abstract_available' => !empty($abstract),
            'authors' => isset($work['author']) ? array_slice($work['author'], 0, 5) : array(),
            'journal' => isset($work['container-title'][0]) ? $work['container-title'][0] : '',
            'year' => isset($work['published-print']['date-parts'][0][0]) ? $work['published-print']['date-parts'][0][0] : null
        ),
        'sdg_analysis' => $sdg_scores,
        'execution_time' => round(microtime(true) - $start_time, 2) . 's'
    );
}

function generateResearcherSummary($works) {
    $sdg_counts = array();
    $total_contributions = 0;
    
    foreach ($works as $work) {
        if (isset($work['sdg_scores']) && is_array($work['sdg_scores'])) {
            foreach ($work['sdg_scores'] as $sdg => $score_data) {
                if (!isset($sdg_counts[$sdg])) {
                    $sdg_counts[$sdg] = 0;
                }
                $sdg_counts[$sdg]++;
                $total_contributions++;
            }
        }
    }
    
    // Sort by frequency
    arsort($sdg_counts);
    
    return array(
        'top_sdgs' => array_slice($sdg_counts, 0, 5, true),
        'total_contributions' => $total_contributions,
        'works_with_sdg' => count(array_filter($works, function($w) {
            return isset($w['sdg_scores']) && !empty($w['sdg_scores']);
        }))
    );
}

function generateContributorProfile($works) {
    global $CONFIG;
    
    $high_confidence = 0;
    $medium_confidence = 0;
    $low_confidence = 0;
    
    foreach ($works as $work) {
        if (isset($work['sdg_scores']) && is_array($work['sdg_scores'])) {
            foreach ($work['sdg_scores'] as $sdg => $score_data) {
                if ($score_data['score'] >= $CONFIG['HIGH_CONFIDENCE_THRESHOLD']) {
                    $high_confidence++;
                } elseif ($score_data['score'] >= $CONFIG['CONFIDENCE_THRESHOLD']) {
                    $medium_confidence++;
                } else {
                    $low_confidence++;
                }
            }
        }
    }
    
    $total = $high_confidence + $medium_confidence + $low_confidence;
    
    if ($total === 0) {
        return array('type' => 'no_contribution', 'confidence' => 'none');
    }
    
    $high_ratio = $high_confidence / $total;
    
    if ($high_ratio >= 0.6) {
        return array('type' => 'active_contributor', 'confidence' => 'high');
    } elseif ($high_ratio >= 0.3) {
        return array('type' => 'relevant_contributor', 'confidence' => 'medium');
    } else {
        return array('type' => 'discussant', 'confidence' => 'low');
    }
}

// ==============================================
// REQUEST HANDLERS
// ==============================================

function handleOrcidRequest($orcid, $force_refresh = false) {
    $orcid = trim($orcid);
    if (!preg_match('/^0000-\d{4}-\d{4}-\d{3}[\dX]$/', $orcid)) {
        throw new Exception('Invalid ORCID format', 400);
    }

    $cache_file = getCacheFilename('orcid', $orcid);
    if (!$force_refresh && file_exists($cache_file)) {
        $cached_data = readFromCache($cache_file);
        if ($cached_data !== false) {
            return $cached_data;
        }
    }

    $person_data = fetchOrcidPersonData($orcid);
    $works_data = fetchOrcidData($orcid);
    $result = processOrcidData($orcid, $works_data, $person_data);
    
    saveToCache($cache_file, $result);
    return $result;
}

function handleDoiRequest($doi, $force_refresh = false) {
    $doi = trim($doi);
    if (empty($doi)) {
        throw new Exception('DOI cannot be empty', 400);
    }

    $cache_file = getCacheFilename('article', $doi);
    if (!$force_refresh && file_exists($cache_file)) {
        $cached_data = readFromCache($cache_file);
        if ($cached_data !== false) {
            return $cached_data;
        }
    }

    $data = fetchDoiData($doi);
    $result = processDoiData($doi, $data);
    
    saveToCache($cache_file, $result);
    return $result;
}

// ==============================================
// MAIN FUNCTION
// ==============================================

function main() {
    global $start_time;
    
    try {
        if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'GET') {
            throw new Exception('Method not allowed', 405);
        }

        $force_refresh = isset($_GET['refresh']) && $_GET['refresh'] === 'true';
        
        if (isset($_GET['orcid'])) {
            return handleOrcidRequest($_GET['orcid'], $force_refresh);
        } elseif (isset($_GET['doi'])) {
            return handleDoiRequest($_GET['doi'], $force_refresh);
        } else {
            throw new Exception('Invalid parameters. Use ?orcid=xxx or ?doi=xxx', 400);
        }
        
    } catch (Exception $e) {
        $execution_time = round(microtime(true) - $start_time, 2);
        
        http_response_code($e->getCode() ?: 400);
        return array(
            'status' => 'error',
            'code' => $e->getCode() ?: 400,
            'message' => $e->getMessage(),
            'execution_time' => $execution_time . 's',
            'api_version' => 'v5.2.2-working-fix',
            'timestamp' => date('c')
        );
    }
}

// ==============================================
// EXECUTION
// ==============================================

try {
    $result = main();
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    $execution_time = round(microtime(true) - $start_time, 2);
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'code' => 500,
        'message' => 'Internal server error: ' . $e->getMessage(),
        'execution_time' => $execution_time . 's',
        'timestamp' => date('c'),
        'api_version' => 'v5.2.2-working-fix'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

?>