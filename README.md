# Longform

<b class=keyword>Longform</b> is an easy to read markup and templating
language that outputs to <b class=keyword>HTML</b> and <b class=keyword>XML</b>.
A longform document can be parsed to a complete document in the output format
or as fragments to be used by a application as a source of markup when generating a
document, or when manipulating DOM in a browser environment.


This repo contains the Longform language specification and a light weight Longform
parser implemented for server rendering of HTML or XML documents and client side
templating if required. Both the Longform language and parser are a work in progress.
You can view more on what language features are currently supported in the Github
milestones.


Read more about the Longform language in the Longform Markup Language document.


## Install

```
npm install @longform/longform
deno install jsr:@longform/longform
```

## Usage

```
const markup = `
@doctype:: html
html::
  head::
    title:: Example Longform
  body::
    h1:: Example Longform

#fragment1
div::
  p::
    This is a Longform fragment referencable by it's identifier.
`;

const fragments = longform(markup);

// outputs the root fragment as HTML
console.log(fragments.root);

// outputs fragment1 as HTML
console.log(fragments.fragment1.output);
```

