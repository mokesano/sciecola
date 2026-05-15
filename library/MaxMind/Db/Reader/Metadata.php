<?php

declare(strict_types=1);

namespace MaxMind\Db\Reader;

class Metadata
{
    public readonly int    $binaryFormatMajorVersion;
    public readonly int    $binaryFormatMinorVersion;
    public readonly int    $buildEpoch;
    public readonly string $databaseType;
    public readonly array  $description;
    public readonly int    $ipVersion;
    public readonly array  $languages;
    public readonly int    $nodeByteSize;
    public readonly int    $nodeCount;
    public readonly int    $recordSize;
    public readonly int    $searchTreeSize;

    /** @param array<string, mixed> $metadata */
    public function __construct(array $metadata)
    {
        $this->binaryFormatMajorVersion = (int) ($metadata['binary_format_major_version'] ?? 0);
        $this->binaryFormatMinorVersion = (int) ($metadata['binary_format_minor_version'] ?? 0);
        $this->buildEpoch               = (int) ($metadata['build_epoch'] ?? 0);
        $this->databaseType             = (string) ($metadata['database_type'] ?? '');
        $this->description              = (array)  ($metadata['description'] ?? []);
        $this->ipVersion                = (int) ($metadata['ip_version'] ?? 4);
        $this->languages                = (array)  ($metadata['languages'] ?? []);
        $this->nodeCount                = (int) ($metadata['node_count'] ?? 0);
        $this->recordSize               = (int) ($metadata['record_size'] ?? 24);
        $this->nodeByteSize             = (int) ($this->recordSize / 4);
        $this->searchTreeSize           = $this->nodeCount * $this->nodeByteSize;
    }
}
