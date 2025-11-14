import { watchFile } from 'fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';


const dir = dirname(fileURLToPath(import.meta.url));
const spec = resolve(dir, 'spec/intro.lf');
const mod = resolve(dir, 'lib/longform.ts');

async function writeHTML() {
  const { longform } = await import(pathToFileURL(mod));
  const doc = await readFile(spec, 'utf-8');
  const output = longform(doc);

  await writeFile(resolve(dir, 'index.html'), output.root);

  console.log('Updated');
}

watchFile(spec, async () => {
  console.log('Changed', spec);
  await writeHTML();
});
console.log('Watching', spec);

watchFile(mod, async () => {
  console.log('Changed', mod);
  await writeHTML();
});
console.log('Watching', mod);

const server = createServer(async (_req, res) => {
  await writeHTML();
  
  const file = await readFile(resolve(dir, 'index.html'));
  res.writeHead(200, {
    "content-type": 'text/html',
  });
  res.end(file);
});

server.listen(8080, '127.0.0.1');
