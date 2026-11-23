<?php
declare(strict_types=1);

/**
 * @file api/wrapper/app_settings.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api_wrapper
 * @brief Pengaturan publik dari halaman Admin (mode pemeliharaan, halaman yang ditampilkan, tampilan).
 *
 * GET /api/app_settings.php → { status, settings: { system, content, ui } }
 * Tidak berisi rahasia; kunci API tetap di .env.
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__, 2));
$configFile = ROOT_PATH . '/config/config.php';
if (file_exists($configFile)) require_once $configFile;
require_once ROOT_PATH . '/includes/autoload.php';

echo json_encode([
    'status'   => 'success',
    'settings' => \Sciecola\Support\AppSettings::publicSettings(),
], JSON_UNESCAPED_UNICODE);
