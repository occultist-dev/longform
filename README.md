# Longform

<b class=keyword>Longform</b> is an easy to read markup and templating
language that outputs to <b class=keyword>HTML</b>.
A longform document can be parsed to a complete document in the output format
or as fragments to be used by a application as a source of markup when generating a
document, or when manipulating DOM in a browser environment.


This repo contains the Longform language specification and a light weight Longform
parser implemented for server rendering of HTML documents and client side
templating if required. Both the Longform language and parser are a work in progress.


Read more about the Longform language in the <a href="https://occultist-dev.github.io/longform">Longform Markup Language document</a>.


## Install

```
npm install @longform/longform
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
    #[fragment2]

#fragment1
div::
  p::
    This is a Longform fragment referencable by it's identifier.

#fragment2
div::
  p::
    This fragment will be embedded in the fragment that references it.
`;

const result = longform(markup);

// outputs the root fragment as HTML
console.log(result.root);

// outputs fragment1 as HTML
console.log(result.fragments.fragment1.html);
```

