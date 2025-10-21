// w = leading whitespace
// d = Directive indentifier, ia = Inline args
// i = Element id, b = Bare indentifier
// e = Element name, ea = Element args, it = Inline text
// a = Attribute name, v# = Attribute value
// l = Loop target, dv = Declared var
// t = Text
const wsp = `(?<w>[ \\t]+)?`;

export const directiveReStr =
  `\\@(?<d>\\w[\\w\\d\\-_]+)((::)? ?(?<ia>.+)?)`;

export const idReStr =
  `(#(?<b>#)?(?<i>[\\w\\d\\-_:,.]+))` +
  `[ \\t]*`;

export const elementReStr = 
  `(?<e>[\\w\\d\\-]+)` +
  `(?<ea>[#.\\[].*)?::` +
  `( (?<it>.+)| *)`;

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
  `::\\[ \\t]*`;

export const textReStr =
  `(?<t>.+)`;

export const allowedElementsReStr =
  `(?<e>\\w[\\w\\d\\-_]*)(\\[(?<a>\\w[\\w\\d\\-_ ]*)\\])?`
;
export const allowedAttributesReStr =
  `(?<a>\\w[\\w\\d\\-_]*)`

export const varReStr =
  `(?<v>\\w[\\w\\d\\-_]*)`;

export const paramsReStr =
  `(#(?<i>[^.[]+))|(\\.(?<c>[^#\\.[]+))|((\\[(?<a>[^.=\\]]+))(=(?<v>[^\\]]+))?)`

export const lfReg = new RegExp(`${wsp}((${directiveReStr})|(${idReStr})|(${elementReStr})|(${attributeReStr})|(${textReStr}))`, 'gi');
export const allowedElementsRe = new RegExp(allowedElementsReStr, 'gi');
export const allowedAttributesRe = new RegExp(allowedAttributesReStr, 'gi');
export const varRe = new RegExp(varReStr, 'gi');
export const paramsRe = new RegExp(paramsReStr, 'gi');
