


export type HTMLFragment = string;
export type IDFragments = Record<string, string>;
export type BareFragments = Record<string, string>;
export type LongformFragments = {
    root?: HTMLFragment,
    id: IDFragments;
    bare: BareFragments;
};


const re = new RegExp(
    '(?<wsp>=(\w)*[a-z]\:\:)\w*' +
    ''
);

export function lf(longform: string): LongformFragments {
    let finished = false;
    const lines = longform.split('\n');
    
    do {

    } while (finished);
}