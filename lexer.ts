import { lfReg } from "./reg.ts";

export type DirectiveMatch = ['d', directive: string, args: string | null];
export type IDMatch = ['i', id: string, bear: boolean];
export type ElementMatch = ['e', element: string, args: string | null, text: string | null];
export type AttrMatch = ['a', attr: string, value: string | null]; 
export type TextMatch = ['t', text: string];
export type LexMatch =
  | DirectiveMatch
  | IDMatch
  | ElementMatch
  | AttrMatch
  | TextMatch
;

export type LexHandler = (ident: number, match: LexMatch) => void;

let ident: number = 0;
const match: LexMatch = new Array(4) as DirectiveMatch;

export function lexer(longform: string, handler: LexHandler) {
  let res: RegExpExecArray | null;

  while ((res = lfReg.exec(longform))) {
    if (res?.groups == null) {
      continue;
    }

    ident = res.groups.w.length / 2;
    
    if (res.groups.d != null) {
      match[0] = 'd';
      match[1] = res.groups.d;
      match[2] = res.groups.a ?? null;
    } else if (res.groups.i != null) {
      match[0] = 'i';
      match[1] = res.groups.i;
      match[2] = res.groups.b != null;
    } else if (res.groups.e != null) {
      match[0] = 'e';
      match[1] = res.groups.e;
      match[2] = res.groups.v;
    } else if (res.groups.a != null) {
      match[0] = 'a';
      match[1] = res.groups.a;
      match[2] = res.groups.v;
    } else {
      match[0] = 't';
      match[1] = res.groups.t;
    }

    handler(ident, match);
  }
}
