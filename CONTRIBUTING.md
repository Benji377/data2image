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

## Release Process

Releases are handled via GitHub Actions with `workflow_dispatch`. **Maintainers only:**

### Before Publishing

1. **Bump versions** in `package.json` files:
   - `packages/core/package.json` → update `"version"`
   - `packages/cli/package.json` → update `"version"`
   
2. **Update CHANGELOG.md** with:
   - New version number and date
   - Added/Changed/Fixed entries
   
3. **Commit and push** changes to `main`

4. **Run GitHub Actions workflow**:
   - Go to **Actions → Publish to npm → Run workflow**
   - Select package: `core`, `cli`, or `both`
   - GitHub will publish using Trusted Publishing (OIDC)

### Versioning (semver)

- **Patch** (`1.0.0` → `1.0.1`) - bug fixes only, no API changes
- **Minor** (`1.0.0` → `1.1.0`) - new features, backward compatible
- **Major** (`1.0.0` → `2.0.0`) - breaking changes

### Note

npm does not allow overwriting published versions. Once a version is published, you must bump the version to publish again.

## License

By contributing, you agree that:

- Contributions to **@data2image/core** will be licensed under the [MIT License](packages/core/LICENSE) (permissive)
- Contributions to **data2image** (CLI) will be licensed under the [GPLv3 License](packages/cli/LICENSE) (copyleft)
- Contributions to the **website** will be licensed under the [GPLv3 License](LICENSE) (copyleft)
