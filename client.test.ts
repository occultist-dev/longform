import test from 'node:test';
import assert from 'node:assert/strict';
import { longform, type SanitizeArgs } from "./client.ts";
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import vnu from 'vnu-jar';
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import * as prettier from 'prettier';
import { rangeStartStr } from "./reg.ts";

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitize(html: string, args: SanitizeArgs): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: args.elements.map((element) => {
      if (typeof element === 'string') {
        return element;
      }

      return element.name;
    }),
    ADD_ATTR: (attr, tag) => {
      if (args.attributes.includes(attr)) {
        return true;
      }

      for (const element of args.elements) {
        if (typeof element === 'string') {
          continue;
        }

        if (element.name === tag) {
          return element.attributes.includes(attr);
        }
      }

      return false;
    }
  });
}

async function validate(html: string): Promise<boolean> {
  const tmpfile = resolve(tmpdir(), randomUUID() + '.html');

  await writeFile(tmpfile, html, 'utf-8');

  return new Promise<boolean>((resolve, reject) => {
    execFile('java', [
      '-jar',
      `"${vnu}"`,
      '--html',
      '--text',
      'json',
      tmpfile,
    ], { shell: true }, async (err) => {
      await unlink(tmpfile);

      if (err) {
        console.log(`HTML Validation error: ${err}`);
        console.log(await prettier.format(html, { parser: 'html' }));
        return reject(false);
      }

      resolve(true);
    });
  });
}

function wrapHead(html: string): string {
  return `<!doctype html><html lang=en><head>${html}</head><body><h1>Test</h1></body></html>`;
}

function wrapBody(html: string): string {
  return `<!doctype html><html lang=en><head><title>Test</title></head><body>${html}</body></html>`;
}

const lf1 = `
#ignored-in-test
p:: Ignore me.

@doctype:: html
html[lang=en]::
  head::
    title:: Longform title
  body::
    h1:: Longform h1
`;

const html1 = `\
<!doctype html>\
<html lang="en"><head><title>Longform title</title></head>\
<body><h1>Longform h1</h1></body></html>`;

test('It creates a root element with doctype', async () => {
  const res = longform(lf1);
  const html = res.root as string;

  assert(await validate(html));
  assert(html != null);
  assert(html == html1)
});

const lf2 = `\
#page-info
div.card.card--info::
  h4.card-header:: 
    The card's title goes here
  p.card-description::
    This is the body of the card. You
    can use&nbsp;<b>html</b> to inline
    elements which are hard to use in longform
    syntax, <strong>but they have to be allowed 
    using longform directives</strong>.
`;

const html2 = `\
<div id="page-info" class="card card--info"><h4 class="card-header">The card's \
title goes here</h4><p class="card-description">\
This is the body of the card. You can use&nbsp;<b>html</b> \
to inline elements which are hard to use in \
longform syntax, <strong>but they have to be \
allowed using longform directives</strong>.</p>\
</div>`;
test('It creates an ided element with inline html copy', async () => {
  const res = longform(lf2);
  const html = res.fragments['page-info'].html;

  assert(await validate(wrapBody(html)));
  assert.equal(html, html2);
});

const lf3 = `
#head [
  title:: My Longform Test
  meta::
    [name=description]
    [content=This tests the validity and correctness of the longform output]
]
`;
const html3 = `\
<title>My Longform Test</title>\
<meta name="description" content="This tests the validity and correctness of the longform output">\
`;
test('It creates a range of elements', { only: true }, async () => {
  const res = longform(lf3);
  const html = res.fragments['head'].html as string;
  console.log(html);

  assert(await validate(wrapHead(html)));
  assert.equal(html, html3);
});

