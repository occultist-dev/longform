import esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stat, mkdir, readFile, writeFile } from 'node:fs/promises';


const dir = dirname(fileURLToPath(import.meta.url));
const spec = resolve(dir, 'spec/intro.lf');
const mod = resolve(dir, 'lib/longform.ts');
const docs = resolve(dir, 'docs');

async function writeHTML() {
  const { longform } = await import(pathToFileURL(mod));
  const doc = await readFile(spec, 'utf-8');
  const output = longform(doc);

  await writeFile(resolve(dir, 'docs/index.html'), output.root);

  console.log('Updated');
}

async function gzip(input, output) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);

  await pipeline(source, gzip, destination);
}

try {
  await stat(docs);
} catch {
  await mkdir(docs);
}

await esbuild.build({
  entryPoints: ['lib/longform.ts'],
  target: 'es6',
  outfile: 'dist/longform.js',
  sourcemap: true,
});

await esbuild.build({
  entryPoints: ['lib/longform.ts'],
  target: 'es6',
  outfile: 'dist/longform.min.js',
  sourcemap: true,
  minify: true,
});

spawnSync('tsc', [
  './lib/types.ts',
  './lib/longform.ts',
  '--outfile', './dist/longform.d.ts',
  '--declaration',
  '--emitDeclarationOnly',
]);

await gzip('./dist/longform.js', './dist/longform.js.gz');
await gzip('./dist/longform.min.js', './dist/longform.min.js.gz');
await writeHTML();
