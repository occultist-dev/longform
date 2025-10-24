import { longform } from "./client.ts";
import { marked } from 'marked';
import { lexer } from "./lexer.ts";


const lf = `
div::
  h1:: This is my header
  p::
    I have a paragraph following my header.
  h2:: This is my second header
  ul::
    li:: List item 1
    li:: List item 2
  div.card::
    h3:: Child card
    p:: This is my card
  pre::
    code:: {
      div:: Sample div
    }
`;

const md = `
# This is my header

I have a paragraph following my header.

## This is my second header

- List item 1
- List item 2

<div class="card">
  <h3>Child card</h3>

  This is my card.
</div>
<pre><code>
  div:: sample div
</code></pre>
`;

console.log('LONGFORM OUTPUT');
console.log(longform(lf, {}, (html) => html).root);

console.log('MARKED OUTPUT');
console.log(marked.parse(md));

Deno.bench('Lexer', { n: 10_000 },  () => {
  lexer(lf, () => {});
});

Deno.bench('Longform', { n: 10_000 }, () => {
  longform(lf, {}, (html) => html);
});

Deno.bench('Marked', { n: 10_000 }, () => {
  marked.parse(md);
});
