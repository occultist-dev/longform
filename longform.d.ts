declare module "types" {
    export type WorkingElement = {
        indent: number;
        id?: string;
        tag?: string;
        class?: string;
        attrs: Record<string, string | null>;
        text?: string;
        html: string;
    };
    export type ChunkType = 'parsed' | 'ref' | 'scope';
    export type WorkingChunk = {
        type: ChunkType;
        html: string;
        els: WorkingElement[];
    };
    export type FragmentType = 'root' | 'embed' | 'bare' | 'range' | 'template';
    export type FragmentRef = {
        id: string;
        start: number;
        end: number;
    };
    export type WorkingFragment = {
        id?: string;
        type: FragmentType;
        html: string;
        refs: FragmentRef[];
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
}
declare module "longform" {
    import type { Longform } from "types";
    /**
     * Parses a longform document into a object containing the root and fragments
     * in the output format.
     *
     * @param {string} doc - The longform document to parse.
     * @returns {Longform}
     */
    export function longform(doc: string, debug?: (...d: unknown[]) => void): Longform;
}
