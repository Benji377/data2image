# @data2image/core

Convert any file to a PNG image and back, with perfect lossless round-trip integrity.

This is the core encoder/decoder library for Data2Image. Works in Node.js, Deno, Bun, and browsers.

## Installation

```bash
npm install @data2image/core
```

## Usage

### Encode

```typescript
import { encode } from "@data2image/core";
import { readFileSync, writeFileSync } from "fs";

const fileData = readFileSync("document.pdf");
const pngBytes = encode(fileData, "document.pdf");
writeFileSync("document.pdf.d2i.png", pngBytes);
```

### Decode

```typescript
import { decode } from "@data2image/core";
import { readFileSync, writeFileSync } from "fs";

const pngData = readFileSync("document.pdf.d2i.png");
const { filename, data } = decode(pngData);

console.log(filename); // "document.pdf"
writeFileSync(filename, data);
```

### Browser Usage

```typescript
import { encode, decode } from "@data2image/core";

// Encode
const fileBytes = new Uint8Array(await file.arrayBuffer());
const pngBytes = encode(fileBytes, file.name);

// Create downloadable blob
const blob = new Blob([pngBytes], { type: "image/png" });
const url = URL.createObjectURL(blob);

// Decode
const { filename, data } = decode(pngBytes);
```

## API

### `encode(data, filename)`

Encodes file data into a PNG image.

**Parameters:**
- `data: Uint8Array`: Raw file bytes
- `filename: string`: Original filename (will be embedded in the image)

**Returns:** `Uint8Array`: PNG image bytes

**Throws:** Error if filename exceeds 65535 bytes when UTF-8 encoded

### `decode(png)`

Decodes a Data2Image PNG back to the original file.

**Parameters:**
- `png: Uint8Array`: PNG file bytes (`.d2i.png`)

**Returns:** `{ filename: string, data: Uint8Array }`

**Throws:**
- Error if magic bytes don't match (not a valid Data2Image file)
- Error if CRC-32 checksum fails (corrupted data)
- Error if payload is incomplete

## How It Works

1. **Compress**: file data is deflate-compressed (via fflate)
2. **Frame**: binary format with magic bytes, CRC-32, filename, compressed data
3. **Rasterize**: frame is laid out as RGBA pixels in a square PNG
4. **Decode**: reverse the process, verify integrity with CRC-32

## Binary Format (v1)

```
[4B magic "D2I\x01"]
[4B payload length (uint32 BE)]
[4B CRC-32 checksum]
[2B filename length (uint16 BE)]
[N filename (UTF-8)]
[... deflate-compressed data]
[... zero padding to fill square]
```

## Features

- Lossless round-trip, decode always returns exact original bytes
- CRC-32 integrity verification 
- Filename preservation (including Unicode)
- Compression via deflate
- Isomorphic: works in Node.js, Deno, Bun, browsers
- TypeScript with full type definitions
- ESM + CJS dual build

## Related Packages

- **[data2image](https://www.npmjs.com/package/data2image)** CLI tool
- **[Website](https://benji377.github.io/data2image/)** Web app with drag-and-drop

## License

[MIT](https://github.com/Benji377/data2image/blob/main/packages/core/LICENSE)
