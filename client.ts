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

export type SanitizeElement = {
  name: string;
  attributes: string[];
};

export type SanitizeArgs = {
  elements: Array<string | SanitizeElement>;
  attributes: string[];
};

export type SanitizeFn = (html: string, args: SanitizeArgs) => string;

export type Scope = SanitizeArgs & {
  allowAll: boolean;
};

export type Element = {
  id: number;
  tag: string;
  class: string;
  attrs: Record<string, string>;
  directives: Record<string, string>;
  scope: Scope;
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

const voids =
  /(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wrb)/;


export type DirectiveDefinition = {
  mod?: (scope: Scope) => Scope;
  output?: (args: string | null, element: Element) => string;
}

const directives = {
  'doctype': {
    output: (args) => {
      return `<!doctype ${args ?? 'html'} />`;
    },
  } as DirectiveDefinition,
  'root': {},
  'set': {},
  'allow-all': {
    mod: (scope) => {
      scope.allowAll = true;
      return scope;
    }
  } as DirectiveDefinition,
  'allow-elements': {
    mod: (scope) => {
      scope.allowAll = false;
      return scope;
    }
  },
  'allow-attributes': {

  },
  'var': {

  },
} as const;

const supportedDirectives = Object.keys(directives);

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

export function longform(
  longform: string,
  sanitize: SanitizeFn,
): Fragments {
  let current: WorkingFragment = empty();
  let root: string | null = null;
  const ided: Record<string, string> = {};
  const anon: Record<string, string> = {};
  const sets: Record<string, { class: string, elements: string[] }> = {};
  const working: Record<string, WorkingFragment> = {};

  function close(targetIdent: number = 0) {
    while (current.els.length !== targetIdent) {
      current.html += `</${current.els.pop()}>`;
    }
  }

  lexer(longform, (ident, match) => {
    if (current.ident > ident) {
      close(ident);
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