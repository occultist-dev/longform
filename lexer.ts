import { lfReg } from "./reg.ts";

export type DirectiveMatch = ['d', directive: string, args: string | null];
export type IDMatch = ['i', id: string, bear: boolean];
export type RangeStartMatch = ['r', id: string];
export type RangeEndMatch = ['re'];
export type ElementMatch = ['e', element: string, args: string | null, text: string | null];
export type PreformatMatch = ['p', element: string, args: string];
export type AttrMatch = ['a', attr: string, value: string | null]; 
export type LoopMatch = ['l', list: string, def: string];
export type TextMatch = ['t', text: string];
export type LexMatch =
  | DirectiveMatch
  | IDMatch
  | RangeStartMatch
  | RangeEndMatch
  | ElementMatch
  | PreformatMatch
  | AttrMatch
  | LoopMatch
  | TextMatch
;

export type LexHandler = (indent: number, match: LexMatch) => void;

let indent: number = 0;
const match: LexMatch = new Array(4) as DirectiveMatch;

export function lexer(longform: string, handler: LexHandler) {
  let res: RegExpExecArray | null;

  while ((res = lfReg.exec(longform))) {
    if (res?.groups == null) {
      continue;
    }

    indent = res.groups.w != null ? res.groups.w.length / 2 : 0;

    if (res.groups.d != null) {
      match[0] = 'd';
      match[1] = res.groups.d;
      match[2] = res.groups.ia ?? null;
    } else if (res.groups.i != null) {
      match[0] = 'i';
      match[1] = res.groups.i;
      match[2] = res.groups.b != null;
    } else if (res.groups.r != null) {
      match[0] = 'r';
      match[1] = res.groups.r;
    } else if (res.groups.re != null) {
      match[0] = 're';
    } else if (res.groups.e != null) {
      if (res.groups.pr == null) {
        match[0] = 'e';
        match[1] = res.groups.e;
        match[2] = res.groups.ea;
        match[3] = res.groups.it ?? null;
      } else {
        match[0] = 'p';
        match[1] = res.groups.e;
        match[2] = res.groups.ea;
      }
    } else if (res.groups.a != null) {
      match[0] = 'a';
      match[1] = res.groups.a;
      match[2] = res.groups.v1 ?? res.groups.v2 ?? res.groups.v3 ?? null;
    } else if (res.groups.l != null) {
      match[0] = 'l';
      match[1] = res.groups.k;
      match[2] = res.groups.dv;
    } else {
      match[0] = 't';
      match[1] = res.groups.t;
    }

    handler(indent, match);
  }
}
