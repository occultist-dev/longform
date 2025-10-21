import { longform } from "./client.ts";
import { marked } from 'marked';


const lf = `
div::
  h1:: This is my header
  p::
    I have a paragraph following my header.
  h2:: This is my second header
  ul::
    li:: List item 1
    li:: List item 2
`;

const md = `
# This is my header


I have a paragraph following my header.

## This is my second header

- List item 1
- List item 2
`;

console.log('LONGFORM OUTPUT');
console.log(longform(lf, {}, (html) => html).root);

console.log('MARKED OUTPUT');
console.log(marked.parse(md));

Deno.bench('Longform', () => {
  longform(lf, {}, (html) => html);
});

Deno.bench('Marked', () => {
  marked.parse(md);
});
