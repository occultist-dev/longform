

// w = leading whitespace
// d = Directive identifier, a = Inline args
// i = Element id, b = Bare identifer
// e = Element name, a = Element args, t = Inline text
// a = Attribute name, v = Attribute value
// t = Text
const wsp = `^(?<w>[ \\t]*)`;

export const directiveReStr =
  `(${wsp}` +
  `(\\@(?<d>[\\w\\d\\-_]+))(::)?` +
  `(\s+| (?<a>.*)+)?$` +
  `)`;

export const idReStr =
  `(${wsp}` +
  `(#(?<b>#)?(?<i>[\\w\\d\\-_:,.]+))` +
  `[ \\t]*$)`;

export const elementReStr = 
  `(${wsp}` +
  `(?<e>[\\w\\d\\-]+)` +
  `(?<a>[#.\\[].*)?::` +
  `(\s+| (?<t>.*)+)?$)`;

export const attributeReStr = 
  `(${wsp}` +
  `\\[(?<a>[\\w\\d\\-]+)` +
  `(=(` +
  `('(?<v>["\\w\\d\\- ]+)')` +
  `|("(?<v>['\\w\\d\\- ]+)")` +
  `|(?<v>[\\w\\d\\- ]+)` +
  `))?\\]` +
  `)`;

export const textReStr =
  `(^(?<w>  [ \\t]*)` +
  `(?<t>.*)$)`;

export const lfReg = new RegExp(
  `${directiveReStr}|${idReStr}|${elementReStr}|${attributeReStr}|${textReStr}`,
  'gm',
);