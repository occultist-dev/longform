export type WorkingElement = {
    indent: number;
    key?: string;
    id?: string;
    tag?: string;
    class?: string;
    attrs: Record<string, string | null>;
    text?: string;
    html: string;
    mount?: string;
};
export type WorkingFragmentType = 'root' | 'embed' | 'bare' | 'range' | 'text' | 'mount' | 'template';
export type FragmentType = 'embed' | 'bare' | 'range' | 'text';
export type FragmentRef = {
    id: string;
    start: number;
    end: number;
};
export type WorkingFragment = {
    id?: string;
    template: boolean;
    mountable: boolean;
    type: WorkingFragmentType;
    html: string;
    refs: FragmentRef[];
    els: WorkingElement[];
    mountPoints: MountPoint[];
};
export type Fragment = {
    id: string;
    selector: string;
    type: FragmentType;
    html: string;
};
export type MountPoint = {
    id: string;
    part: string;
};
export type ParsedResult = {
    mountable?: boolean;
    root: string | null;
    selector: string | null;
    mountPoints: MountPoint[];
    tail?: string;
    fragments: Record<string, Fragment>;
    templates: Record<string, string>;
};
