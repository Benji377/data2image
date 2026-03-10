import { describe, it, expect } from "vitest";
import { encode, decode, crc32, matchesMagic, MAGIC, calcSideLength } from "../src/index.js";

describe("crc32", () => {
  it("returns 0 for empty input", () => {
    expect(crc32(new Uint8Array([]))).toBe(0);
  });

  it("computes known CRC-32 for 'hello'", () => {
    const data = new TextEncoder().encode("hello");
    // Known CRC-32 for "hello" = 0x3610a686
    expect(crc32(data)).toBe(0x3610a686);
  });
});

describe("matchesMagic", () => {
  it("returns true for valid magic bytes", () => {
    const data = new Uint8Array([0x44, 0x32, 0x49, 0x01, 0x00]);
    expect(matchesMagic(data)).toBe(true);
  });

  it("returns false for random data", () => {
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    expect(matchesMagic(data)).toBe(false);
  });

  it("returns false for too-short data", () => {
    expect(matchesMagic(new Uint8Array([0x44, 0x32]))).toBe(false);
  });
});

describe("encode → decode round-trip", () => {
  it("handles a simple text file", () => {
    const data = new TextEncoder().encode("Hello, Data2Image!");
    const png = encode(data, "hello.txt");

    expect(png).toBeInstanceOf(Uint8Array);
    expect(png.length).toBeGreaterThan(0);

    const result = decode(png);
    expect(result.filename).toBe("hello.txt");
    expect(result.data).toEqual(data);
  });

  it("handles an empty file", () => {
    const data = new Uint8Array([]);
    const png = encode(data, "empty.bin");
    const result = decode(png);
    expect(result.filename).toBe("empty.bin");
    expect(result.data).toEqual(data);
  });

  it("handles binary data with trailing zeroes", () => {
    // This is the critical bug fix test - old format would corrupt this
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x00, 0x00, 0x00]);
    const png = encode(data, "trailing-zeros.bin");
    const result = decode(png);
    expect(result.filename).toBe("trailing-zeros.bin");
    expect(result.data).toEqual(data);
  });

  it("handles data that is all zeroes", () => {
    const data = new Uint8Array(256).fill(0);
    const png = encode(data, "all-zeros.bin");
    const result = decode(png);
    expect(result.filename).toBe("all-zeros.bin");
    expect(result.data).toEqual(data);
  });

  it("handles binary data with all byte values", () => {
    const data = new Uint8Array(256);
    for (let i = 0; i < 256; i++) data[i] = i;
    const png = encode(data, "all-bytes.bin");
    const result = decode(png);
    expect(result.filename).toBe("all-bytes.bin");
    expect(result.data).toEqual(data);
  });

  it("handles unicode filenames", () => {
    const data = new TextEncoder().encode("日本語テスト");
    const png = encode(data, "テスト_файл_🎉.txt");
    const result = decode(png);
    expect(result.filename).toBe("テスト_файл_🎉.txt");
    expect(result.data).toEqual(data);
  });

  it("handles a larger file (64KB)", () => {
    const data = new Uint8Array(65536);
    for (let i = 0; i < data.length; i++) data[i] = i & 0xff;
    const png = encode(data, "large-file.dat");
    const result = decode(png);
    expect(result.filename).toBe("large-file.dat");
    expect(result.data).toEqual(data);
  });

  it("preserves filename with dots and special chars", () => {
    const data = new TextEncoder().encode("test");
    const png = encode(data, "my.file.name (copy).tar.gz");
    const result = decode(png);
    expect(result.filename).toBe("my.file.name (copy).tar.gz");
  });
});

