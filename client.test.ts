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
import { lexer2 } from "./lexer2.ts";

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

async function validate(html: string, type: 'html' | 'xml' = 'html'): Promise<boolean> {
  const tmpfile = resolve(tmpdir(), randomUUID() + '.html');
  const format = type === 'xml'
    ? '--xml'
    : '--html';

  await writeFile(tmpfile, html, 'utf-8');

  return new Promise<boolean>((resolve, reject) => {
    execFile('java', [
      '-jar',
      `"${vnu}"`,
      format,
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
  const res = lexer2(lf1, console.log);
  const html = res.root as string;

  assert(await validate(html));
  assert.equal(html, html1);
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
  const res = lexer2(lf2, console.log);
  console.log(res);
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
test('It creates a range of elements', async () => {
  const res = lexer2(lf3, console.log);
  console.log(res);
  const html = res.fragments['head'].html as string;
  console.log(html);

  assert(await validate(wrapHead(html)));
  assert.equal(html, html3);
});

const lf4 = `
@xml:: version="1.0" encoding="UTF-8"
h:html::
  [xmlns:xdc=http://www.xml.com/books]
  [xmlns:h=http://www.w3.org/HTML/1998/html4]
  h:head::
    h:title:: Book Review
  h:body::
    xdc:bookreview::
      xdc:title:: XML: A Primer
      h:table::
        h:tr[align=center]::
          h:td:: Author
          h:td:: Price
          h:td:: Pages
          h:td:: Date
        h:tr[align=left]::
          h:td::
            xdc:author:: Simon St. Laurent
          h:td::
            xdc:price:: 31.98
          h:td::
            xdc:pages:: 352
          h:td::
            xdc:date:: 1998/01
`;

const xml4 = `\
<?xml version="1.0" encoding="UTF-8"?>\
<h:html xmlns:xdc="http://www.xml.com/books" xmlns:h="http://www.w3.org/HTML/1998/html4">\
<h:head><h:title>Book Review</h:title></h:head>\
<h:body>\
<xdc:bookreview>\
<xdc:title>XML: A Primer</xdc:title>\
<h:table>\
<h:tr align="center">\
<h:td>Author</h:td><h:td>Price</h:td>\
<h:td>Pages</h:td><h:td>Date</h:td></h:tr>\
<h:tr align="left">\
<h:td><xdc:author>Simon St. Laurent</xdc:author></h:td>\
<h:td><xdc:price>31.98</xdc:price></h:td>\
<h:td><xdc:pages>352</xdc:pages></h:td>\
<h:td><xdc:date>1998/01</xdc:date></h:td>\
</h:tr>\
</h:table>\
</xdc:bookreview>\
</h:body>\
</h:html>\
`;
test('It parses an XML string', () => {
  const res = lexer2(lf4, console.log);

  console.log(res);
  const xml = res.root as string;

  assert.equal(xml, xml4);
})

const lf5 = `
pre::
  code:: {
    div::
      Example longform
      <em>with preformatted html</em>
  }
`;
const html5 = `\
<pre><code>
div::
  Example longform
  <em>with preformatted html</em>
</code></pre>\
`;
test('It parses preformatted content', () => {
  const res = lexer2(lf5, console.log);
  const html = res.root as string;

  assert.equal(html, html5);
})

const lf6 = `
head::
  script:: {
    const foo = 'bar';

    console.log(foo);
  }
`;
const html6 = `\
<head><script>
const foo = 'bar';
console.log(foo);
</script></head>\
`;
test('It parses preformatted content', () => {
  const res = lexer2(lf6, console.log);
  const html = res.root as string;

  assert.equal(html, html6);
})

