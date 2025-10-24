
export type WorkingElement = {
  indent: number;
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

export type FragmentType =
  | 'root'
  | 'embed'
  | 'bare'
  | 'range'
  | 'template'
;

export type WorkingFragment = {
  id?: string;
  type: FragmentType;
  html: string;
  chunks: WorkingChunk[];
  els: WorkingElement[];
};

export type Fragment = {
  id: string;
  type: FragmentType;
  html: string;
};

export type Longform = {
  root: string | null;
  fragments: Record<string, Fragment>;
};