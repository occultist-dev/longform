

// w = leading whitespace
// d = Directive indentifier, b = Block defining, a = Inline args
// i = Element id, b = Bare indentifer
// e = Element name, a = Element args, t = Inline text
// a = Attribute name, v = Attribute value
// t = Text

const wsp = `^(?<w>[ \\t]*)`;
const tailText = `(\\s+)|( (<txt>\\S))`;
const r1 =
  // id
  `(${wsp}` +
  `(#(?<b>#)?(?<i>[\\w\\d\\-_:,.]+))` +
  `[ \\t]*$)` +
  // element
  `|(${wsp}` +
  `(?<e>[\\w\\d\\-]+)` +
  `(?<a>\\.[\\.\\w\\d\\-]+)?` +
  `::[ \\t]*$)` +
  // attribute
  `|(${wsp}` +
  `\\[(?<a>[\\w\\d\\-]+)` +
  `(=(` +
  `('(?<v>["\\w\\d\\- ]+)')` +
  `|("(?<v>['\\w\\d\\- ]+)")` +
  `|(?<v>[\\w\\d\\- ]+)` +
  `))?\\]` +
  `)` +
  // directive
  `|(${wsp}` +
  `(\\@(?<d>[\\w\\d\\-_]+))(?<b>::)?` +
  `)` +
  // text content
  `|(^(?<wsp>[ \\t]*)` +
  `(?<txt>.+)` +
  `$)`;

const reg = new RegExp(
  r1,
  "gm",
);

type MatchTypes = "id" | "el" | "at" | "tx";
type IdMatchDetails = {
  type: "id";
  bare: boolean;
  indent: number;
  id: string;
};
type ElMatchDetails = {
  type: "el";
  indent: number;
  el: string;
  class?: string;
};
type AtMatchDetails = {
  type: "at";
  indent: number;
  label: string;
  value?: string;
};
type TxtMatchDetails = {
  type: "tx";
  indent: number;
  value: string;
};
type MatchDetails =
  | IdMatchDetails
  | ElMatchDetails
  | AtMatchDetails
  | TxtMatchDetails;

type Fragment = {
  indent: number;
  root: boolean;
  bare: boolean;
  id?: string;
  html: string;
  els: ElMatchDetails[];
  deps: string[];
  start: number;
  pos: number;
  end: number;
};
export type HTMLFragment = string;
export type indentFragments = Record<string, string>;
export type AnonFragments = Record<string, string>;
export type LongformFragments = {
  root?: HTMLFragment;
  indent: indentFragments;
  anon: AnonFragments;
};

const gth = /\>/g;
const lth = /\</g;
function html(text: string) {
  return text.replace(gth, "&gt;").replace(lth, "&lt;");
}
const voids =
  /(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wrb)/;

function empty(): Fragment {
  return {
    els: [],
    deps: [],
    html: "",
    root: false,
    bare: true,
    indent: 0,
    start: 0,
    pos: -1,
    end: 0,
  };
}

function makeFragments(matches: MatchDetails[]): LongformFragments {
  let foundRoot = false;
  let current: Fragment = empty();
  let root: HTMLFragment | undefined;
  const indent: indentFragments = {};
  const anon: AnonFragments = {};
  const fragments: Fragment[] = [];

  function closeEls(targetindent?: number) {
    while (
      current.els.length !== 0 && (
        targetindent == null ||
        current.els[current.els.length - 1].indent !== targetindent
      )
    ) {
      const element = current.els.pop() as ElMatchDetails;

      current.html += `</${element.el}>`;
    }
  }

  let index = 0;
  while (matches[index] != null) {
    const match = matches[index];

    if (match.type !== 'el') {
      index++;
      continue;
    }
    
    if (
      current.els.length !== 0 &&
      match.indent < current.els[current.els.length - 1].indent
    ) {
      // close last element if the indent gets shorter
      closeEls(match.indent);

      if (match.indent === 0 && current.pos !== 0) {
        fragments.push(current);
        current = empty();
      }
    }

    if (!foundRoot && match.el === "root" && match.indent === 0) {
      // root element of the document started
      foundRoot = true;
      current.root = true;
      current.bare = true;
      index++;
      continue;
    }

    const prev = matches[index - 1];

    if (match.indent === 0 && (prev.type !== "id" || match.el === 'root')) {
      // Skip passed top level declarations missing ids or duplicate roots
      let next: MatchDetails;

      do {
        next = matches[index + 1];
        index++;
      } while (next != null && next.indent !== 0 && next.type !== "el")

      if (next != null) {
        break;
      }

      continue;
    }
    
    if (match.indent === 0 && prev.type === "id") {
      // new fragment started
      
      if (current.root || current.id != null) {
        closeEls();
        fragments.push(current);
        current = empty();
      }
      
      current.id = prev.id;
      current.bare = prev.bare;
    }
    
    current.html += `<${match.el}`;

    if (prev?.type === "id" && !prev.bare && prev.indent === match.indent) {
      current.html += ` id="${prev.id}"`;
    }

    if (match.class != null) {
      current.html += ` class="${match.class.split(".").join(" ")}"`;
    }

    while (matches[index + 1]?.type === "at") {
      const next = matches[index + 1] as AtMatchDetails;

      current.html += ` ${next.label}`;

      if (next.value != null) {
        current.html += `="${next.value}"`;
      }
      index++;
    }

    const isVoid = voids.test(match.el);

    if (isVoid) {
      current.html += `>`;
    } else if (
      matches[index + 1] == null || matches[index + 1].indent <= match.indent
    ) {
      // next is not a child
      current.html += `></${match.el}>`;
    } else {  
      current.html += `>`;
      current.els.push(match);
    }

    while (matches[index + 1]?.type === "tx") {
      // add all child text matches, or ignore if void element
      if (!isVoid) {
        const next = matches[index + 1] as TxtMatchDetails;
        current.html += html(next.value);
      }

      index++;
    }

    index++;
  }

  closeEls();

  fragments.push(current);

  for (const fragment of fragments) {
    if (fragment.root) {
      root = fragment.html;
    } else if (fragment.bare) {
      anon[fragment.id as string] = fragment.html;
    } else {
      indent[fragment.id as string] = fragment.html;
    }
  }

  return {
    root,
    indent,
    anon,
  };
}

function getMatches(longform: string): MatchDetails[] {
  let match: any;
  const matches: MatchDetails[] = [];

  while ((match = reg.exec(longform))) {
    if (match.groups.id != null) {
      const indent = match.groups.wsp.length;

      matches.push({
        type: "id",
        bare: match.groups.bare != null,
        indent,
        id: match.groups.id,
      });
    } else if (match.groups.el != null) {
      const indent = match.groups.wsp.length;

      matches.push({
        type: "el",
        indent,
        el: match.groups.el,
      });
    } else if (match.groups.at != null) {
      const indent = match.groups.wsp.length;
      const value = match.groups.val;

      matches.push({
        type: "at",
        indent,
        label: match.groups.at,
        value,
      });
    } else if (match.groups.txt != null) {
      const indent = match.groups.wsp.length;
      const value = match.groups.txt;
      matches.push({
        type: "tx",
        indent,
        value,
      });
    }
  }

  return matches;
}

export function longform(text: string): LongformFragments {
  const matches = getMatches(text);
  const fragments = makeFragments(matches);

  return fragments;
}
