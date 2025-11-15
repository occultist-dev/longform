const sniffTestRe = /^(?:(?:(--).*)|(?: *(@|#).*)|(?: *[\w\-]+(?::[\w\-]+)?(?:[#.[][^\n]+)?(::).*)|(?:  +([\["]).*)|(\ \ .*))$/gmi, element1 = /((?:\ \ )+)? ?([\w\-]+(?::[\w\-]+)?)([#\.\[][^\n]*)?::(?: ({{?|[^\n]+))?/gmi, directive1 = /((?:\ \ )+)? ?@([\w][\w\-]+)(?::: ?([^\n]+)?)?/gmi, attribute1 = /((?:\ \ )+)\[(\w[\w-]*(?::\w[\w-]*)?)(?:=([^\n]+))?\]/, preformattedClose = /[ \t]*}}?[ \t]*/, id1 = /((?:\ \ )+)?#(#)?([\w\-]+)(?: ([\["]))?/gmi, idnt1 = /^(\ \ )+/, text1 = /^((?:\ \ )+)([^ \n][^\n]*)$/i, paramsRe = /(?:(#|\.)([^#.\[\n]+)|(?:\[(\w[\w\-]*(?::\w[\w\-]*)?)(?:=([^\n\]]+))?\]))/g, refRe = /#\[([\w\-]+)\]/g, escapeRe = /([&<>"'#\[\]{}])/g, templateLinesRe = /^(\ \ )?([^\n]*)$/gmi, voids = /* @__PURE__ */ new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wrb"]);
let m1, m2, m3;
const entities = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;"
  //  '#': '&num;',
  //  '[': '&lbrak;',
  //  ']': '&rbrak;',
  //  '{': '&rbrace;',
  //  '}': '&lbrace;',
};
function escape(value) {
  return value.replace(escapeRe, (match) => {
    var _a;
    return (_a = entities[match]) != null ? _a : match;
  });
}
function makeElement(indent = 0) {
  return {
    indent,
    html: "",
    attrs: {}
  };
}
function makeChunk(type = "parsed") {
  return {
    type,
    html: "",
    els: []
  };
}
function makeFragment(type = "bare") {
  return {
    type,
    html: "",
    template: false,
    els: [],
    chunks: [],
    refs: []
  };
}
export function longform(doc, debug = () => {
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  let skipping = false, textIndent = null, verbatimSerialize = true, verbatimIndent = null, verbatimFirst = false, element = makeElement(), chunk = makeChunk(), fragment = makeFragment(), root = null;
  const claimed = /* @__PURE__ */ new Set(), parsed = /* @__PURE__ */ new Map(), output = /* @__PURE__ */ Object.create(null);
  output.fragments = /* @__PURE__ */ Object.create(null);
  output.templates = /* @__PURE__ */ Object.create(null);
  function applyIndent(targetIndent) {
    if (element.tag != null) {
      const root2 = fragment.type === "range" ? targetIndent < 2 : fragment.html === "";
      fragment.html += `<${element.tag}`;
      if (root2) {
        if (fragment.type === "root") {
          fragment.html += ` data-lf-root`;
        } else if (fragment.type === "bare" || fragment.type === "range") {
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
          fragment.html += " " + attr[0];
        } else {
          fragment.html += ` ${attr[0]}="${attr[1]}"`;
        }
      }
      fragment.html += ">";
      if (!voids.has(element.tag) && element.text != null) {
        fragment.html += element.text;
      }
      if (!voids.has(element.tag)) {
        fragment.els.push(element);
      }
    }
    if (targetIndent <= element.indent) {
      element = makeElement(targetIndent);
      while (fragment.els.length !== 0 && (targetIndent == null || fragment.els[fragment.els.length - 1].indent !== targetIndent - 1)) {
        const element2 = fragment.els.pop();
        fragment.html += `</${element2 == null ? void 0 : element2.tag}>`;
      }
      if (targetIndent === 0) {
        debug(0, "<", fragment.type, fragment.id);
        if (fragment.template) {
          output.templates[fragment.id] = fragment.html;
        } else if (fragment.type === "root") {
          root = fragment;
        } else {
          parsed.set(fragment.id, fragment);
        }
        fragment = makeFragment();
      }
    } else {
      element = makeElement(targetIndent);
    }
  }
  while (m1 = sniffTestRe.exec(doc)) {
    if (m1[1] === "--") {
      continue;
    } else if (fragment.template) {
      fragment.html += m1[0];
    }
    if (verbatimIndent != null) {
      idnt1.lastIndex = 0;
      m2 = idnt1.exec(m1[0]);
      const indent = m2 == null ? null : m2[0].length / 2;
      if (m2 == null || indent <= verbatimIndent) {
        fragment.html += "\n";
        debug(indent, "}", m2 == null ? void 0 : m2[0]);
        applyIndent(indent);
        verbatimIndent = null;
        verbatimFirst = false;
        textIndent = indent;
        if (preformattedClose.test(m1[0])) {
          continue;
        }
      } else {
        const line = m1[0].replace("  ".repeat(verbatimIndent + 1), "");
        debug(indent, "{", line);
        if (element.tag != null) {
          applyIndent(indent);
        }
        if (verbatimFirst) {
          verbatimFirst = false;
        } else {
          fragment.html += "\n";
        }
        if (verbatimSerialize) {
          fragment.html += escape(line);
        } else {
          fragment.html += line;
        }
        continue;
      }
    }
    if (m1[0].trim() === "") {
      continue;
    }
    switch ((_b = (_a = m1[2]) != null ? _a : m1[3]) != null ? _b : m1[4]) {
      // deno-lint-ignore no-fallthrough
      case "#": {
        id1.lastIndex = 0;
        m2 = id1.exec(m1[0]);
        if (m2 != null) {
          const indent = ((_d = (_c = m2[1]) == null ? void 0 : _c.length) != null ? _d : 0) / 2;
          if (element.tag != null || textIndent != null) {
            applyIndent(indent);
            textIndent = null;
          }
          debug(indent, "id", m2[2], m2[3], m2[4]);
          fragment.id = m2[3];
          if (indent === 0) {
            if (m2[4] == "[") {
              fragment.type = "range";
            } else if (m2[4] === '"') {
              fragment.type = "text";
            } else if (m2[2] != null) {
              fragment.type = "bare";
            } else {
              fragment.type = "embed";
              element.id = fragment.id;
            }
          }
          break;
        }
      }
      case "@":
      case "[":
      // deno-lint-ignore no-fallthrough
      case "::": {
        element1.lastIndex = 0;
        m2 = ((_e = m1[2]) != null ? _e : m1[4] != null) ? null : element1.exec(m1[0]);
        if (m2 != null) {
          const indent = ((_g = (_f = m2[1]) == null ? void 0 : _f.length) != null ? _g : 0) / 2, tg = m2[2], ar = m2[3], pr = m2[4] === "{" || m2[4] === "{{";
          const tx = pr ? null : m2[4];
          debug(indent, "e", tg, pr, tx);
          if (element.tag != null || element.indent > indent) {
            applyIndent(indent);
          }
          element.indent = indent;
          element.tag = tg;
          textIndent = null;
          if (indent === 0 && fragment.id == null) {
            if (root != null) {
              skipping = true;
            } else {
              fragment.type = "root";
              root = fragment;
            }
          }
          if (ar != null) {
            debug(indent, "a", ar);
            while (m2 = paramsRe.exec(ar)) {
              if (m2[1] === "#") {
                element.id = m2[2];
              } else if (m2[1] === ".") {
                if (element.class == null) {
                  element.class = m2[2];
                } else {
                  element.class += " " + m2[2];
                }
              } else {
                if (m2[3] === "id") {
                  if (element.id == null) {
                    element.id = m2[4];
                  }
                } else if (m2[3] === "class") {
                  if (element.class == null) {
                    element.class = m2[4];
                  } else {
                    element.class += " " + m2[4];
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
            verbatimSerialize = m2[4] === "{";
          }
          break;
        }
        attribute1.lastIndex = 0;
        m2 = m1[2] != null ? null : attribute1.exec(m1[0]);
        if (m2 != null && element.tag != null) {
          debug("a", m2[2], m2[3]);
          if (m2[2] === "id") {
            if (element.id == null) {
              element.id = m2[3].trim();
            }
          } else if (m2[2] === "class") {
            if (element.class != null) {
              element.class += " " + m2[3].trim();
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
        m2 = m1[3] != null ? null : directive1.exec(m1[0]);
        if (m2 != null) {
          const indent = ((_i = (_h = m2[1]) == null ? void 0 : _h.length) != null ? _i : 0) / 2;
          if (element.tag != null || textIndent != null) {
            applyIndent(indent);
          }
          debug(indent, "d", m2[2], m2[3]);
          switch (m2[2]) {
            case "doctype": {
              fragment.html += `<!doctype ${(_j = m2[3]) != null ? _j : "html"}>`;
              break;
            }
            case "xml": {
              fragment.html += `<?xml ${(_k = m2[3]) != null ? _k : 'version="1.0" encoding="UTF-8"'}?>`;
              break;
            }
            case "template": {
              let indented = false;
              fragment.template = indent === 0;
              templateLinesRe.lastIndex = sniffTestRe.lastIndex;
              while (m2 = templateLinesRe.exec(doc)) {
                if (m2[1] == null && !indented) {
                  id1.lastIndex = 0;
                  m3 = id1.exec(m2[0]);
                  fragment.id = m3[3];
                  fragment.html += m2[0];
                } else if (m2[1] == null && indented) {
                  sniffTestRe.lastIndex = templateLinesRe.lastIndex - 1;
                  applyIndent(0);
                  break;
                } else {
                  fragment.html += "\n" + m2[0];
                }
                indented = true;
              }
            }
          }
          break;
        }
      }
      default: {
        m2 = text1.exec(m1[0]);
        if (m2 == null) {
          break;
        }
        const indent = m2[1].length / 2;
        const tx = m2[2].trim();
        debug(indent, "t", m2[2]);
        if (element.tag != null) {
          applyIndent(indent);
          fragment.html += tx;
        } else if (fragment.type === "text" && fragment.html === "") {
          fragment.html += tx;
        } else {
          fragment.html += " " + tx;
        }
        textIndent = indent;
        while (m2 = refRe.exec(tx)) {
          const start = fragment.html.length + m2.index - tx.length;
          fragment.refs.push({
            id: m2[1],
            start,
            end: start + m2[0].length
          });
        }
        break;
      }
    }
  }
  applyIndent(0);
  const arr = Array.from(parsed.values());
  function flatten(fragment2) {
    for (let j = fragment2.refs.length - 1; j >= 0; j--) {
      const ref = fragment2.refs[j];
      if (claimed.has(ref.id) || !parsed.has(ref.id)) {
        fragment2.html = fragment2.html.slice(0, ref.start) + fragment2.html.slice(ref.end);
      } else {
        const child = flatten(parsed.get(ref.id));
        fragment2.html = fragment2.html.slice(0, ref.start) + child.html + fragment2.html.slice(ref.end);
        if (child.type === "embed") {
          claimed.add(child.id);
        }
      }
    }
    fragment2.refs = [];
    return fragment2;
  }
  for (let i = 0; i < parsed.size + 1; i++) {
    let fragment2;
    if (i === 0 && root == null) {
      continue;
    } else if (i === 0) {
      fragment2 = root;
    } else {
      fragment2 = arr[i - 1];
    }
    if (fragment2.refs.length === 0) {
      continue;
    }
    flatten(fragment2);
  }
  if ((root == null ? void 0 : root.html) != null) {
    output.root = root.html;
    output.selector = `[data-lf-root]`;
  }
  for (let i = 0; i < arr.length; i++) {
    let selector;
    const fragment2 = arr[i];
    if (fragment2 == null || claimed.has(fragment2.id)) {
      continue;
    }
    if (fragment2.type === "embed") {
      selector = `[id=${fragment2.id}]`;
    } else if (fragment2.type === "bare") {
      selector = `[data-lf=${fragment2.id}]`;
    } else if (fragment2.type === "range") {
      selector = `[data-lf=${fragment2.id}]`;
    }
    output.fragments[fragment2.id] = {
      id: fragment2.id,
      selector,
      type: fragment2.type,
      html: fragment2.html
    };
  }
  return output;
}
const templateRe = /(?:#{([\w][\w\-_]*)})|(?:#\[([\w][\w\-_]+)\])/g;
export function processTemplate(template, args, getFragment) {
  var _a, _b;
  const lf = template.replace(templateRe, (_match, param, ref) => {
    if (ref != null) {
      const fragment = getFragment(ref);
      if (fragment == null) return "";
      return fragment;
    }
    return args[param] != null ? escape(args[param].toString()) : "";
  });
  return (_b = (_a = Object.values(longform(lf).fragments)[0]) == null ? void 0 : _a.html) != null ? _b : null;
}
//# sourceMappingURL=longform.js.map
