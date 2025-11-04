import esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';


async function gzip(input, output) {
  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);

  await pipeline(source, gzip, destination);
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
  './lib/longform.ts',
  '--outfile', './dist/longform.d.ts',
  '--declaration',
  '--emitDeclarationOnly',
]);

await gzip('./dist/longform.js', './dist/longform.js.gz');
await gzip('./dist/longform.min.js', './dist/longform.min.js.gz');
