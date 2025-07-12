
const r1 =
  // id
  `(^(?<wsp>[ \\t]*)` +
  `(?<id>#(<bare>#)?[\\w\\d\\-_:,.]+)` +
  `[ \\t]*$)` +
  // element
  `|(^(?<wsp>[ \\t]*)` +
  `(?<el>[\\w\\d\\-]+)` +
  `(?<cls>\\.[\\.\\w\\d\\-]+)?` +
  `::[ \\t]*$)` +
  // attribute
  `|(^(?<wsp>[ \\t]*)` +
  `\\[(?<at>[\\w\\d\\-]+)` +
  `(=(` +
  `('(?<val>["\\w\\d\\- ]+)')` +
  `|("(?<val>['\\w\\d\\- ]+)")` +
  `|(?<val>[\\w\\d\\- ]+)` +
  `))?\\]` +
  `)` +
  // text content
  `|(^(?<wsp>[ \\t]*)` +
  `(?<txt>.+)` +
  `$)`;

const r2 =
  // class names
  `\\.[\\w\\d\\-]+`;

const reg = new RegExp(
  r1,
  "gm",
);

export function lf(longform: string): LongformFragments {
  let finished = false;
  const lines = longform.split("\n");

  do {
  } while (finished);
}

const t1 = `\
root::\t\t
  #123-my_ID:1,3.
  div::\t
    foo.has.many-classes::
      [active]
      [active=2]
      [bar="baz"]
      [aria-label='Custom element']
      [aria-label='"Custom element"']
      [aria-label="'Custom element"]

      p::
        Some text content.
      p::
        And another line.

    At a different level.
`;

type MatchTypes = "id" | "el" | "at" | "tx";
type IdMatchDetails = {
  type: "id";
  bare: boolean;
  ident: number;
  id: string;
};
type ElMatchDetails = {
  type: "el";
  ident: number;
  el: string;
  class?: string;
};
type AtMatchDetails = {
  type: "at";
  ident: number;
  label: string;
  value?: string;
};
type TxtMatchDetails = {
  type: "tx";
  ident: number;
  value: string;
};
type MatchDetails =
  | IdMatchDetails
  | ElMatchDetails
  | AtMatchDetails
  | TxtMatchDetails;
type Fragment = {
  ident: number;
  root: boolean;
  id?: string;
  html: string;
  els: string[];
  pos: number;
  end?: number;
};
enum DefStage {
  Id,
  Ele,
  Att,
  Chd,
};
export type HTMLFragment = string;
export type IdentFragments = Record<string, string>;
export type AnonFragments = Record<string, string>;
export type LongformFragments = {
  root?: HTMLFragment;
  ident: IdentFragments;
  anon: AnonFragments;
};

const gth = /\>/g;
const lth = /\</g;
function html(text: string) {
  return text.replace(gth, '&gt;').replace(lth, '&lt;');
}
const voids = /(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wrb)/


function makeFragments(matches: MatchDetails[]): LongformFragments {
  let id: string | undefined;
  let stage: DefStage | undefined;
  let current: Fragment = {
    els: [],
    html: '',
    root: false,
    ident: 0,
    pos: 0,
  };
  let root: HTMLFragment | undefined;
  const ident: IdentFragments = {};
  const anon: AnonFragments = {};
  const fragments: Fragment[] = [];

  function closeCurrent() {
    current.html += `</${current.els.pop()}>`;
  }

  let index = 0;
  while (true) {
    const frag : Partial<Fragment> | undefined;
    const match = matches[index];

    if (match.ident === current.ident) {
      if (match.type === 'el') {
        current.html += `</${current.els.pop()}><${match.el}`;

        let prev = matches[index - 1];
        if (prev?.type === 'id' && !prev.bare && prev.ident === match.ident) {
          current.html += ` id="${prev.id}"`;
        }

        if (match.class != null) {
          current.html += ` class="${match.class.split('.').join(' ')}"`;
        }

        if (voids.test(match.el)) {
          current.html += ` />`;
        } else {
          stage = DefStage.Att;
        }
      } else if (match.type === 'at') {
        // attr is invalid here. Treat as text.
        if (stage === DefStage.Att && match.) {
          current.html += ` `
        }
      }
    } else if (match.ident > current?.ident) {

    } else if (match.ident < current?.ident) {

    } else {
      
    }

    index++;
  }

  return {
    root,
    ident,
    anon,
  };
}

function getMatches(longform: string): MatchDetails[] {
  let match: any;
  let matches: MatchDetails[] = [];

  while ((match = reg.exec(longform))) {
    if (match.groups.id != null) {
      const ident = match.groups.wsp.length;

      matches.push({
        type: "id",
        bare: match.groups.bare != null,
        ident,
        id: match.groups.id,
      });
    } else if (match.groups.el != null) {
      const ident = match.groups.wsp.length;

      matches.push({
        type: "el",
        ident,
        el: match.groups.el,
      });
    } else if (match.groups.at != null) {
      const ident = match.groups.wsp.length;
      const value = match.groups.val;

      matches.push({
        type: "at",
        ident,
        label: match.groups.at,
        value,
      });
    } else if (match.groups.txt != null) {
      const ident = match.groups.wsp.length;
      const value = match.groups.txt;
      matches.push({
        type: "tx",
        ident,
        value,
      });
    }
  }

  return matches;
}

Deno.test("lf", async (t) => {
  await t.step("It finds element definitions", () => {
    console.log("MATCHING", reg);
    let matches = getMatches(t1);

    console.log(JSON.stringify(matches, null, 2));
  });

  await t.step("It finds id identifiers", () => {
  });
});
