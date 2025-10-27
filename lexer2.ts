import { paramsRe } from "./reg.ts";
import type { WorkingElement, WorkingChunk, ChunkType, WorkingFragment, FragmentType, Longform } from "./types.ts";

const sniffTestRe = /^(?:(?:(--).*)|(?: *(@|#).*)|(?: *[\w\-]+(?::[\w\-]+)?(?:[#.[][^\n]+)?(::).*)|(?:  +(\[).*)|(\ \ .+))$/gmi
  , element1 = /((?:\ \ )+)? ?([\w\-]+(?::[\w\-]+)?)([#\.\[][^\n]*)?::(?: ({|[^\n]+))?/gmi
  , directive1 = /((?:\ \ )+)? ?@([\w][\w\-]+)(?::: ?([^\n]+)?)?/gmi
  , attribute1 = /((?:\ \ )+)\[(\w[\w-]*(?::\w[\w-]*)?)(?:=([^\n]+))?\]/
  , preformattedClose = /[ \t]*}[ \t]*/
  , id1 = /((?:\ \ )+)?#(#)?([\w\-]+)( \[)?/gmi
  , idnt1 = /^(\ \ )+/
  , text1 = /^((?:\ \ )+)([^ \n][^\n]*)$/i
  , voids = new Set([
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

let m1: RegExpExecArray | null
  , m2: RegExpExecArray | null;


const lf1 = `\
-- comment
@doctype:: test
#element-id
html::
  pre:: {
    formatted::
      test::
  }
  header::
    h1:: Can it do this?
`;

function makeElement(indent: number = 0): WorkingElement {
  return {
    indent,
    html: '',
    attrs: {},
  };
}

function makeChunk(type: ChunkType = 'parsed'): WorkingChunk {
  return {
    type,
    html: '',
    els: [],
  };
}

function makeFragment(type: FragmentType = 'bare'): WorkingFragment {
  return {
    type,
    html: '',
    els: [],
    chunks: [],
  };
}

export function lexer2(lf: string = lf1, debug: (...d: any[]) => void = () => {}) {
  let foundRoot: boolean = false
    , skipping: boolean = false
      // used for scripts and preformat
    , specialIndent: number | null = null
    , element: WorkingElement = makeElement()
    , chunk: WorkingChunk | null = makeChunk()
    , fragment: WorkingFragment = makeFragment();
  const output: Longform = Object.create(null);

  output.fragments = Object.create(null);
  
  
  /**
   * Closes any current in progress element definition
   * and creates a new working element.
   */
  function applyIndent(targetIndent: number) {
    if (element.tag != null) {
      fragment.html += `<${element.tag}`

      if (element.id != null) {
        fragment.html += ' id="' + element.id + '"';
      }

      if (element.class != null) {
        fragment.html += ' class="' + element.class + '"';
      }

      for (const attr of Object.entries(element.attrs)) {
        if (attr[1] == null) {
          fragment.html += ' ' + attr[0]
        } else {
          fragment.html += ` ${attr[0]}="${attr[1]}"`;
        }
      }

      fragment.html += '>';

      if (!voids.has(element.tag as string) && element.text != null) {
        fragment.html += element.text;
      }

      if (
        !voids.has(element.tag as string)
      ) {
        fragment.els.push(element);
      }
    }

    if (targetIndent <= element.indent) {
      element = makeElement(targetIndent);

      while (
        fragment.els.length !== 0 && (
          targetIndent == null ||
          fragment.els[fragment.els.length - 1].indent !== targetIndent - 1
        )
      ) {
        const element = fragment.els.pop();

        fragment.html += `</${element?.tag}>`;
      }

      if (targetIndent === 0) {
        debug(0, '<', fragment.type, fragment.id);
        if (fragment.type === 'root') {
          output.root = fragment.html;
        } else {
          output.fragments[fragment.id as string] = {
            type: fragment.type as FragmentType,
            id: fragment.id as string,
            html: fragment.html,
          };
        }

        fragment = makeFragment();
      }
    } else {
      element = makeElement(targetIndent)
    }
  }

  while ((m1 = sniffTestRe.exec(lf))) {
    if (m1[1] === '--') {
      continue;
    }


    // If this is a script tag or preformatted block
    // we want to retain the intended formatting less
    // the indent. Preformatting can apply to any element
    // by ending the declaration with `:: {`.
    if (specialIndent != null) {
      // inside a script or preformatted block
      idnt1.lastIndex = 0;
      m2 = idnt1.exec(m1[0]);
      const indent = m2 == null
        ? null
        : m2[0].length / 2;

      if (m2 == null || indent as number <= specialIndent) {
        fragment.html += '\n';
        debug(indent, '}', m2?.[0]);

        applyIndent(specialIndent);
        specialIndent = null;

        if (preformattedClose.test(m1[0])) {
          continue;
        }
      } else {
        const line = m1[0].replace('  '.repeat(specialIndent + 1), '');
        debug(indent, '{', line);

        if (element.tag != null) {
          applyIndent(indent as number);
        }
        fragment.html += '\n' + line


        continue;
      }
    }

    switch (m1[2] ?? m1[3] ?? m1[4]) {
      // deno-lint-ignore no-fallthrough
      case '#': {
        id1.lastIndex = 0;
        m2 = id1.exec(m1[0]);

        if (m2 != null) {
          const indent = (m2[1]?.length ?? 0) / 2;
          debug(indent, 'id', m2[2], m2[3], m2[4]);

          if (element.tag != null) {
            applyIndent(indent);
          }

          fragment.id = m2[3];

          if (indent === 0) {
            if (m2[4] != null) {
              fragment.type = 'range';
            } else if (m2[2] != null) {
              fragment.type = 'bare';
            } else {
              fragment.type = 'embed';
              element.id = fragment.id;
            }
          }

          break;
        }
      }
      case '@':
      case '[':
      // deno-lint-ignore no-fallthrough
      case '::': {
        element1.lastIndex = 0;
        // fall through if m1[3] is a # or @
        m2 = m1[2] ?? m1[4] != null
           ? null
           : element1.exec(m1[0]);

        // if null then invalid element selector
        // allow the default text case to handle
        if (m2 != null) {
          const indent = (m2[1]?.length ?? 0) / 2
              , tg = m2[2]
              , ar = m2[3]
              , pr = m2[4] === '{'
          const tx = pr ? null : m2[4]

          debug(indent, 'e', tg, pr, tx);

          if (element.tag != null || element.indent > indent) {
            applyIndent(indent);
          }
          
          if (indent === 0 && fragment.id == null) {
            if (foundRoot) {
              skipping = true;
            } else {
              fragment.type = 'root';
              foundRoot = true;
            }
          }

          element.indent = indent;
          element.tag = tg;

          if (ar != null) {
            while ((m2 = paramsRe.exec(ar))) {
              if (m2.groups?.i != null && element.id == null) {
                element.id = m2.groups.i;
              } else if (m2.groups?.c != null) {
                if (element.class == null) {
                  element.class = m2.groups.c;
                } else {
                  element.class += ' ' + m2.groups.c;
                }
              } else if (m2.groups?.a != null) {
                if (m2.groups.a === 'id') {
                  if (element.id == null) {
                    element.id = m2.groups.v;
                  }
                } else if (m2.groups.a === 'class') {
                  if (element.class == null) {
                    element.class = m2.groups.v;
                  } else {
                    element.class += ' ' + m2.groups.v;
                  }
                } else {
                  element.attrs[m2.groups.a] = m2.groups?.v;
                }
              }
            }
          }

          if (!pr && tx != null) {
            element.text = tx;
          } else if (pr) {
            specialIndent = indent;
          }

          break;
        }

        attribute1.lastIndex = 0;
        m2 = m1[2] != null
           ? null
           : attribute1.exec(m1[0]);

        if (m2 != null && element.tag != null) {
          debug('a', m2[2], m2[3]);

          if (m2[2] === 'id') {
            if (element.id == null) {
              element.id = m2[3].trim();
            }
          } else if (m2[2] === 'class') {
            if (element.class != null) {
              element.class += ' ' + m2[3].trim();
            } else {
              element.class = m2[3].trim();
            }
          } else if (element.attrs[m2[2]] != null) {
            element.attrs[m2[2]] += m2[3];
          } else {
            element.attrs[m2[2]] = m2[3];
          }

          break;
        }

        directive1.lastIndex = 0;
        m2 = m1[3] != null
            ? null 
            : directive1.exec(m1[0]);

        if (m2 != null) {
          const indent = (m2[1]?.length ?? 0) / 2;

          if (element.tag != null) {
            applyIndent(indent);
          }

          switch (m2[2]) {
            case 'doctype': {
              fragment.html += `<!doctype ${m2[3] ?? 'html'}>`;
              break;
            }
            case 'xml': {
              fragment.html += `<?xml ${m2[3] ?? 'version="1.0" encoding="UTF-8"'}?>`;
              break;
            }
          }

          break;
        }

      }
      default: {
        const m2 = text1.exec(m1[0]) as RegExpExecArray;
        if (m2 == null) {
          break;
        }
        const indent = m2[1].length / 2;

        debug(indent, 't', m2[2]);

        if (element.tag != null) {
          applyIndent(indent);

          fragment.html += m2[2].trim();
        } else {
          fragment.html += ' ' + m2[2].trim();
        }
        break;
      }
    }
  }

  applyIndent(0);

  return output;
}
