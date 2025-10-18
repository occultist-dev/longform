

// w = leading whitespace
// d = Directive identifier, a = Inline args
// i = Element id, b = Bare identifer
// e = Element name, a = Element args, t = Inline text
// a = Attribute name, v = Attribute value
// l = Loop target, v = Declared var
// t = Text
const wsp = `^(?<w>[ \\t]*)`;

export const directiveReStr =
  `(${wsp}` +
  `(\\@(?<d>[\\w\\d\\-_]+))(::)?` +
  `(\\s+| (?<a>.*)+)?$` +
  `)`;

export const idReStr =
  `(${wsp}` +
  `(#(?<b>#)?(?<i>[\\w\\d\\-_:,.]+))` +
  `[ \\t]*$)`;

export const elementReStr = 
  `(${wsp}` +
  `(?<e>[\\w\\d\\-]+)` +
  `(?<a>[#.\\[].*)?::` +
  `(\\s+| (?<t>.*)+)?$)`;

export const attributeReStr = 
  `(${wsp}` +
  `\\[(?<a>[\\w\\d\\-]+)` +
  `(=(` +
  `('(?<v>["\\w\\d\\- ]+)')` +
  `|("(?<v>['\\w\\d\\- ]+)")` +
  `|(?<v>[\\w\\d\\- ]+)` +
  `))?\\]` +
  `)`;

export const forOfReStr =
  `(${wsp}` +
  `for\\s+(?<v>\\w[\\w\\d\\-_]*)\\s+` +
  `of\\s+(?<l>\\w[\\w\\d\\-_]*)` +
  `::(\\s+| (?<t>.*)+)?$)`;

export const textReStr =
  `(^(?<w>  [ \\t]*)` +
  `(?<t>.*)$)`;

export const allowedElementsReStr =
  `(?<e>\\w[\\w\\d\\-_]*<?<g>\\*>?)(\\[(?<a>\\w[\\w\\d\\-_ \\*]*)\\])?`
;
export const allowedAttributesReStr =
  `(?<a>\\w[\\w\\d\\-_]*)(?<g>\\*)?`

export const lfReg = new RegExp(`${directiveReStr}|${idReStr}|${elementReStr}|${attributeReStr}|${textReStr}`, 'gm');
export const allowedElementsRe = new RegExp(allowedElementsReStr, 'gm');
export const allowedAttributesRe = new RegExp(allowedAttributesReStr, 'gm');
