declare module "types" {
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
    export type ChunkType = 'parsed' | 'ref' | 'scope';
    export type WorkingChunk = {
        type: ChunkType;
        html: string;
        els: WorkingElement[];
    };
    export type WorkingFragmentType = 'root' | 'embed' | 'bare' | 'range' | 'text' | 'template';
    export type FragmentType = 'embed' | 'bare' | 'range' | 'text';
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
}
declare module "longform" {
    import type { FragmentType, ParsedResult, Fragment } from "types";
    export type { FragmentType, Fragment, ParsedResult };
    /**
     * Parses a longform document into a object containing the root and fragments
     * in the output format.
     *
     * @param {string} doc - The longform document to parse.
     * @returns {ParsedResult}
     */
    export function longform(doc: string, debug?: (...d: unknown[]) => void): ParsedResult;
    /**
     * Processes a client side Longform template to HTML fragment string.
     *
     * @param fragment    - The fragment identifier.
     * @param args        - A record of template arguments.
     * @param getFragment - A function which returns an already processed fragment's HTML string.
     * @returns The processed template.
     */
    export function processTemplate(template: string, args: Record<string, string | number>, getFragment: (fragment: string) => string | undefined): string | undefined;
}
