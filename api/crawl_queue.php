<?php
declare(strict_types=1);

/**
 * @file api/crawl_queue.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Dipindahkan ke api/wrapper/crawl_queue.php.
 *
 * File ini berada di luar public/ sehingga tidak pernah terjangkau dari browser.
 * Endpoint antrean crawl yang aktif: /api/crawl_queue.php → api/wrapper/crawl_queue.php
 * (lewat front controller, wajib header X-Admin-Token).
 */

http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'status'  => 'error',
    'message' => 'Endpoint dipindahkan ke api/wrapper/crawl_queue.php (akses lewat /api/crawl_queue.php dengan header X-Admin-Token).',
]);
