import { longform } from "./client.ts";
import { marked } from 'marked';
import { lexer } from "./lexer.ts";
import { lexer2 } from "./lexer2.ts";
import * as commonmark from 'commonmark';
import markdownit from 'markdownit';

const cmReader = new commonmark.Parser();
const cmWriter = new commonmark.HtmlRenderer();
const mdit = markdownit();

const lf = `
div::
  h1#header1:: This is my header
  p::
    I have a paragraph following my header.
    em:: I sort of like this
    strong:: I really like this
    strong::
      em:: I really-really like this
  h2:: This is my second header
  ul::
    li:: List item 1
    li:: List item 2
  div.card::
    h3:: Child card
    p:: This is my card
  pre:: {
    console.log('foo');
  }
  pre::
    code:: {
      div:: Sample div
    }
`;

const md = `
# This is my header {header1}


I have a paragraph following my header.
*I sort of like this*
**I really like this**
***I really-really like this***
## This is my second header

* List item 1
* List item 2

<div class="card">
  <h3>Child card</h3>
  #### Heading level 4

  This is my card.
</div>
\`\`\`
console.log('foo');
\`\`\`
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

console.log('COMMONMARKED OUTPUT');
console.log(cmWriter.render(cmReader.parse(md)));
console.log()

console.log('MARKDOWN-IT OUTPUT');
console.log(mdit.render(md));
console.log()

const json = JSON.stringify(lexer2(lf))

console.log('JSON OUTPUT');
console.log(json);
console.log();

Deno.bench('Longform', { n: 10_000 },  () => {
  lexer2(lf);
});

Deno.bench('JSON', { n: 10_000 }, () => {
  JSON.parse(json);
})

Deno.bench('Lexer old', { n: 10_000 },  () => {
  lexer(lf, () => {});
});

Deno.bench('Longform old', { n: 10_000 }, () => {
  longform(lf, {}, (html) => html);
});

Deno.bench('Marked', { n: 10_000 }, () => {
  marked.parse(md);
});

Deno.bench('CommonMark', { n: 10_000 }, () => {
  cmWriter.render(cmReader.parse(md));
});

Deno.bench('MarkdownIt', { n: 10_000 }, () => {
  mdit.render(md);
})
