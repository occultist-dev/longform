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
    export type FragmentType = 'root' | 'embed' | 'bare' | 'range';
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
        selector: string;
        type: Exclude<FragmentType, 'root'>;
        html: string;
    };
    export type ParsedResult = {
        root: string | null;
        selector: string | null;
        fragments: Record<string, Fragment>;
    };
}
declare module "longform" {
    import type { ParsedResult } from "types";
    export * from "types";
    export * from "types";
    /**
     * Parses a longform document into a object containing the root and fragments
     * in the output format.
     *
     * @param {string} doc - The longform document to parse.
     * @returns {ParsedResult}
     */
    export function longform(doc: string, debug?: (...d: unknown[]) => void): ParsedResult;
}
