import { paramsRe } from "./reg.ts";
import { WorkingElement, WorkingChunk, ChunkType, WorkingFragment, FragmentType, Longform } from "./types.ts";

const lines1 = /(?:--)|(^.*(@|::|#).*$)|(^.+$)/gmi
  , element1 = /([  ]+)? ?(?=@)(\w[\w\-]*(?::[\w\-]+)?)(.*)?::(?: ({|[^\n]+))?/gmi
  , directive1 = /([  ]+)? ?@([\w][\w\-]+)(?::: ?([^\n]+)?)?/gmi
  , id1 = /#[\w\-]+/gmi
  , idnt1 = /^([  ]+)/
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
@doctype:: test
pre:: {
  formatted
}
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

export function lexer2(lf: string = lf1) {
  let foundRoot: boolean = false
    , skipping: boolean = false
      // used for scripts and preformat
    , specialIndent: number | null = null
    , element: WorkingElement = makeElement()
    , chunk: WorkingChunk | null = makeChunk()
    , fragment: WorkingFragment = makeFragment()
    , output: Longform = Object.create(null)
  ;

  output.fragments = Object.create(null);
  
  /**
   * Closes all working elements at or deeper
   * than the target indent.
   */
  function close(targetIndent: number = 0) {
    while (
      fragment.els.length !== 0 && (
        targetIndent == null ||
        fragment.els[fragment.els.length - 1].indent !== targetIndent
      )
    ) {
      const element = fragment.els.pop();

      fragment.html += `</${element?.tag}>`;
    }
  }
  
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

      close(targetIndent - 1);

      if (targetIndent === 0) {
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

  while ((m1 = lines1.exec(lf))) {
    if (specialIndent != null) {
      // inside a script or preformatted block
      m2 = idnt1.exec(m1[0]);

      if (m2 == null || m2[0].length / 2 <= specialIndent) {
        specialIndent = 0;

        if (/[ \t]*}[ \t]*/.test(m1[0])) {
          continue;
        }
      } else {
        const line = m1[0].replace('  '.repeat(specialIndent), '');

        element.html += line;

        continue;
      }
    }

    switch (m1[2]) {
      case '#': {
        m2 = id1.exec(m1[0]);
        break;
      }

      case '@':
      // deno-lint-ignore no-fallthrough
      case '::': {
        m2 = m1[2] === '@' ? null : element1.exec(m1[0]);

        // console.log(m1[0])
        // console.log(m2)

        // if null then invalid element selector
        // allow the default text case to handle
        if (m2 != null) {
          const indent = m2[1]?.length ?? 0 / 2
              , tg = m2[2]
              , ar = m2[3]
              , pr = m2[4] != null;

          if (pr) specialIndent = indent;

          if (element.tag != null) {
            applyIndent(indent);
          }
          
          if (indent === 0 && fragment.id == null) {
            if (foundRoot) {
              skipping = true;
            } else {
              fragment.type = 'root';
              foundRoot = true;
            }
          } else if (indent === 0) {
            // fragment type will be set when the
            // id is parsed
            fragment.id = element.id;
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

          break;
        }

        m2 = directive1.exec(m1[0]);

        if (m2 != null) {
          switch (m2[2]) {
            case 'doctype': {
              fragment.html += `<!doctype ${m2[3] ?? 'html'}>`;
              break;
            }
            case 'xml': {
              fragment.html += `<?xml ${m2[3] ?? 'version="1.0" encoding="UTF-8"'}>`;
              break;
            }
          }

          break;
        }
      }
      default: {
        break;
      }
    }
  }

  applyIndent(0);

  return output;
}