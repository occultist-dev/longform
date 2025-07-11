
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
  // `(${parts[0]})|(${parts[1]})|(${parts[2]})`,
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
  root: boolean;
  id: string;
  html: string;
  parentEls: string[];
  pos: number;
  ends?: number;
};
export type HTMLFragment = string;
export type IDFragments = Record<string, string>;
export type BareFragments = Record<string, string>;
export type LongformFragments = {
  root?: HTMLFragment;
  id: IDFragments;
  bare: BareFragments;
};

function makeFragments(matches: MatchDetails[]): LongformFragments {
  let foundRoot = false;
  const
  const fragments: Fragment[] = [];
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
