# data2image

Convert any file to a PNG image and back, from the command line.

## Installation

```bash
npm install -g data2image
```

## Usage

### Encode a file

```bash
data2image encode photo.jpg
# → photo.jpg.d2i.png
```

### Decode it back

```bash
data2image decode photo.jpg.d2i.png
# → photo.jpg
```

### Bulk operations

```bash
# Encode multiple files
data2image encode *.pdf *.docx

# Encode with output directory
data2image encode documents/*.pdf -o output/

# Decode all .d2i.png files
data2image decode *.d2i.png -o restored/
```

### Pipe to stdout

```bash
# Encode to stdout (single file)
data2image encode secret.txt --stdout > secret.d2i.png

# Use in pipelines
data2image encode data.json --stdout | someOtherCommand
```

## Commands

### `encode <files...>`

Encode file(s) into PNG image(s).

**Arguments:**
- `<files...>`: File path(s) or glob pattern(s) to encode

**Options:**
- `-o, --output <dir>`: Output directory (default: same as input file)
- `--stdout`: Write PNG to stdout (single file only)

**Examples:**
```bash
data2image encode report.pdf
data2image encode *.txt -o encoded/
data2image encode archive.zip --stdout > out.png
```

### `decode <files...>`

Decode Data2Image PNG(s) back to original file(s).

**Arguments:**
- `<files...>`: PNG file path(s) or glob pattern(s) to decode

**Options:**
- `-o, --output <dir>`: Output directory (default: same as input file)

**Examples:**
```bash
data2image decode image.d2i.png
data2image decode *.d2i.png -o restored/
```

## Features

- Encode any file type to PNG
- Perfect lossless round-trip
- Glob pattern support for bulk operations
- CRC-32 integrity verification
- Progress indicators
- Stdout support for piping
- Cross-platform (Windows, macOS, Linux)

## How It Works

1. File data is compressed with deflate
2. Wrapped in a binary frame with magic bytes, CRC-32, and filename
3. Laid out as RGBA pixels in a square PNG image
4. Decode reverses the process and verifies integrity

Encoded files use `.d2i.png` extension so they're still viewable as regular PNG images.

## Related Packages

- **[@data2image/core](https://www.npmjs.com/package/@data2image/core)**: Core library (use this for programmatic access)
- **[Website](https://benji377.github.io/data2image/)**: Web app with drag-and-drop

## Use Cases

- Archive files as images for platforms that only accept images
- Embed data in image-sharing sites
- Create visual representations of file data
- Backup files as PNGs
- Data exfiltration research/testing

## License

[GPLv3](https://github.com/Benji377/data2image/blob/main/packages/cli/LICENSE)
