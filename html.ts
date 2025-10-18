import { lexer } from "./lexer.ts";

export type Fragments = {
  /**
   * The root fragment which is selected when no fragment
   * identifier is used to select from the fragments.
   */
  root: string | null;

  /**
   * Fragments which have html ids matching the longform
   * fragment id.
   */
  ided: Record<string, string>;

  /**
   * Fragments which have no html id.
   */
  anon: Record<string, string>;

  /**
   * A set of fragments with a unique queryable class.
   */
  sets: Record<string, { class: string, elements: string[] }>;
};

export type Element = {
  id: number;
  tag: string;
  class: string;
  attrs: Record<string, string>;
  directives: Record<string, string>;
};

export type WorkingFragment = {
  root: boolean;
  bare: boolean;
  ident: number;
  start: number;
  pos: number;
  end: number;
  html: string;
  els: Element[];
  deps: string[];
};

function empty(): WorkingFragment {
  return {
    els: [],
    deps: [],
    html: "",
    root: false,
    bare: true,
    ident: 0,
    start: 0,
    pos: -1,
    end: 0,
  };
}

const voids =
  /(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wrb)/;

export function fragments(
  longform: string,
): Fragments {
  let current: WorkingFragment = empty();
  let root: string | null = null;
  const ided: Record<string, string> = {};
  const anon: Record<string, string> = {};
  const sets: Record<string, { class: string, elements: string[] }> = {};
  const working: Record<string, WorkingFragment> = {};

  function closeEls(targetIdent: number = 0) {
    while (current.els.length !== targetIdent) {
      current.html += `</${current.els.pop()}>`;
    }
  }

  lexer(longform, (ident, match) => {
    if (current.ident > ident) {
      closeEls(ident);
    }

    if (ident === 0) {
      current = empty();
    }
    
  });

  return {
    root,
    ided,
    anon,
    sets,
  };
}