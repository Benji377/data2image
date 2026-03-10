/**
 * Data2Image binary format (v1) specification and utilities.
 *
 * Header layout:
 *   [4 bytes] Magic: "D2I\x01"
 *   [4 bytes] Payload length (uint32 BE) - bytes of meaningful data after magic+payloadLen
 *   [4 bytes] CRC-32 of original uncompressed file
 *   [2 bytes] Filename length (uint16 BE)
 *   [N bytes] Filename (UTF-8)
 *   [...rest] Compressed data (deflate)
 *   [padding] Zero-fill to complete the square RGBA image
 */

export const MAGIC = new Uint8Array([0x44, 0x32, 0x49, 0x01]); // "D2I\x01"
export const MAGIC_LENGTH = 4;
export const PAYLOAD_LENGTH_SIZE = 4;
export const CRC_SIZE = 4;
export const FILENAME_LENGTH_SIZE = 2;
export const HEADER_FIXED_SIZE = MAGIC_LENGTH + PAYLOAD_LENGTH_SIZE;

// CRC-32 lookup table (IEEE polynomial)
const crcTable: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function matchesMagic(data: Uint8Array): boolean {
  if (data.length < MAGIC_LENGTH) return false;
  for (let i = 0; i < MAGIC_LENGTH; i++) {
    if (data[i] !== MAGIC[i]) return false;
  }
  return true;
}

/**
 * Calculate the side length of the square RGBA image needed to hold `totalBytes`.
 */
export function calcSideLength(totalBytes: number): number {
  return Math.ceil(Math.sqrt(totalBytes / 4));
}
