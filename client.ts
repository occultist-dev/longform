import { lexer } from "./lexer.ts";
import { paramsRe } from "./reg.ts";

export type FragmentType =
  | 'root'
  | 'id'
  | 'bare'
  | 'range'
;

export type Element = {
  id?: string;
  tag?: string;
  class?: string;
  attrs: Record<string, string | undefined>;
  text?: string;
  indent: number;
  defined: boolean;
  directives: Record<string, string>;
};

export type WorkingFragment = {
  id?: string;
  type?: FragmentType;
  html: string;
  deps: string[];
  els: Element[];
};

export type Fragment = {
  id: string;
  type: FragmentType;
  html: string;
};

export type Longform = {
  root: string | null;
  fragments: Record<string, Fragment>;
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
  'xml': {
    declarationLevel: 'root',
    output: (args) => {
      return `<?xml ${args}?>`;
    },
  } satisfies DirectiveDefinition,
} as const;

const supportedDirectives = new Set(Object.keys(directives));

function newFragment(): WorkingFragment {
  return {
    html: '',
    deps: [],
    els: [],
  };
}

function newElement(indent: number): Element {
  return {
    indent,
    defined: false,
    attrs: {},
    directives: {},
  };
}

type Task =
  | 'g' // defining global stuff
  | 'e' // constructing element
  | 't' // outputting html text
  | 's' // skipping invalid content
  | null
;

export type LongformArgs = {
  sanatize?: SanitizeFn;
};

export function longform(longform: string, {
  sanatize: _sanatize,
}: LongformArgs = {}): Longform {
  // flips to true if we find the root element.
  // any other "roots" are ignored.
  let foundRoot = false;
  let preformattedIndent: number | null = null;
  let task: Task = null;
  let curFragment: WorkingFragment = newFragment();
  let curElement: Element = newElement(0);
  const output: Longform = {
    root: null,
    fragments: {},
  };

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
    if (curElement.tag != null) {
      curFragment.html += `<${curElement.tag}`

      if (curElement.id != null) {
        curFragment.html += ' id="' + curFragment.id + '"';
      }

      if (curElement.class != null) {
        curFragment.html += ' class="' + curElement.class + '"';
      }

      for (const attr of Object.entries(curElement.attrs)) {
        if (attr[1] == null) {
          curFragment.html += ' ' + attr[0]
        } else {
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

    if (targetIndent <= curElement.indent) {
      curElement = newElement(targetIndent);

      close(targetIndent - 1);

      if (targetIndent === 0) {
        if (curFragment.type === 'root') {
          output.root = curFragment.html;
        } else {
          output.fragments[curFragment.id as string] = {
            type: curFragment.type as FragmentType,
            id: curFragment.id as string,
            html: curFragment.html,
          };
        }

        curFragment = newFragment();
      }
    } else {
      curElement = newElement(targetIndent)
    }
  }
  
  lexer(longform, (indent, match) => {
    let paramsMatch: RegExpExecArray | null;

    switch (match[0]) {
      case 'd': { // directive
        if (!supportedDirectives.has(match[1])) {
          break;
        }

        const directive: DirectiveDefinition = directives[match[1] as keyof typeof directives];

        if (directive.declarationLevel === 'root' && curElement.indent !== 0) {
          break;
        }

        switch (match[1]) {
          case 'global': {
            task = 'g';
            break;
          }
          case 'doctype': {
            if (curElement.tag != null || task === 't') {
              applyIndent(indent);
            }

            task = 'e';
            curFragment.html += `<!doctype ${match[2]}>`
            break;
          }
          case 'xml': {
            if (curElement.tag != null || task === 't') {
              applyIndent(indent);
            }

            task = 'e';
            curFragment.html += `<?xml ${match[2] ?? 'version="1.0" encoding="UTF-8"'}?>`
            break;
          }

        }

        break;
      }
      case 'i': { // id
        task = 'e';

        if (curElement.tag != null) {
          applyIndent(indent);
        }

        curElement.id = match[1];

        if (indent === 0 && curFragment.id == null) {
          curFragment.id = match[1];
        }

        break;
      }
      case 'r': {
        task = 'e';

        if (curElement.tag != null) {
          applyIndent(indent);
        }

        curFragment.type = 'range';
        curFragment.id = match[1];

        break;
      }
      // deno-lint-ignore no-fallthrough
      case 'p': preformattedIndent = indent;
      case 'e': { // id
        if (task === 's' && indent !== 0) {
          break;
        }

        if (curElement.tag != null || task === 't') {
          task = 'e';
          applyIndent(indent);
        } else {
          task = 'e';
        }

        if (indent === 0 && curFragment.id == null) {
          if (foundRoot) {
            task = 's';
          } else {
            curFragment.type = 'root';
            foundRoot = true;
          }
        } else if (indent === 0) {
          curFragment.id = curElement.id;
          curFragment.type = match[2] ? 'bare' : 'id';
        }

        curElement.indent = indent;
        curElement.tag = match[1];
        curElement.defined = true;

        if (match[2] != null) {
          while ((paramsMatch = paramsRe.exec(match[2]))) {
            if (paramsMatch.groups?.i != null && curElement.id == null) {
              curElement.id = paramsMatch.groups.i;
            } else if (paramsMatch.groups?.c != null) {
              if (curElement.class == null) {
                curElement.class = paramsMatch.groups.c;
              } else {
                curElement.class += ' ' + paramsMatch.groups.c;
              }
            } else if (paramsMatch.groups?.a != null) {
              if (paramsMatch.groups.a === 'id') {
                if (curElement.id == null) {
                  curElement.id = paramsMatch.groups.v;
                }
              } else if (paramsMatch.groups.a === 'class') {
                if (curElement.class == null) {
                  curElement.class = paramsMatch.groups.v;
                } else {
                  curElement.class += ' ' + paramsMatch.groups.v;
                }
              } else {
                curElement.attrs[paramsMatch.groups.a] = paramsMatch.groups?.v;
              }
            }
          }
        }
        
        if (match[3] != null) {
          curElement.text = match[3]
        }

        break;
      }
      case 'a': {
        if (curElement.tag == null) {
          break;
        }

        if (curElement.attrs[match[1]] != null && match[2] != null) {
          curElement.attrs[match[1]] += match[2] as string;
        } else {
          curElement.attrs[match[1]] = match[2] ?? undefined;
        }

        break;
      }
      case 't': {
        if (curElement.tag != null) {
          applyIndent(indent);
        }
        
        if (preformattedIndent != null && preformattedIndent <= indent) {
          if (/[ \\t]*}[ \\t]*/.test(match[1])) {
            break;
          }
        } else if (preformattedIndent != null) {
          console.log('INDENT', indent)
          console.log('PREFORMATTED', preformattedIndent)
          curFragment.html += '\n ' + ' '.repeat((indent - preformattedIndent) * 2)
          break;
        }
        
        if (task === 't') {
          curFragment.html += ' ';
        }

        curFragment.html += match[1].trim();
        task = 't';
      }
    }
  });

  applyIndent(0)

  return output;
}
