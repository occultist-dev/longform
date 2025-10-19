// w = leading whitespace
// d = Directive identifier, ia = Inline args
// i = Element id, b = Bare identifer
// e = Element name, ea = Element args, it = Inline text
// a = Attribute name, v# = Attribute value
// l = Loop target, dv = Declared var
// t = Text
const wsp = `(?<w>[ \\t]*)`;

export const directiveReStr =
  `(\\@(?<d>[\\w\\d\\-_]+))` +
  `(\\s*|:: (?<ia>.*)+)?`;

export const idReStr =
  `(#(?<b>#)?(?<i>[\\w\\d\\-_:,.]+))` +
  `[ \\t]*`;

export const elementReStr = 
  `(?<e>[\\w\\d\\-]+)` +
  `(?<ea>[#.\\[].*)?::` +
  `( (?<it>.+)|\\s*)`;

export const attributeReStr = 
  `\\[(?<a>[\\w\\d\\-]+)` +
  `(=(` +
  `('(?<v1>["\\w\\d\\- ]+)')` +
  `|("(?<v2>['\\w\\d\\- ]+)")` +
  `|(?<v3>[\\w\\d\\- ]+)` +
  `))?\\]`;

export const forOfReStr =
  `for\\s+(?<dv>\\w[\\w\\d\\-_]*)\\s+` +
  `of\\s+(?<l>\\w[\\w\\d\\-_]*)` +
  `::\\s*`;

export const textReStr =
  `(?<t>.*)`;

export const allowedElementsReStr =
  `(?<e>\\w[\\w\\d\\-_]*)(\\[(?<a>\\w[\\w\\d\\-_ ]*)\\])?`
;
export const allowedAttributesReStr =
  `(?<a>\\w[\\w\\d\\-_]*)`

export const varReStr =
  `(?<v>\\w[\\w\\d\\-_]*)`;

export const lfReg = new RegExp(`^${wsp}(${directiveReStr}|${idReStr}|${elementReStr}|${attributeReStr}|${textReStr})$`, 'gm');
export const allowedElementsRe = new RegExp(allowedElementsReStr, 'gm');
export const allowedAttributesRe = new RegExp(allowedAttributesReStr, 'gm');
export const varRe = new RegExp(varReStr, 'gm');