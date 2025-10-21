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

function wrapBody(html: string): string {
  return `<!doctype html><head><title>Test</title></head><body>${html}</body>`;
}

const lf1 = `
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
  const res = longform(lf1, {}, sanitize);

  assert(res.root != null);
  assert(res.root == html1)
  assert(await validate(res.root));
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
  const res = longform(lf2, {}, sanitize);
  const html = res.ided['page-info'];

  assert.equal(html, html2);
  assert(await validate(wrapBody(html)));
});
