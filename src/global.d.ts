declare module "mime";
declare module "react-piano";
declare module "d3-scale";
declare module "file-saver";
declare module "react-beforeunload";
declare module "react-iframe-comm";
declare module "react-beautiful-dnd";
declare module "@hlolli/codemirror-lang-csound";

declare module "history" {
    export * from "history";
    const forward: () => void;
    const back: () => void;
    export const createBrowserHistory: () => void;
    export type Action = any;
    export type Location = any;
    export type History = any;
}

declare module "*.csd" {
    const content: string;
    export default content;
}

declare module "*.orc" {
    const content: string;
    export default content;
}

declare module "*.sco" {
    const content: string;
    export default content;
}
