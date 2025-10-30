import { argv } from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { longform } from './lib/longform.ts';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const args = argv.slice(2);
const help = args.includes('--help') ?? args.includes('-h');
const pretty = args.includes('--pretty') ?? args.includes('-p');
const [infile, outfile] = args.filter((arg) => !arg.startsWith('-'));

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
let html: string;

if (pretty && output.root) {
  html = await format(output.root, { parser: 'html' });
} else if (output.root) {
  html = output.root;
} else {
  throw new Error('No root fragment in document');
}

if (outfile == null) {
  //console.log(output);
  console.log(html);
} else {
  await writeFile(outfile, html)
}

