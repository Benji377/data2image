import { program } from "commander";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, join, resolve, dirname } from "node:path";
import { encode, decode } from "@data2image/core";
import { glob } from "glob";
import ora from "ora";

program
  .name("data2image")
  .description("Convert any file to a PNG image and back")
  .version("1.0.0");

program
  .command("encode")
  .description("Encode file(s) into PNG image(s)")
  .argument("<files...>", "File(s) or glob pattern(s) to encode")
  .option("-o, --output <dir>", "Output directory (default: same as input file)")
  .option("--stdout", "Write PNG to stdout (single file only)")
  .action(async (filePatterns: string[], opts: { output?: string; stdout?: boolean }) => {
    const files = await resolveFiles(filePatterns);

    if (files.length === 0) {
      console.error("No files matched the given pattern(s).");
      process.exit(1);
    }

    if (opts.stdout) {
      if (files.length > 1) {
        console.error("--stdout can only be used with a single file.");
        process.exit(1);
      }
      const data = await readFile(files[0]);
      const png = encode(new Uint8Array(data), basename(files[0]));
      process.stdout.write(png);
      return;
    }

    const spinner = files.length > 1 ? ora(`Encoding ${files.length} files...`).start() : null;

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const fileName = basename(filePath);
      const outDir = opts.output ? resolve(opts.output) : dirname(resolve(filePath));

      if (spinner) spinner.text = `Encoding [${i + 1}/${files.length}] ${fileName}`;

      const data = await readFile(filePath);
      const png = encode(new Uint8Array(data), fileName);

      await mkdir(outDir, { recursive: true });
      const outPath = join(outDir, `${fileName}.d2i.png`);
      await writeFile(outPath, png);

      if (!spinner) {
        console.log(`Encoded: ${filePath} → ${outPath}`);
      }
    }

    if (spinner) spinner.succeed(`Encoded ${files.length} file(s)`);
  });

program
  .command("decode")
  .description("Decode PNG image(s) back to original file(s)")
  .argument("<files...>", "PNG image(s) or glob pattern(s) to decode")
  .option("-o, --output <dir>", "Output directory (default: same as input file)")
  .option("--stdout", "Write decoded file to stdout (single file only)")
  .action(async (filePatterns: string[], opts: { output?: string; stdout?: boolean }) => {
    const files = await resolveFiles(filePatterns);

    if (files.length === 0) {
      console.error("No files matched the given pattern(s).");
      process.exit(1);
    }

    if (opts.stdout) {
      if (files.length > 1) {
        console.error("--stdout can only be used with a single file.");
        process.exit(1);
      }
      const png = await readFile(files[0]);
      const result = decode(new Uint8Array(png));
      process.stdout.write(result.data);
      return;
    }

    const spinner = files.length > 1 ? ora(`Decoding ${files.length} files...`).start() : null;

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const fileName = basename(filePath);

      if (spinner) spinner.text = `Decoding [${i + 1}/${files.length}] ${fileName}`;

      const png = await readFile(filePath);
      const result = decode(new Uint8Array(png));

      const outDir = opts.output ? resolve(opts.output) : dirname(resolve(filePath));
      await mkdir(outDir, { recursive: true });
      const outPath = join(outDir, result.filename);
      await writeFile(outPath, result.data);

      if (!spinner) {
        console.log(`Decoded: ${filePath} → ${outPath}`);
      }
    }

    if (spinner) spinner.succeed(`Decoded ${files.length} file(s)`);
  });

async function resolveFiles(patterns: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern);
    files.push(...matches);
  }
  return [...new Set(files)];
}

program.parse();
