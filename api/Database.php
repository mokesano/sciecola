<?php
/**
 * Database.php — PDO wrapper supporting MariaDB and PostgreSQL.
 * Replaces the old gzip file-based cache with persistent DB storage.
 *
 * Usage:
 *   $db = Database::getInstance();
 *   $db->query('SELECT * FROM sdg_cache WHERE cache_key = ?', [$key]);
 */

class Database {
    private static ?self $instance = null;
    private PDO $pdo;

    private function __construct() {
        $driver  = defined('DB_DRIVER')  ? DB_DRIVER  : 'mysql';
        $host    = defined('DB_HOST')    ? DB_HOST    : 'localhost';
        $port    = defined('DB_PORT')    ? DB_PORT    : '3306';
        $dbName  = defined('DB_NAME')    ? DB_NAME    : 'sicola_db';
        $charset = defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4';
        $user    = defined('DB_USER')    ? DB_USER    : '';
        $pass    = defined('DB_PASS')    ? DB_PASS    : '';

        if ($driver === 'pgsql') {
            $dsn = "pgsql:host={$host};port={$port};dbname={$dbName}";
            $options = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION];
        } else {
            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset}",
            ];
        }

        $this->pdo = new PDO($dsn, $user, $pass, $options);
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchOne(string $sql, array $params = []): ?array {
        $row = $this->query($sql, $params)->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function fetchAll(string $sql, array $params = []): array {
        return $this->query($sql, $params)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function insert(string $table, array $data): int {
        $cols   = implode(', ', array_keys($data));
        $places = implode(', ', array_fill(0, count($data), '?'));
        $this->query("INSERT INTO {$table} ({$cols}) VALUES ({$places})", array_values($data));
        return (int) $this->pdo->lastInsertId();
    }

    public function upsert(string $table, array $data, array $conflictCols): void {
        $driver = defined('DB_DRIVER') ? DB_DRIVER : 'mysql';
        $cols   = array_keys($data);
        $places = array_fill(0, count($data), '?');

        if ($driver === 'pgsql') {
            $conflict = implode(', ', $conflictCols);
            $updates  = implode(', ', array_map(fn($c) => "{$c} = EXCLUDED.{$c}", array_diff($cols, $conflictCols)));
            $sql = sprintf(
                'INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO UPDATE SET %s',
                $table, implode(', ', $cols), implode(', ', $places), $conflict, $updates
            );
        } else {
            $updates = implode(', ', array_map(fn($c) => "{$c} = VALUES({$c})", array_diff($cols, $conflictCols)));
            $sql = sprintf(
                'INSERT INTO %s (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s',
                $table, implode(', ', $cols), implode(', ', $places), $updates
            );
        }
        $this->query($sql, array_values($data));
    }

    public function getPdo(): PDO { return $this->pdo; }
}