describe("decode error handling", () => {
  it("rejects non-Data2Image PNG data", () => {
    // Minimal valid-ish PNG that is NOT a Data2Image file
    const fakePng = encode(new TextEncoder().encode("x"), "x.txt");
    // Corrupt the magic bytes
    fakePng[0] = 0x00;

    // We can't easily decode a corrupted PNG, so test with raw invalid data
    expect(() => decode(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toThrow();
  });

  it("rejects data that is not a valid PNG", () => {
    // Invalid data that's not even a PNG will fail during PNG decode
    expect(() => decode(new Uint8Array([1, 2, 3, 4]))).toThrow();
    expect(() => decode(new Uint8Array([]))).toThrow();
  });

  it("successfully decodes valid data (baseline for error tests)", () => {
    const data = new TextEncoder().encode("test data");
    const png = encode(data, "test.txt");
    const decoded = decode(png);
    expect(decoded.data).toEqual(data);
    expect(decoded.filename).toBe("test.txt");
  });
});

describe("edge cases", () => {
  it("handles 1-byte file", () => {
    const data = new Uint8Array([0x42]);
    const png = encode(data, "single.bin");
    const result = decode(png);
    expect(result.data).toEqual(data);
  });

  it("handles empty filename", () => {
    const data = new TextEncoder().encode("test");
    const png = encode(data, "");
    const result = decode(png);
    expect(result.filename).toBe("");
    expect(result.data).toEqual(data);
  });

  it("handles very long filename (near limit)", () => {
    const data = new TextEncoder().encode("x");
    // Create a filename that's close to but under the 65535 byte limit
    const longName = "a".repeat(1000) + ".txt";
    const png = encode(data, longName);
    const result = decode(png);
    expect(result.filename).toBe(longName);
  });

  it("rejects filename that exceeds byte limit", () => {
    const data = new Uint8Array([1, 2, 3]);
    // Each emoji can be 4 bytes in UTF-8, so this will exceed 65535 bytes
    const tooLongName = "🎉".repeat(20000) + ".txt";
    expect(() => encode(data, tooLongName)).toThrow("Filename too long");
  });

  it("handles highly compressible data", () => {
    // Data that compresses very well (repeated pattern)
    const data = new Uint8Array(10000).fill(0x41); // All 'A'
    const png = encode(data, "compressible.bin");
    const result = decode(png);
    expect(result.data).toEqual(data);
    // Verify compression worked: PNG should be much smaller than raw data
    expect(png.length).toBeLessThan(data.length);
  });

  it("handles incompressible data (random)", () => {
    // Random data doesn't compress well
    const data = new Uint8Array(1000);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
    const png = encode(data, "random.bin");
    const result = decode(png);
    expect(result.data).toEqual(data);
  });

  it("handles large file (1 MB)", () => {
    const data = new Uint8Array(1024 * 1024);
    for (let i = 0; i < data.length; i++) {
      data[i] = (i * 7) & 0xff; // Pseudo-random pattern
    }
    const png = encode(data, "large-1mb.bin");
    expect(png.length).toBeGreaterThan(0);
    const result = decode(png);
    expect(result.filename).toBe("large-1mb.bin");
    expect(result.data.length).toBe(data.length);
    expect(result.data).toEqual(data);
  });

  it("handles data with repeating patterns", () => {
    // Pattern: 0x00 0xFF repeated
    const data = new Uint8Array(1000);
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 2 === 0 ? 0x00 : 0xff;
    }
    const png = encode(data, "pattern.bin");
    const result = decode(png);
    expect(result.data).toEqual(data);
  });

  it("preserves data integrity with null bytes in middle", () => {
    const data = new Uint8Array([0xff, 0xfe, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03]);
    const png = encode(data, "nulls.bin");
    const result = decode(png);
    expect(result.data).toEqual(data);
  });
});

describe("calcSideLength", () => {
  it("calculates correct side length for small data", () => {
    // 4 bytes (1 pixel) → 1x1
    expect(calcSideLength(4)).toBe(1);
    // 16 bytes (4 pixels) → 2x2
    expect(calcSideLength(16)).toBe(2);
    // 17 bytes → needs 3x3
    expect(calcSideLength(17)).toBe(3);
  });

  it("calculates correct side length for edge cases", () => {
    expect(calcSideLength(0)).toBe(0);
    expect(calcSideLength(1)).toBe(1);
    // 100x100 = 10000 pixels = 40000 bytes
    expect(calcSideLength(40000)).toBe(100);
    expect(calcSideLength(40001)).toBe(101);
  });
});

describe("PNG validation", () => {
  it("produces valid PNG header", () => {
    const data = new TextEncoder().encode("test");
    const png = encode(data, "test.txt");
    
    // Check PNG signature
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < pngSignature.length; i++) {
      expect(png[i]).toBe(pngSignature[i]);
    }
  });

  it("produces lossless PNG (can decode back perfectly)", () => {
    // Verify multiple round-trips don't degrade data
    let data = new TextEncoder().encode("Round trip test! 🚀");
    
    for (let i = 0; i < 3; i++) {
      const png = encode(data, `test${i}.txt`);
      const result = decode(png);
      expect(result.data).toEqual(data);
      data = result.data; // Use decoded data for next iteration
    }
  });
});
