import type { EditorView } from "@codemirror/view";

declare module "@codemirror/view" {
    export class CsoundEditorView extends EditorView {
        public toggleComment: () => void;
    }
}
