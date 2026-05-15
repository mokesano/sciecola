<?php

declare(strict_types=1);

namespace MaxMind\Db\Reader;

class Decoder
{
    /** @var resource */
    private $fileHandle;
    private int $pointerBase;
    private int $pointerValueOffset;

    private const POINTER_VALUE_OFFSETS = [0, 0, 2048, 526336, 0];

    /** @param resource $fileHandle */
    public function __construct($fileHandle, int $pointerBase)
    {
        $this->fileHandle         = $fileHandle;
        $this->pointerBase        = $pointerBase;
        $this->pointerValueOffset = 0;
    }

    /** @return array{mixed, int} [value, newOffset] */
    public function decode(int $offset): array
    {
        $ctrlByte = ord($this->read($offset, 1));
        $offset++;

        $type = $ctrlByte >> 5;

        // Extended type
        if ($type === 0) {
            $type = ord($this->read($offset, 1)) + 7;
            $offset++;
        }

        [$size, $offset] = $this->sizeFromCtrlByte($ctrlByte, $offset, $type);

        return $this->decodeByType($type, $offset, $size);
    }

    /** @return array{mixed, int} */
    private function decodeByType(int $type, int $offset, int $size): array
    {
        switch ($type) {
            case 1: // pointer
                [$pointer, $offset] = $this->decodePointer($size, $offset);
                [$value]            = $this->decode($pointer);
                return [$value, $offset];

            case 2: // utf8 string
                $value = $this->read($offset, $size);
                return [$value, $offset + $size];

            case 3: // double
                $value = unpack('E', $this->read($offset, 8))[1];
                return [$value, $offset + 8];

            case 4: // bytes (raw)
                $value = $this->read($offset, $size);
                return [$value, $offset + $size];

            case 5: // uint16
                return [$this->decodeUint($offset, $size), $offset + $size];

            case 6: // uint32
                return [$this->decodeUint($offset, $size), $offset + $size];

            case 7: // map
                return $this->decodeMap($size, $offset);

            case 8: // int32
                $val = $this->decodeUint($offset, $size);
                if ($size === 4 && $val >= 0x80000000) {
                    $val -= 0x100000000;
                }
                return [$val, $offset + $size];

            case 9:  // uint64
            case 10: // uint128
                return [$this->decodeUint($offset, $size), $offset + $size];

            case 11: // array
                return $this->decodeArray($size, $offset);

            case 14: // boolean
                return [(bool) $size, $offset];

            case 15: // float
                $value = unpack('G', $this->read($offset, 4))[1];
                return [$value, $offset + 4];

            default:
                throw new InvalidDatabaseException("Unknown type number: {$type}");
        }
    }

    /** @return array{int, int} */
    private function decodePointer(int $ctrlByte, int $offset): array
    {
        $pointerSize = (($ctrlByte >> 3) & 0x3) + 1;
        $base        = $pointerSize === 4 ? 0 : ($ctrlByte & 0x7);

        $packed = $this->read($offset, $pointerSize);
        $offset += $pointerSize;

        $unpacked = $this->decodeUintFromBytes($packed);

        // Pointer is a raw offset into the data section.
        // Do NOT add pointerBase here — read() handles the absolute seek.
        $pointer = ($base << ($pointerSize * 8)) + $unpacked
            + self::POINTER_VALUE_OFFSETS[$pointerSize];

        return [$pointer, $offset];
    }

    /** @return array{array<string, mixed>, int} */
    private function decodeMap(int $size, int $offset): array
    {
        $map = [];
        for ($i = 0; $i < $size; $i++) {
            [$key, $offset]   = $this->decode($offset);
            [$value, $offset] = $this->decode($offset);
            $map[(string) $key] = $value;
        }
        return [$map, $offset];
    }

    /** @return array{array<mixed>, int} */
    private function decodeArray(int $size, int $offset): array
    {
        $array = [];
        for ($i = 0; $i < $size; $i++) {
            [$value, $offset] = $this->decode($offset);
            $array[]          = $value;
        }
        return [$array, $offset];
    }

    /** @return array{int, int} [size, newOffset] */
    private function sizeFromCtrlByte(int $ctrlByte, int $offset, int $type): array
    {
        $size = $ctrlByte & 0x1f;

        if ($type === 1) {
            return [$size, $offset];
        }

        if ($size >= 29) {
            $bytesToRead = $size - 28;
            $bytes       = $this->read($offset, $bytesToRead);
            $offset     += $bytesToRead;

            if ($size === 29) {
                $size = 29 + ord($bytes);
            } elseif ($size === 30) {
                $size = 285 + (ord($bytes[0]) << 8) + ord($bytes[1]);
            } else {
                $size = 65821
                    + (ord($bytes[0]) << 16)
                    + (ord($bytes[1]) << 8)
                    + ord($bytes[2]);
            }
        }

        return [$size, $offset];
    }

    private function decodeUint(int $offset, int $size): int
    {
        if ($size === 0) {
            return 0;
        }
        return $this->decodeUintFromBytes($this->read($offset, $size));
    }

    private function decodeUintFromBytes(string $bytes): int
    {
        $val = 0;
        for ($i = 0, $len = strlen($bytes); $i < $len; $i++) {
            $val = ($val << 8) | ord($bytes[$i]);
        }
        return $val;
    }

    private function read(int $offset, int $length): string
    {
        if ($length === 0) {
            return '';
        }
        if (fseek($this->fileHandle, $this->pointerBase + $offset) !== 0) {
            throw new InvalidDatabaseException("Seek error in MaxMind DB file.");
        }
        $data = fread($this->fileHandle, $length);
        if ($data === false || strlen($data) !== $length) {
            throw new InvalidDatabaseException("Read error in MaxMind DB file.");
        }
        return $data;
    }
}
