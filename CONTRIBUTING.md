# Contributing to Data2Image

Thanks for your interest in contributing! This guide will help you get set up.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)

## Setup

```bash
git clone https://github.com/Benji377/data2image.git
cd data2image
npm install
npm run build
npm test
```

## Project Structure

This is an npm workspaces monorepo with three packages:

```
packages/
  core/     @data2image/core   - encoder/decoder library (ESM + CJS)
  cli/      data2image         - CLI tool
  web/      @data2image/web    - website (Vite, deployed to GitHub Pages)
```

## Development Workflow

### Building

```bash
# Build everything
npm run build

# Build a single package
npm run build --workspace=packages/core
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch --workspace=packages/core
```

### Website Development

```bash
npm run dev:web
```

Opens a local Vite dev server at `http://localhost:5173/data2image/`.

## Making Changes

1. **Create a branch** from `main`
2. **Make your changes** - keep commits focused and descriptive
3. **Add tests** for new functionality in `packages/core/tests/`
4. **Run tests** - `npm test` must pass
5. **Build** - `npm run build` must succeed
6. **Open a PR** against `main`

## Package Dependencies

```
@data2image/web  →  @data2image/core
data2image (CLI) →  @data2image/core
```

When modifying `@data2image/core`, rebuild it before testing dependent packages.

## Code Style

- TypeScript with strict mode
- ESM-first (`"type": "module"`)
- No default exports - use named exports
- Target ES2022

## Binary Format

The core library uses a custom binary format (documented in the [README](README.md#binary-format-v1)). Changes to the format must:

1. Maintain backward compatibility with existing `.d2i.png` files, or
2. Bump the magic version byte and handle both versions in the decoder

## Releases

Releases are handled via GitHub Actions with `workflow_dispatch`. Maintainers bump versions manually before triggering publish.

## License

By contributing, you agree that your contributions will be licensed under the [GPLv3 License](LICENSE).
