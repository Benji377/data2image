import { deflateSync } from "fflate";
import { encode as encodePng } from "fast-png";
import {
  MAGIC,
  MAGIC_LENGTH,
  PAYLOAD_LENGTH_SIZE,
  CRC_SIZE,
  FILENAME_LENGTH_SIZE,
  crc32,
  calcSideLength,
} from "./format.js";

export interface EncodeOptions {
  /** Original filename (including extension) */
  filename: string;
}

/**
 * Encode file data into a PNG image (returned as Uint8Array of PNG bytes).
 *
 * @param data - Raw file bytes
 * @param filename - Original filename to embed in the image
 * @returns PNG file as Uint8Array
 */
export function encode(data: Uint8Array, filename: string): Uint8Array {
  // Encode filename
  const nameBytes = new TextEncoder().encode(filename);
  if (nameBytes.length > 0xffff) {
    throw new Error(`Filename too long: ${nameBytes.length} bytes (max 65535)`);
  }

  // Compress the file data
  const compressed = deflateSync(data);

  // Calculate CRC-32 of original data
  const checksum = crc32(data);

  // Build payload: CRC(4) + filenameLen(2) + filename(N) + compressed(...)
  const payloadLength = CRC_SIZE + FILENAME_LENGTH_SIZE + nameBytes.length + compressed.length;

  // Build the full data buffer: magic(4) + payloadLen(4) + payload(...)
  const totalDataBytes = MAGIC_LENGTH + PAYLOAD_LENGTH_SIZE + payloadLength;

  // Calculate image dimensions
  const sideLength = calcSideLength(totalDataBytes);
  const totalPixels = sideLength * sideLength;
  const paddedSize = totalPixels * 4;

  // Allocate and fill
  const buffer = new Uint8Array(paddedSize);
  const view = new DataView(buffer.buffer);
  let offset = 0;

  // Magic
  buffer.set(MAGIC, offset);
  offset += MAGIC_LENGTH;

  // Payload length
  view.setUint32(offset, payloadLength, false);
  offset += PAYLOAD_LENGTH_SIZE;

  // CRC-32
  view.setUint32(offset, checksum, false);
  offset += CRC_SIZE;

  // Filename length
  view.setUint16(offset, nameBytes.length, false);
  offset += FILENAME_LENGTH_SIZE;

  // Filename
  buffer.set(nameBytes, offset);
  offset += nameBytes.length;

  // Compressed data
  buffer.set(compressed, offset);
  // Rest is already zero-filled (padding)

  // Create PNG (RGBA)
  const png = encodePng({
    width: sideLength,
    height: sideLength,
    data: buffer,
  });
  return png;
}
