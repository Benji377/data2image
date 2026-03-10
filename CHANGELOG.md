# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-03-10

### Changed

- Fixed typo in README

## [1.0.1] - 2026-03-10

### Changed

- **Licensing**: Switched to hybrid license model
  - `@data2image/core` (library) now uses **MIT** for maximum adoption
  - `data2image` (CLI) and website remain **GPLv3** (copyleft)
- Updated package READMEs with prominent license notices
- Added `LICENSE` and `README.md` to published package files
- Fixed TypeScript type errors in web package Blob constructors

## [1.0.0] - 2026-03-10

### Added

- **Core library** (`@data2image/core`): encode any file to PNG, decode back to original
  - Binary format v1 with magic bytes, CRC-32 integrity checks, deflate compression
  - Filename preservation (including Unicode)
  - Dual ESM + CJS builds
  - Works in Node.js, Deno, Bun, and browsers
- **CLI tool** (`data2image`): command-line encode/decode with glob support
  - `data2image encode <files...>` with `--output` and `--stdout` options
  - `data2image decode <files...>` with `--output` option
  - Progress indicators for bulk operations
- **Website**: Web app at [benji377.github.io/data2image](https://benji377.github.io/data2image/)
  - Drag-and-drop file upload
  - Auto-detect encode vs decode based on `.d2i.png` extension
  - Bulk processing with progress bar
  - Image preview for encoded results
  - Download individual files or all as ZIP
  - Dark mode with system preference detection
  - Fully client-side - no server, no uploads

### Changed

- Complete rewrite from Python + vanilla JS to TypeScript monorepo
- New binary format (not backward-compatible with the old Python implementation)
