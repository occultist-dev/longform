import { lexer } from "./lexer.ts";
import { allowedAttributesRe, allowedElementsRe, attributeReStr, elementReStr, varRe } from "./reg.ts";

export type Fragments = {
  /**
   * The root fragment which is selected when no fragment
   * indentifier is used to select from the fragments.
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
  elementAttrs: Record<string, Set<string>>;
};

export type Element = {
  id?: string;
  tag?: string;
  class?: string;
  attrs: Record<string, string>;
  text?: string;
  indent: number;
  defined: boolean;
  directives: Record<string, string>;
  scope: Scope;
};

export type WorkingFragment = {
  root: boolean;
  bare: boolean;
  indent: number;
  start: number;
  pos: number;
  end: number;
  html: string;
  els: Element[];
  deps: string[];
  scope: Scope;
};

const voids = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wrb',
]);

export type DirectiveDefinition = {
  declarationLevel?: 'root' | 'any';
  clonesScope?: boolean;
  mod?: (args: string, scope: Scope, element: Element) => Scope;
  output?: (args: string | null, element: Element) => string;
}

const directives = {
  'global': {
    declarationLevel: 'root',
  } satisfies DirectiveDefinition,
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

function newFragment(scope: Scope): WorkingFragment {
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
    scope: structuredClone(scope),
  };
}

function newElement(indent: number, scope: Scope): Element {
  return {
    indent,
    defined: false,
    attrs: {},
    directives: {},
    scope: structuredClone(scope),
  };
}

type Task =
  | 'global'
  | 'element'
  | 'text'
  | null
;

export function longform(
  longform: string,
  context: Record<string, unknown>,
  sanitize: SanitizeFn,
): Fragments {
  const globalScope: Scope = {
    allowAll: false,
    elements: [],
    attributes: [],
    context,
    vars: {},
  };
  let task: Task = null;
  let curFragment: WorkingFragment = newFragment(globalScope);
  let curElement: Element = newElement(0, globalScope);
  let root: string | null = null;
  const ided: Record<string, string> = {};
  const anon: Record<string, string> = {};
  const sets: Record<string, { class: string, elements: string[] }> = {};
  const fragments: Array<WorkingFragment> = [];
  const working: Record<string, WorkingFragment> = {};

  function close(targetIndent: number = 0) {
    while (
      curFragment.els.length !== 0 && (
        targetIndent == null ||
        curFragment.els[curFragment.els.length - 1].indent !== targetIndent
      )
    ) {
      const element = curFragment.els.pop();

      curFragment.html += `</${element?.tag}>`;
    }
  }

  /**
   * Closes any current in progress element definition and creates
   * a new element.
   */
  function applyIndent(targetIndent: number) {
    console.log('APPLYING INDENT', curElement.tag, curElement.indent, targetIndent);
    if (task === 'global' || curElement.indent === targetIndent) {
      console.log('SKIPPING', curElement.tag);
      return;
    }

    if (curElement.tag != null) {
      console.log('DECLARING TAG', curElement.tag);
      curFragment.html += `<${curElement.tag}`

      if (curElement.attrs) {
        console.log(curElement.attrs);
      }

      for (const attr of Object.entries(curElement.attrs)) {
        let allowed = false;
        if (!curElement.scope.attributes.includes(attr[0]))
          break;

        // @todo:: Might be able to index the elements somehow
        for (let i = 0; i < curElement.scope.elements.length; i++) {
          const element = curElement.scope.elements[i];
          
          if (typeof element === 'string' || element.name !== curElement.tag)
            continue;

          allowed = true;
          break;
        }

        if (allowed) {
          curFragment.html += ` ${attr[0]}="${attr[1]}"`;
        }
      }

      curFragment.html += '>';

      if (!voids.has(curElement.tag as string) && curElement.text != null) {
        curFragment.html += curElement.text;
      }

      if (
        !voids.has(curElement.tag as string)
      ) {
        curFragment.els.push(curElement);
      }

    }
    
    curElement = newElement(targetIndent, curElement.scope)

    console.log(curFragment.html);

    if (targetIndent <= curElement.indent) {
      close(targetIndent - 1);

      if (targetIndent === 0) {
        fragments.push(curFragment);
        curFragment = newFragment(globalScope);
      }
    }
  }
  
  lexer(longform, (indent, match) => {
    console.log(indent, match);
    switch (match[0]) {
      // directive
      case 'd': {
        if (!supportedDirectives.has(match[1])) {
          break;
        }
        const directive = directives[match[1] as keyof typeof directives];

        if (directive.declarationLevel === 'root' && curFragment.indent !== 0) {
          break;
        }

        switch (match[1]) {
          case 'global': {
            task = 'global';
            break;
          }
          case 'doctype': {
            task = 'element';
            curFragment.html += `<!doctype ${match[2]}>`
            break;
          }
          case 'root': {
            task = 'element';
            task = 'element';
            curFragment.root = true;
            break;
          }
          case 'allow-all': {
            globalScope.allowAll = true;
          }
        }

        break;
      }
      case 'i': {
        task = 'element';
        if (curElement.tag != null) {
          applyIndent(indent);
        }

        curElement.id = match[1];
        break;
      }
      case 'e': {
        task = 'element';
        if (curElement.tag != null) {
          applyIndent(indent);
        }

        task = 'element';
        curElement.indent = indent;
        curElement.tag = match[1];
        curElement.defined = true;
        curElement.text = match[3]

        break;
      }
      case 'a': {
        curElement.attrs[match[1]] = match[2];
        break;
      }
      case 't': {
        if (curElement.tag != null) {
          applyIndent(indent);
        }
        curFragment.html += match[1];
      }
    }
  });

  applyIndent(0)

  let i = 0;
  for (;i < fragments.length; i++) {
    if (fragments[i].root) {
      root = fragments[i].html;
    }
  }

  return {
    root,
    ided,
    anon,
    sets,
  };
}
