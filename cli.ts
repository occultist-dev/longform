import { argv } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { longform } from './lib/longform.ts';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [,, infile, outfile] = argv;

if (typeof infile !== 'string' || infile.length === 0) {
  throw new Error('Infile argument expected');
}

console.log(infile, outfile);

const dir = dirname(fileURLToPath(import.meta.url));
const path = isAbsolute(infile)
  ? infile
  : resolve(dir, infile);
const doc = await readFile(path, 'utf-8')
const output = longform(doc, console.log);

console.log(output);
if (output.root == null) {
  throw new Error('No root fragment in document');
}

if (outfile == null) {
  //console.log(output);
  console.log(output.root);
} else {
  await writeFile(outfile, output.root)
}

