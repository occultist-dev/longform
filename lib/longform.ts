import type { WorkingElement, WorkingChunk, ChunkType, WorkingFragment, FragmentType, ParsedResult } from "./types.ts";

export type {
  ChunkType,
  FragmentType,
  ParsedResult,
};

const sniffTestRe = /^(?:(?:(--).*)|(?: *(@|#).*)|(?: *[\w\-]+(?::[\w\-]+)?(?:[#.[][^\n]+)?(::).*)|(?:  +([\["]).*)|(\ \ .*))$/gmi
  , element1 = /((?:\ \ )+)? ?([\w\-]+(?::[\w\-]+)?)([#\.\[][^\n]*)?::(?: ({{?|[^\n]+))?/gmi
  , directive1 = /((?:\ \ )+)? ?@([\w][\w\-]+)(?::: ?([^\n]+)?)?/gmi
  , attribute1 = /((?:\ \ )+)\[(\w[\w-]*(?::\w[\w-]*)?)(?:=([^\n]+))?\]/
  , preformattedClose = /[ \t]*}}?[ \t]*/
  , id1 = /((?:\ \ )+)?#(#)?([\w\-]+)(?: ([\["]))?/gmi
  , idnt1 = /^(\ \ )+/
  , text1 = /^((?:\ \ )+)([^ \n][^\n]*)$/i
  , paramsRe = /(?:(#|\.)([^#.\[\n]+)|(?:\[(\w[\w\-]*(?::\w[\w\-]*)?)(?:=([^\n\]]+))?\]))/g
  , refRe = /#\[([\w\-]+)\]/g
  , voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wrb']);

let m1: RegExpExecArray | null
  , m2: RegExpExecArray | null;


function escape(value: string): string {
  return value.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}

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
    refs: [],
  };
}

/**
 * Parses a longform document into a object containing the root and fragments
 * in the output format.
 *
 * @param {string} doc - The longform document to parse.
 * @returns {ParsedResult}
 */
export function longform(doc: string, debug: (...d: unknown[]) => void = () => {}): ParsedResult {
  let skipping: boolean = false
    , textIndent: number | null = null
    , verbatimSerialize: boolean = true
    , verbatimIndent: number | null = null
    , verbatimFirst: boolean = false
    , element: WorkingElement = makeElement()
    , chunk: WorkingChunk | null = makeChunk()
    , fragment: WorkingFragment = makeFragment()
    // the root fragment
    , root: WorkingFragment | null = null
    // ids of claimed fragments
  const claimed: Set<string> = new Set()
    // parsed fragments
    , parsed: Map<string, WorkingFragment> = new Map()
    , output: ParsedResult = Object.create(null);

  output.fragments = Object.create(null);
  
  
  /**
   * Closes any current in progress element definition
   * and creates a new working element.
   */
  function applyIndent(targetIndent: number) {
    if (element.tag != null) {
      const root = fragment.type === 'range'
        ? targetIndent < 2
        : fragment.html === ''
      ;

      fragment.html += `<${element.tag}`

      if (root) {
        if (fragment.type === 'root') {
          fragment.html += ` data-lf-root`;
        } else if (fragment.type === 'bare' || fragment.type === 'range') {
          fragment.html += ` data-lf="${fragment.id}"`;
        }
      }

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
          root = fragment;
        } else {
          parsed.set(fragment.id, fragment);
        }

        fragment = makeFragment();
      }
    } else {
      element = makeElement(targetIndent)
    }
  }

  while ((m1 = sniffTestRe.exec(doc))) {
    if (m1[1] === '--') {
      continue;
    }

    // If this is a script tag or preformatted block
    // we want to retain the intended formatting less
    // the indent. Preformatting can apply to any element
    // by ending the declaration with `:: {`.
    if (verbatimIndent != null) {
      // inside a script or preformatted block
      idnt1.lastIndex = 0;
      m2 = idnt1.exec(m1[0]);
      const indent = m2 == null
        ? null
        : m2[0].length / 2;

      if (m2 == null || indent as number <= verbatimIndent) {
        fragment.html += '\n';
        debug(indent, '}', m2?.[0]);

        applyIndent(indent);
        verbatimIndent = null;
        verbatimFirst = false;
        textIndent = indent;

        if (preformattedClose.test(m1[0])) {
          continue;
        }
      } else {
        const line = m1[0].replace('  '.repeat(verbatimIndent + 1), '');
        debug(indent, '{', line);

        if (element.tag != null) {
          applyIndent(indent as number);
        }

        if (verbatimFirst) {
          verbatimFirst = false;
        } else {
          fragment.html += '\n';
        }
        
        if (verbatimSerialize) {
          fragment.html += escape(line);
        } else {
          fragment.html += line;
        }

        continue;
      }
    }

    if (m1[0].trim() === '') {
      continue;
    }

    switch (m1[2] ?? m1[3] ?? m1[4]) {
      // deno-lint-ignore no-fallthrough
      case '#': {
        id1.lastIndex = 0;
        m2 = id1.exec(m1[0]);

        if (m2 != null) {
          const indent = (m2[1]?.length ?? 0) / 2;

          if (element.tag != null || textIndent != null) {
            applyIndent(indent);
            textIndent = null;
          }

          console.log(m1)
          debug(indent, 'id', m2[2], m2[3], m2[4]);
          console.log('M2[4]', `"${m2[4]}`)

          fragment.id = m2[3];

          if (indent === 0) {
            if (m2[4] == '[') {
              fragment.type = 'range';
            } else if (m2[4] === '"') {
              fragment.type = 'text';
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
              , pr = m2[4] === '{' || m2[4] === '{{'
          const tx = pr ? null : m2[4]

          debug(indent, 'e', tg, pr, tx);

          if (
            element.tag != null ||
            element.indent > indent
          ) {
            applyIndent(indent);
          }

          element.indent = indent;
          element.tag = tg;

          textIndent = null;
          
          if (indent === 0 && fragment.id == null) {
            if (root != null) {
              skipping = true;
            } else {
              fragment.type = 'root';
              root = fragment;
            }
          }
          
          if (ar != null) {
            debug(indent, 'a', ar);
            while ((m2 = paramsRe.exec(ar))) {
              if (m2[1] === '#') {
                element.id = m2[2];
              } else if (m2[1] === '.') {
                if (element.class == null) {
                  element.class = m2[2];
                } else {
                  element.class += ' ' + m2[2];
                }
              } else {
                if (m2[3] === 'id') {
                  if (element.id == null) {
                    element.id = m2[4];
                  }
                } else if (m2[3] === 'class') {
                  if (element.class == null) {
                    element.class = m2[4]
                  } else {
                    element.class += ' ' + m2[4]
                  }
                } else {
                  element.attrs[m2[3]] = m2[4];
                }
              }
            }
          }

          if (!pr && tx != null) {
            element.text = tx;
          } else if (pr) {
            verbatimFirst = true;
            verbatimIndent = indent;
            verbatimSerialize = m2[4] === '{';
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

          if (element.tag != null || textIndent != null) {
            applyIndent(indent);
          }

          debug(indent, 'd', m2[2], m2[3]);

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
        m2 = text1.exec(m1[0]) as RegExpExecArray;

        if (m2 == null) {
          break;
        }
        const indent = m2[1].length / 2;
        const tx = m2[2].trim();


        debug(indent, 't', m2[2]);

        if (element.tag != null) {
          applyIndent(indent);

          fragment.html += tx;
        } else {
          fragment.html += ' ' + tx;
        }

        textIndent = indent;

        while ((m2 = refRe.exec(tx))) {
          const start = fragment.html.length + m2.index - tx.length;

          fragment.refs.push({
            id: m2[1],
            start,
            end: start + m2[0].length,
          });
        }

        break;
      }
    }
  }

  applyIndent(0);

  const arr = Array.from(parsed.values());

  function flatten(fragment: WorkingFragment): WorkingFragment {
    // work backwards so we don't change the html string length
    // for the later replacements
    for (let j = fragment.refs.length - 1; j >= 0; j--) {
      const ref = fragment.refs[j];

      if (claimed.has(ref.id) || !parsed.has(ref.id)) {
        fragment.html = fragment.html.slice(0, ref.start)
          + fragment.html.slice(ref.end)
      } else {
        const child = flatten(parsed.get(ref.id));

        fragment.html = fragment.html.slice(0, ref.start)
          + child.html
          + fragment.html.slice(ref.end);

        if (child.type === 'embed') {
          claimed.add(child.id)
        }
      }
    }

    fragment.refs = [];

    return fragment;
  }

  for (let i = 0; i < parsed.size + 1; i++) {
    let fragment: WorkingFragment;
    
    if (i === 0 && root == null) {
      continue;
    } else if (i === 0) {
      fragment = root;
    } else {
      fragment = arr[i - 1];
    }

    if (fragment.refs.length === 0) {
      continue;
    }

    flatten(fragment)
  }

  if (root?.html != null) {
    output.root = root.html;
    output.selector = `[data-lf-root]`;
  }

  for (let i = 0; i < arr.length; i++) {
    let selector: string;
    const fragment = arr[i];

    if (fragment == null || claimed.has(fragment.id)) {
      continue;
    }

    if (fragment.type === 'embed') {
      selector = `[id=${fragment.id}]`;
    } else if (fragment.type === 'bare') {
      selector = `[data-lf=${fragment.id}]`;
    } else if (fragment.type === 'range') {
      selector = `[data-lf=${fragment.id}]`;
    }

    output.fragments[fragment.id] = {
      id: fragment.id,
      selector,
      type: fragment.type as 'embed' | 'bare' | 'range',
      html: fragment.html,
    };
  }

  return output;
}


const templateRe = /#(#)?{([\w][\w-_]*)}/g

export function template(fragment: string, fragments: Record<string, string>, args: Record<string, string | number> = {}) {
  const lf = fragment.replace(templateRe, (_match, embed, param) => {
    if (embed) {
      const fragment = fragments[param];

      if (fragment == null) return '';

      return fragment;
    }
    
    return args[param] != null ? escape(args[param].toString()) : '';
  });

  return longform(lf);
}
