import { inflateSync } from "fflate";
import { decode as decodePng } from "fast-png";
import {
  MAGIC_LENGTH,
  PAYLOAD_LENGTH_SIZE,
  CRC_SIZE,
  FILENAME_LENGTH_SIZE,
  crc32,
  matchesMagic,
} from "./format.js";

export interface DecodeResult {
  /** Original filename that was embedded */
  filename: string;
  /** Restored file data */
  data: Uint8Array;
}

/**
 * Decode a Data2Image PNG back into the original file.
 *
 * @param png - PNG file bytes
 * @returns Object with filename and restored file data
 */
export function decode(png: Uint8Array): DecodeResult {
  // Decode PNG to RGBA pixels
  const img = decodePng(png);
  const pixelData = img.data as Uint8Array;

  // Verify magic bytes
  if (!matchesMagic(pixelData)) {
    throw new Error("Not a valid Data2Image file: magic bytes not found");
  }

  const view = new DataView(pixelData.buffer, pixelData.byteOffset, pixelData.byteLength);
  let offset = MAGIC_LENGTH;

  // Read payload length
  const payloadLength = view.getUint32(offset, false);
  offset += PAYLOAD_LENGTH_SIZE;

  // Ensure we have enough data
  const totalDataBytes = MAGIC_LENGTH + PAYLOAD_LENGTH_SIZE + payloadLength;
  if (pixelData.length < totalDataBytes) {
    throw new Error("Corrupted Data2Image file: not enough data for declared payload length");
  }

  // Read CRC-32
  const storedChecksum = view.getUint32(offset, false);
  offset += CRC_SIZE;

  // Read filename length
  const filenameLength = view.getUint16(offset, false);
  offset += FILENAME_LENGTH_SIZE;

  // Read filename
  const filenameBytes = pixelData.slice(offset, offset + filenameLength);
  const filename = new TextDecoder().decode(filenameBytes);
  offset += filenameLength;

  // Extract compressed data (exact length: payloadLength - CRC - filenameLen - filename)
  const compressedLength = payloadLength - CRC_SIZE - FILENAME_LENGTH_SIZE - filenameLength;
  const compressed = pixelData.slice(offset, offset + compressedLength);

  // Decompress
  const data = inflateSync(compressed);

  // Verify CRC-32
  const computedChecksum = crc32(data);
  if (computedChecksum !== storedChecksum) {
    throw new Error(
      `CRC-32 mismatch: file may be corrupted (expected ${storedChecksum.toString(16)}, got ${computedChecksum.toString(16)})`
    );
  }

  return { filename, data };
}
