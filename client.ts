import { lexer } from "./lexer.ts";
import { allowedAttributesRe, allowedElementsRe, varRe } from "./reg.ts";

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

export type SanitizeElementObj = {
  name: string;
  attributes: string[];
};

export type SanitizeElement =
  | string
  | SanitizeElementObj
;

export type SanitizeArgs = {
  elements: SanitizeElement[];
  attributes: string[];
};

export type SanitizeFn = (html: string, args: SanitizeArgs) => string;

export type Scope = SanitizeArgs & {
  vars: Record<string, unknown>;
  allowAll: boolean;
  context: Record<string, unknown>;
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
  declarationLevel?: 'root' | 'any';
  clonesScope?: boolean;
  mod?: (args: string, scope: Scope, element: Element) => Scope;
  output?: (args: string | null, element: Element) => string;
}

const directives = {
  'doctype': {
    declarationLevel: 'root',
    output: (args) => {
      return `<!doctype ${args ?? 'html'}>`;
    },
  } satisfies DirectiveDefinition,
  'root': {
    declarationLevel: 'root',
  } satisfies DirectiveDefinition,
  'set': {
    declarationLevel: 'root',
  } satisfies DirectiveDefinition,
  'allow-all': {
    clonesScope: true,
    declarationLevel: 'any',
    mod: (_args, scope) => {
      scope.allowAll = true;
      scope.elements = [];
      scope.attributes = [];

      return scope;
    },
  } satisfies DirectiveDefinition,
  'allow-elements': {
    clonesScope: true,
    declarationLevel: 'any',
    mod: (args, scope) => {
      let match1: RegExpExecArray | null;
      let match2: RegExpExecArray | null;
      scope.allowAll = false;
      scope.elements = [];

      while ((match1 = allowedElementsRe.exec(args))) {
        if (match1?.groups?.a == null) {
          scope.elements.push(match1?.groups?.e as string);
        } else {
          const element: SanitizeElement = {
            name: match1.groups.a as string,
            attributes: [],
          };
          
          while ((match2 = allowedAttributesRe.exec(match1.groups.a))) {
            element.attributes.push(match2?.groups?.a as string);
          }

          scope.elements.push(element);
        }
      }

      return scope;
    }
  } satisfies DirectiveDefinition,
  'allow-attributes': {
    clonesScope: true,
    declarationLevel: 'any',
    mod: (args, scope) => {
      let match1: RegExpExecArray | null;

      scope.allowAll = false;
      scope.attributes = [];

      while ((match1 = allowedAttributesRe.exec(args))) {
        scope.attributes.push(match1?.groups?.a as string);
      }

      return scope;
    } 
  } satisfies DirectiveDefinition,
  'var': {
    declarationLevel: 'root',
    mod(args, scope) {
      let match: RegExpExecArray | null;

      while ((match = varRe.exec(args))) {
        scope.vars[match?.groups?.v as string] = scope.context[match?.groups?.v as string];
      }

      return scope;
    },
  } satisfies DirectiveDefinition,
} as const;

const supportedDirectives = new Set(Object.keys(directives));

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