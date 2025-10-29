// w = leading whitespace
// d = Directive indentifier, ia = Inline args
// i = Element id, b = Bare indentifier
// r = Range id
// re = Range end
// e = Element name, ea = Element args, it = Inline text, pr = Preformatted
// a = Attribute name, v# = Attribute value
// l = Loop target, dv = Declared var
// t = Text

export const wspReStr = `(?<w>[  ]+)?`;

export const directiveReStr =
  `\\@(?<d>\\w[\\w\\d\\-_]+)(:: (?<ia>[^\\n]+)?)?`;

export const idReStr =
  `(#(?<b>#)?(?<i>[\\w\\d\\-_:,.]+))` +
  `[ \\t]*`;

export const rangeStartStr =
  `^#(?<r>[a-z][\\w-_]*) +\\[`;

export const rangeEndStr =
  `^(?<re>\\])`;

export const elementReStr = 
  `(?<e>[\\w\\-]+(:[\\w\\-]+)?)` +
  `(?<ea>[#.\\[].*)?::` +
  `( (?<pr>\\{[ \\t]*)| (?<it>[^\\n]+))?`;

export const attributeReStr = 
  `\\[(?<a>[\\w\\-]+(:[\\w\\-]+)?)` +
  `(=(` +
  `('(?<v1>[^']+)')` +
  `|("(?<v2>[^"]+)")` +
  `|(?<v3>[^\\]]+)` +
  `))?\\]`;

export const forOfReStr =
  `for\\s+(?<dv>\\w[\\w\\d\\-_]*)\\s+` +
  `of\\s+(?<l>\\w[\\w\\d\\-_]*)` +
  `::\\[ \\t]*`;

export const textReStr =
  `^(?<t>[^ \\n\\t]+)$`;

export const allowedElementsReStr =
  `(?<e>\\w[\\w\\d\\-_]*)(\\[(?<a>\\w[\\w\\d\\-_ ]*)\\])?`
;
export const allowedAttributesReStr =
  `(?<a>\\w[\\w\\d\\-_]*)`

export const varReStr =
  `(?<v>\\w[\\w\\d\\-_]*)`;

export const paramsReStr =
  `(#(?<i>[^.[]+))|(\\.(?<c>[^#\\.[]+))|((\\[(?<a>[^.=\\]]+))(=(?<v>[^\\]]+))?)`

export const lfReg = new RegExp(
  `((${rangeStartStr}|${rangeEndStr})` +
  `|(${wspReStr}(${directiveReStr}|${idReStr}|${elementReStr}|${attributeReStr}|${textReStr})))`,
  'gmi');

export const allowedElementsRe = new RegExp(allowedElementsReStr, 'gi');
export const allowedAttributesRe = new RegExp(allowedAttributesReStr, 'gi');
export const varRe = new RegExp(varReStr, 'gi');
export const paramsRe = new RegExp(paramsReStr, 'gi');
