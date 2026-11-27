<?php
declare(strict_types=1);

/**
 * @file api/cache_to_db.php
 *
 * Copyright (c) 2017-2026 Sangia Publishing House
 * Copyright (c) 2017-2026 Rochmady
 * Distributed under the MIT License.
 *
 * @ingroup api
 * @brief Alias lama untuk tools/cache-migrator.php (CLI).
 *
 *   php api/cache_to_db.php status|migrate|archive
 */

require dirname(__DIR__) . '/tools/cache-migrator.php';
