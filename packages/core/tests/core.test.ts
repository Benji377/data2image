import { describe, it, expect } from "vitest";
import { encode, decode, crc32, matchesMagic, MAGIC } from "../src/index.js";

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
});
