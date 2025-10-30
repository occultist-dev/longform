const sniffTestRe = /^(?:(?:(--).*)|(?: *(@|#).*)|(?: *[\w\-]+(?::[\w\-]+)?(?:[#.[][^\n]+)?(::).*)|(?:  +(\[).*)|(\ \ .+))$/gmi, element1 = /((?:\ \ )+)? ?([\w\-]+(?::[\w\-]+)?)([#\.\[][^\n]*)?::(?: ({|[^\n]+))?/gmi, directive1 = /((?:\ \ )+)? ?@([\w][\w\-]+)(?::: ?([^\n]+)?)?/gmi, attribute1 = /((?:\ \ )+)\[(\w[\w-]*(?::\w[\w-]*)?)(?:=([^\n]+))?\]/, preformattedClose = /[ \t]*}[ \t]*/, id1 = /((?:\ \ )+)?#(#)?([\w\-]+)( \[)?/gmi, idnt1 = /^(\ \ )+/, text1 = /^((?:\ \ )+)([^ \n][^\n]*)$/i, paramsRe = /(?:(#|\.)([^#.\[\n]+)|(?:\[(\w[\w\-]*(?::\w[\w\-]*)?)(?:=([^\n\]]+))?\]))/g, refRe = /#\[([\w\-]+)\]/g, voids = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wrb"
]);
let m1, m2;
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
    els: [],
    chunks: [],
    refs: []
  };
}
export function longform(doc, debug = () => {
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  let skipping = false, textIndent = null, verbatimIndent = null, verbatimFirst = false, element = makeElement(), chunk = makeChunk(), fragment = makeFragment(), root = null;
  const claimed = /* @__PURE__ */ new Set(), parsed = /* @__PURE__ */ new Map(), output = /* @__PURE__ */ Object.create(null);
  output.fragments = /* @__PURE__ */ Object.create(null);
  function applyIndent(targetIndent) {
    if (element.tag != null) {
      fragment.html += `<${element.tag}`;
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
        if (fragment.type === "root") {
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
    }
    if (verbatimIndent != null) {
      idnt1.lastIndex = 0;
      m2 = idnt1.exec(m1[0]);
      const indent = m2 == null ? null : m2[0].length / 2;
      if (m2 == null || indent <= verbatimIndent) {
        fragment.html += "\n";
        debug(indent, "}", m2 == null ? void 0 : m2[0]);
        applyIndent(verbatimIndent);
        verbatimIndent = null;
        verbatimFirst = false;
        if (preformattedClose.test(m1[0])) {
          continue;
        }
      } else {
        const line = m1[0].replace("  ".repeat(verbatimIndent + 1), "");
        debug(indent, "{", line);
        if (element.tag != null) {
          applyIndent(indent);
        }
        if (!verbatimFirst) {
          fragment.html += "\\n";
        } else {
          verbatimFirst = true;
        }
        fragment.html += line;
        continue;
      }
    }
    switch ((_b = (_a = m1[2]) != null ? _a : m1[3]) != null ? _b : m1[4]) {
      // deno-lint-ignore no-fallthrough
      case "#": {
        id1.lastIndex = 0;
        m2 = id1.exec(m1[0]);
        if (m2 != null) {
          const indent = ((_d = (_c = m2[1]) == null ? void 0 : _c.length) != null ? _d : 0) / 2;
          debug(indent, "id", m2[2], m2[3], m2[4]);
          if (element.tag != null || textIndent != null) {
            applyIndent(indent);
          }
          textIndent = null;
          fragment.id = m2[3];
          if (indent === 0) {
            if (m2[4] != null) {
              fragment.type = "range";
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
          const indent = ((_g = (_f = m2[1]) == null ? void 0 : _f.length) != null ? _g : 0) / 2, tg = m2[2], ar = m2[3], pr = m2[4] === "{";
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
          textIndent = indent;
          fragment.html += tx;
        } else {
          fragment.html += " " + tx;
        }
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
      if (claimed.has(ref.id)) {
        fragment2.html = fragment2.html.slice(0, ref.start) + fragment2.html.slice(ref.start + ref.end);
      }
      if (parsed.has(ref.id)) {
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
  if (root.html != null) {
    output.root = root.html;
  }
  for (let i = 0; i < arr.length; i++) {
    const fragment2 = arr[i];
    if (fragment2 == null || claimed.has(fragment2.id)) {
      continue;
    }
    output.fragments[fragment2.id] = {
      id: fragment2.id,
      type: fragment2.type,
      html: fragment2.html
    };
  }
  return output;
}
//# sourceMappingURL=longform.js.map
