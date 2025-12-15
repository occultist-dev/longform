import typescript from '@rollup/plugin-typescript';
import { createBrotliCompress, createGzip } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stat, mkdir, readFile, writeFile } from 'node:fs/promises';
import {rollup} from 'rollup';


const dir = dirname(fileURLToPath(import.meta.url));
const spec = resolve(dir, 'spec/intro.lf');
const mod = resolve(dir, 'dist/longform.js');
const docs = resolve(dir, 'docs');

async function writeHTML() {
  const { longform } = await import(pathToFileURL(mod).toString());
  const doc = await readFile(spec, 'utf-8');
  const output = longform(doc);

  await writeFile(resolve(dir, 'docs/index.html'), output.root);
}

async function gzip(input: string, output: string) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);

  await pipeline(source, gzip, destination);
}

async function brotli(input: string, output: string) {
  const brotli = createBrotliCompress();
  const source = createReadStream(input);
  const destination = createWriteStream(output);

  await pipeline(source, brotli, destination);
}

try {
  await stat(docs);
} catch {
  await mkdir(docs);
}

await rollup({
  input: "lib/mod.ts",
  output: {
    file: "dist/longform.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [typescript()],
});

await rollup({
  input: "lib/mod.ts",
  output: {
    file: "dist/longform.min.js",
    format: "es",
    sourcemap: true,
  },
  plugins: [typescript({
    tsconfig: 'tsconfig.json',
    declaration: true,
    declarationDir: 'dist',
  })],
});

await gzip('./dist/longform.js', './dist/longform.js.gz');
await gzip('./dist/longform.min.js', './dist/longform.min.js.gz');
await brotli('./dist/longform.js', './dist/longform.js.br');
await brotli('./dist/longform.min.js', './dist/longform.min.js.br');
await writeHTML();
