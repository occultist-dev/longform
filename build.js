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
  outfile: 'longform.js',
  sourcemap: true,
});

await esbuild.build({
  entryPoints: ['lib/longform.ts'],
  target: 'es6',
  outfile: 'longform.min.js',
  sourcemap: true,
  minify: true,
});

spawnSync('tsc', [
  './lib/longform.ts',
  '--outfile', './longform.d.ts',
  '--declaration',
  '--emitDeclarationOnly',
]);

await gzip('./longform.js', './longform.js.gz');
await gzip('./longform.min.js', './longform.min.js.gz');
