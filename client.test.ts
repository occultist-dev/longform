import test from 'node:test';
import assert from 'node:assert/strict';
import { longform, type SanitizeArgs } from "./client.ts";
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

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


const lf1 = `\
@global::
  @allow-all

@doctype:: html
@root::
html[lang=en]::
  head::
    title:: Longform with doctype 1
  body::
    h1:: Longform with doctype 2
`;
test('It creates a root element with doctype', () => {
  const res = longform(lf1, {}, sanitize);

  assert(res.root != null)

  const doc = new JSDOM(res.root).window.document;

  console.log('RESULT', res);
});
