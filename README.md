# Data2Image

**Convert any file into a PNG image and back.**

Data2Image encodes arbitrary files into lossless PNG images where every pixel stores your data. The original file can be perfectly restored from the image at any time.

**[Try the web app →](https://benji377.github.io/data2image/)**

## Features

- **Lossless round-trip**: encode any file to PNG then decode back to the exact original bytes
- **CRC-32 integrity**: every encoded image embeds a checksum; decoding verifies data hasn't been corrupted
- **Compression**: files are deflate-compressed before encoding to minimize image size
- **Filename preservation**: the original filename (including extension) is stored inside the image
- **Bulk processing**: encode or decode many files at once via CLI glob patterns or the web UI
- **Cross-runtime**: works in Node.js, Deno, Bun, and the browser
- **Dual-format package**: ESM and CJS builds included

## Packages

| Package | Description |
|---------|-------------|
| [`@data2image/core`](packages/core) | Core encoder/decoder library |
| [`data2image`](packages/cli) | CLI tool |
| [`@data2image/web`](packages/web) | Website (GitHub Pages) |

## Quick Start

### CLI

```bash
npm install -g data2image

# Encode a file
data2image encode photo.jpg
# → photo.jpg.d2i.png

# Decode it back
data2image decode photo.jpg.d2i.png
# → photo.jpg

# Bulk encode
data2image encode *.pdf -o output/

# Pipe to stdout
data2image encode secret.txt --stdout > out.png
```

### Library

```bash
npm install @data2image/core
```

```typescript
import { encode, decode } from "@data2image/core";

// Encode
const fileBytes = new Uint8Array(/* your file data */);
const pngBytes = encode(fileBytes, "document.pdf");

// Decode
const { filename, data } = decode(pngBytes);
console.log(filename); // "document.pdf"
// data === fileBytes ✓
```

### Web

Visit **[benji377.github.io/data2image](https://benji377.github.io/data2image/)**, drop files, click "Process All", download results. No uploads, everything runs locally in your browser.

## How It Works

1. **Compress**: the input file is compressed with deflate (pako)
2. **Frame**: a binary frame is built:

   ```
   [magic "D2I\x01" 4B] [payload length 4B] [CRC-32 4B] [filename length 2B] [filename] [compressed data] [zero padding]
   ```

3. **Rasterize**: the frame is laid out as RGBA pixels in a square PNG image
4. **Decode**: the process reverses: read PNG pixels → parse frame → decompress → verify CRC-32

Encoded images use the `.d2i.png` extension so they can still be viewed as normal PNGs.

## Binary Format (v1)

| Offset | Size | Field |
|--------|------|-------|
| 0 | 4 | Magic bytes `D2I\x01` |
| 4 | 4 | Payload length (uint32 big-endian) |
| 8 | 4 | CRC-32 of original uncompressed data |
| 12 | 2 | Filename length in bytes (uint16 big-endian) |
| 14 | N | Filename (UTF-8) |
| 14+N | ... | Deflate-compressed file data |
| ... | ... | Zero-padding to fill square RGBA image |

## Development

```bash
# Clone and install
git clone https://github.com/Benji377/data2image.git
cd data2image
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start web dev server
npm run dev:web
```

This is an npm workspaces monorepo. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[GPLv3](LICENSE)