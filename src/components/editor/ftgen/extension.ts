import { StateEffect, StateField, type Extension } from "@codemirror/state";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    keymap,
    type ViewUpdate
} from "@codemirror/view";
import { findTables, tableLinks, type TableDefinition } from "./source";
export type PlotSnapshot = {
    text: string;
    filename: string;
    selected: TableDefinition;
};
export const closeTablePlot = StateEffect.define<null>();

export function tablePlots(
    filename: string,
    show: (snapshot: PlotSnapshot | null) => void
): Extension {
    const definitions = StateField.define<ReturnType<typeof findTables>>({
        create: (state) => findTables(state.doc.toString(), filename),
        update: (value, tr) =>
            tr.docChanged ? findTables(tr.newDoc.toString(), filename) : value
    });
    const plugin = ViewPlugin.fromClass(
        class {
            active?: TableDefinition;
            decorations = Decoration.none;
            links: ReturnType<typeof tableLinks> = [];
            constructor(readonly view: EditorView) {
                this.decorate();
            }
            decorate() {
                this.links = tableLinks(
                    this.view.state.doc.toString(),
                    filename,
                    this.view.state.field(definitions)
                );
                this.decorations = Decoration.set(
                    this.links.map((d) =>
                        Decoration.mark({
                            class: "cm-ftgen-link",
                            attributes: {
                                title: "Plot function table (Alt+Enter)"
                            }
                        }).range(d.from, d.to)
                    )
                );
            }
            open(position: number) {
                const definition = this.links.find(
                    (d) => d.from <= position && d.to >= position
                )?.definition;
                if (!definition) return false;
                this.active = definition;
                show({
                    text: this.view.state.doc.toString(),
                    filename,
                    selected: definition
                });
                return true;
            }
            update(update: ViewUpdate) {
                if (
                    update.transactions.some((tr) =>
                        tr.effects.some((effect) => effect.is(closeTablePlot))
                    )
                )
                    this.active = undefined;
                if (!update.docChanged) return;
                this.decorate();
                if (!this.active) return;
                const from = update.changes.mapPos(this.active.from, 1);
                const next = update.state
                    .field(definitions)
                    .find(
                        (d) =>
                            d.from === from &&
                            d.name === this.active!.name &&
                            d.kind === this.active!.kind &&
                            d.arguments[0] === this.active!.arguments[0]
                    );
                this.active = next;
                show(
                    next
                        ? {
                              text: update.state.doc.toString(),
                              filename,
                              selected: next
                          }
                        : null
                );
            }
            destroy() {
                if (this.active) show(null);
            }
        },
        {
            decorations: (value) => value.decorations,
            eventHandlers: {
                click(event) {
                    const target = event.target;
                    if (
                        !(target instanceof Element) ||
                        !target.closest(".cm-ftgen-link")
                    )
                        return false;
                    const pos = this.view.posAtCoords({
                        x: event.clientX,
                        y: event.clientY
                    });
                    if (pos === null) return false;
                    return this.open(pos);
                }
            }
        }
    );
    return [
        definitions,
        plugin,
        keymap.of([
            {
                key: "Alt-Enter",
                run: (view) =>
                    view.plugin(plugin)?.open(view.state.selection.main.head) ??
                    false
            }
        ]),
        EditorView.baseTheme({
            ".cm-ftgen-link:hover": {
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationThickness: "1px"
            }
        })
    ];
}
