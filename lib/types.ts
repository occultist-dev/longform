
export type WorkingElement = {
  indent: number;
  key?: string;
  id?: string;
  tag?: string;
  class?: string;
  attrs: Record<string, string | null>;
  text?: string;
  html: string;
};

export type ChunkType =
  | 'parsed'
  | 'ref'
  | 'scope'
;

export type WorkingChunk = {
  type: ChunkType;
  html: string;
  els: WorkingElement[];
};

export type WorkingFragmentType =
  | 'root'
  | 'embed'
  | 'bare'
  | 'range'
  | 'text'
  | 'template'
;

export type FragmentType =
  | 'embed'
  | 'bare'
  | 'range'
  | 'text'
;

export type FragmentRef = {
  id: string;
  start: number;
  end: number;
};

export type WorkingFragment = {
  id?: string;
  template: boolean;
  type: WorkingFragmentType;
  html: string;
  refs: FragmentRef[];
  chunks: WorkingChunk[];
  els: WorkingElement[];
};

export type Fragment = {
  id: string;
  selector: string;
  type: FragmentType;
  html: string;
};

export type ParsedResult = {
  root: string | null;
  selector: string | null;
  fragments: Record<string, Fragment>;
  templates: Record<string, string>;
};

