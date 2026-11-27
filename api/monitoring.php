<?php
declare(strict_types=1);
/**
 * @file api/monitoring.php
 * Dipindahkan ke api/wrapper/monitoring.php (dijangkau lewat router /api/monitoring.php).
 * File ini tidak lagi dipakai dan sengaja menolak akses langsung.
 */
http_response_code(410);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['status' => 'error', 'message' => 'Endpoint dipindahkan ke /api/monitoring.php melalui router.']);
