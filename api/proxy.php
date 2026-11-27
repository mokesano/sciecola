<?php
declare(strict_types=1);
/**
 * @file api/proxy.php
 * Dipindahkan ke api/wrapper/proxy.php (dijangkau lewat router /api/proxy.php).
 * File ini tidak lagi dipakai dan sengaja menolak akses langsung.
 */
http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['status' => 'error', 'message' => 'Endpoint dipindahkan ke /api/proxy.php melalui router.']);
