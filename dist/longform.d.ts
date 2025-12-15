import type { ParsedResult } from "./types.ts";
/**
 * Parses a longform document into a object containing the root and fragments
 * in the output format.
 *
 * @param {string} doc - The longform document to parse.
 * @returns {ParsedResult}
 */
export declare function longform(doc: string, debug?: (...d: unknown[]) => void): ParsedResult;
/**
 * Processes a client side Longform template to HTML fragment string.
 *
 * @param fragment    - The fragment identifier.
 * @param args        - A record of template arguments.
 * @param getFragment - A function which returns an already processed fragment's HTML string.
 * @returns The processed template.
 */
export declare function processTemplate(template: string, args: Record<string, string | number>, getFragment: (fragment: string) => string | undefined): string | undefined;
