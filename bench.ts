import { longform } from "./client.ts";
import markdownit from 'markdown-it';
import { marked } from 'marked';
import { lexer } from "./lexer.ts";
import { lexer2 } from "./lexer2.ts";


const mdit = markdownit({ html: true });
const lf = `
div::
  h1:: This is my header
  p::
    I have a paragraph following my header.
    em::
      I sort of like this
    strong::
      I really like this
    strong::
      em::
        I really-really like this
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
*I sort of like this*
**I really like this**
***I really-really like this***
## This is my second header

- List item 1
- List item 2

<div class="card">
  <h3>Child card</h3>
  #### Heading level 4

  This is my card.
</div>
<pre><code>
  div:: sample div
</code></pre>
`;

console.log('LONGFORM OUTPUT');
console.log(longform(lf, {}, (html) => html).root);
console.log()

console.log('MARKED OUTPUT');
console.log(marked.parse(md));
console.log()

console.log('MARKDOWN-IT OUTPUT');
console.log(mdit.renderInline(md));
console.log()

const json = JSON.stringify(lexer2(lf))
Deno.bench('Lexer2', { n: 10_000 },  () => {
  lexer2(lf);
});

Deno.bench('JSON', { n: 10_000 }, () => {
  JSON.parse(json);
})

Deno.bench('Lexer', { n: 10_000 },  () => {
  lexer(lf, () => {});
});
Deno.bench('Longform', { n: 10_000 }, () => {
  longform(lf, {}, (html) => html);
});

Deno.bench('Marked', { n: 10_000 }, () => {
  marked.parse(md);
});

Deno.bench('Markdown-it', { n: 10_000 }, () => {
  mdit.parse(md);
});
