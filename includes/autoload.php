<?php

declare(strict_types=1);

/**
 * PSR-4 autoloader for the Sciecola\ namespace.
 * Maps Sciecola\Foo\Bar → src/Foo/Bar.php
 *
 * No Composer required. If vendor/autoload.php exists (after `composer install`),
 * it takes precedence and this file becomes a no-op.
 */

if (file_exists(dirname(__DIR__) . '/vendor/autoload.php')) {
    require_once dirname(__DIR__) . '/vendor/autoload.php';
    return;
}

spl_autoload_register(static function (string $class): void {
    $prefix  = 'Sciecola\\';
    $baseDir = dirname(__DIR__) . '/src/';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file          = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});
