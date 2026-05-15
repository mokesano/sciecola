<?php

declare(strict_types=1);

namespace MaxMind\Db;

use MaxMind\Db\Reader\Decoder;
use MaxMind\Db\Reader\InvalidDatabaseException;
use MaxMind\Db\Reader\Metadata;

/**
 * Reads MaxMind DB files (.mmdb) — bundled from MaxMind's MIT-licensed PHP reader.
 * Source: https://github.com/maxmind/MaxMind-DB-Reader-php (MIT License)
 */
class Reader
{
    private const DATA_SECTION_SEPARATOR_SIZE = 16;
    private const METADATA_START_MARKER       = "\xab\xcd\xefMaxMind.com";
    private const METADATA_START_MARKER_LEN   = 14;

    private int    $ipV4Start = 0;
    private Decoder  $decoder;
    /** @var resource */
    private $fileHandle;
    private int    $fileSize;
    private Metadata $metadata;

    public function __construct(string $database)
    {
        if (!is_readable($database)) {
            throw new \InvalidArgumentException(
                "The file \"{$database}\" does not exist or is not readable."
            );
        }

        $fh = fopen($database, 'rb');
        if ($fh === false) {
            throw new \InvalidArgumentException(
                "Unexpected error when opening \"{$database}\"."
            );
        }
        $this->fileHandle = $fh;

        $fileSize = filesize($database);
        if ($fileSize === false) {
            throw new \UnexpectedValueException(
                "Unexpected error when getting the size of \"{$database}\"."
            );
        }
        $this->fileSize = $fileSize;

        $metaStart      = $this->findMetadataStart($database);
        $metaDecoder    = new Decoder($this->fileHandle, 0);
        [$rawMeta]      = $metaDecoder->decode($metaStart);
        $this->metadata = new Metadata($rawMeta);

        $this->decoder = new Decoder(
            $this->fileHandle,
            $this->metadata->nodeCount * (int) ($this->metadata->recordSize / 4)
                + self::DATA_SECTION_SEPARATOR_SIZE
        );

        $this->ipV4Start = $this->findIpV4StartNode();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $ipAddress): ?array
    {
        [$pointer] = $this->findAddressInTree($ipAddress);

        if ($pointer === $this->metadata->nodeCount) {
            return null;
        }

        return $this->resolveDataPointer($pointer);
    }

    // ─── private ────────────────────────────────────────────────────────────

    /** @return array{int, int} [pointer, prefixLength] */
    private function findAddressInTree(string $ipAddress): array
    {
        $rawAddress = inet_pton($ipAddress);
        if ($rawAddress === false) {
            throw new \InvalidArgumentException("The value \"{$ipAddress}\" is not a valid IP address.");
        }

        $isIpV4  = strlen($rawAddress) === 4;
        $bitCount = $isIpV4 ? 32 : 128;

        // For IPv4 in an IPv6 database, start at the IPv4 subtree node
        $node = ($isIpV4 && $this->metadata->ipVersion === 6)
            ? $this->ipV4Start
            : 0;

        $nodeCount = $this->metadata->nodeCount;

        for ($i = 0; $i < $bitCount; $i++) {
            if ($node >= $nodeCount) {
                return [$node, $i];
            }
            $tempBit = 0xFF & ord($rawAddress[(int)($i / 8)]);
            $bit     = 1 & ($tempBit >> (7 - ($i % 8)));
            $node    = $this->readNode($node, $bit);
        }

        if ($node === $nodeCount) {
            return [$node, $bitCount];
        }

        throw new InvalidDatabaseException("Something went wrong reading the MaxMind database.");
    }

    private function findIpV4StartNode(): int
    {
        if ($this->metadata->ipVersion !== 6) {
            return 0;
        }
        $node = 0;
        for ($i = 0; $i < 96 && $node < $this->metadata->nodeCount; $i++) {
            $node = $this->readNode($node, 0);
        }
        return $node;
    }

    private function readNode(int $nodeNumber, int $index): int
    {
        $baseOffset = $nodeNumber * (int) ($this->metadata->recordSize / 4);

        switch ($this->metadata->recordSize) {
            case 24:
                $bytes  = $this->read($baseOffset + $index * 3, 3);
                $offset = unpack('N', "\x00" . $bytes)[1];
                break;
            case 28:
                $middle = ord($this->read($baseOffset + 3, 1));
                if ($index === 0) {
                    $middle = (0xF0 & $middle) >> 4;
                } else {
                    $middle = 0x0F & $middle;
                }
                $bytes  = $this->read($baseOffset + $index * 4, 3);
                $offset = unpack('N', chr($middle) . $bytes)[1];
                break;
            case 32:
                $bytes  = $this->read($baseOffset + $index * 4, 4);
                $offset = unpack('N', $bytes)[1];
                break;
            default:
                throw new InvalidDatabaseException(
                    "Unknown record size: {$this->metadata->recordSize}"
                );
        }

        return $offset;
    }

    /** @return array<string, mixed> */
    private function resolveDataPointer(int $pointer): array
    {
        $nodeCount    = $this->metadata->nodeCount;
        $searchOffset = $pointer - $nodeCount - self::DATA_SECTION_SEPARATOR_SIZE;

        if ($searchOffset < 0) {
            throw new InvalidDatabaseException(
                "The MaxMind DB file's data section contains bad data for the IP address."
            );
        }

        [$data] = $this->decoder->decode($searchOffset);

        return $data;
    }

    private function read(int $offset, int $length): string
    {
        if ($length === 0) {
            return '';
        }
        if (fseek($this->fileHandle, $offset) !== 0) {
            throw new InvalidDatabaseException(
                "The MaxMind DB file contains bad data."
            );
        }
        $value = fread($this->fileHandle, $length);
        if ($value === false || strlen($value) !== $length) {
            throw new InvalidDatabaseException(
                "The MaxMind DB file contains bad data."
            );
        }
        return $value;
    }

    private function findMetadataStart(string $filename): int
    {
        $handle   = $this->fileHandle;
        $fsize    = $this->fileSize;
        $marker   = self::METADATA_START_MARKER;
        $markerLen = self::METADATA_START_MARKER_LEN;

        // Search from the end of the file, up to 128 KB
        $searchLen = min($fsize, 131072);
        fseek($handle, -$searchLen, SEEK_END);
        $buf = fread($handle, $searchLen);
        if ($buf === false) {
            throw new InvalidDatabaseException("Could not read metadata from \"{$filename}\".");
        }

        $found = strrpos($buf, $marker);
        if ($found === false) {
            throw new InvalidDatabaseException(
                "Error opening database file \"{$filename}\". Is this a valid MaxMind DB file?"
            );
        }

        return $fsize - $searchLen + $found + $markerLen;
    }

    public function __destruct()
    {
        if (isset($this->fileHandle) && is_resource($this->fileHandle)) {
            fclose($this->fileHandle);
        }
    }
}
