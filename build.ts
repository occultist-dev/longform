import typescript from "@rollup/plugin-typescript";
import {createReadStream, createWriteStream} from "node:fs";
import {mkdir, readFile, rm, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {pipeline} from "node:stream/promises";
import {fileURLToPath, pathToFileURL} from "node:url";
import {createBrotliCompress, createGzip} from "node:zlib";
import {rollup} from "rollup";

const dir = dirname(fileURLToPath(import.meta.url));
const dist = resolve(dir, "dist");
const spec = resolve(dir, 'spec/spec.lf');
const mod = resolve(dir, 'dist/longform.js');
const docs = resolve(dir, 'docs');

async function html() {
  const { longform } = await import(pathToFileURL(mod).toString());
  const doc = await readFile(spec, "utf-8");
  const output = longform(doc);

  await writeFile(resolve(dir, "docs/index.html"), output.root);
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

await rm(docs, { recursive: true });
await rm(dist, { recursive: true });
await mkdir(docs);
await mkdir(dist);

{
  const res = await rollup({
    input: "lib/mod.ts",
    plugins: [typescript()],
  });
  await res.write({
    file: "dist/longform.js",
    format: "es",
    sourcemap: true,
  });
  await res.write({
    file: "dist/longform.cjs",
    format: "cjs",
    sourcemap: true,
  });
}

{
  const res = await rollup({
    input: "lib/mod.ts",
    onLog: console.log,
    plugins: [
      typescript({
        tsconfig: "tsconfig.json",
        declaration: true,
        declarationDir: "dist",
      }),
    ],
  });
  
  await res.write({
    file: "dist/longform.min.js",
    format: "es",
    sourcemap: true,
  });
}

await gzip("./dist/longform.js", "./dist/longform.js.gz");
await gzip("./dist/longform.min.js", "./dist/longform.min.js.gz");

await brotli("./dist/longform.js", "./dist/longform.js.br");
await brotli("./dist/longform.min.js", "./dist/longform.min.js.br");

await html();
