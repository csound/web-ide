import { EditorState, StateEffect } from "@codemirror/state";
import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import {
    forEachDiagnostic,
    lintGutter,
    setDiagnostics,
    setDiagnosticsEffect,
    type Diagnostic
} from "@codemirror/lint";
import { checker, checkerAvailable } from "./client";
import { editorDiagnostics } from "./ranges";
import {
    setUdoDeclarations,
    setPartialUdoDeclarations,
    setPluginSignatures,
    setPluginTypes,
    udoCatalog
} from "./udos";
import { completionStatus, startCompletion } from "@codemirror/autocomplete";
import type { CheckRequest, CheckResult } from "./types";

export const validationPresentation = [
    lintGutter({ hoverTime: 500 }),
    EditorState.transactionExtender.of((transaction) => {
        if (!transaction.docChanged) return null;
        const remaining: Diagnostic[] = [];
        forEachDiagnostic(transaction.startState, (item, from, to) => {
            if (!transaction.changes.touchesRange(from, to))
                remaining.push({
                    ...item,
                    from: transaction.changes.mapPos(from),
                    to: transaction.changes.mapPos(to)
                });
        });
        return { effects: setDiagnosticsEffect.of(remaining) };
    }),
    EditorView.theme({
        ".cm-gutter-lint": { width: "12px" },
        ".cm-lint-marker-error": {
            backgroundImage: "none",
            backgroundColor: "#b97865",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            margin: "0 3px",
            opacity: "0.75"
        },
        ".cm-lintRange-error": {
            backgroundColor: "rgba(185, 120, 101, 0.055)"
        },
        ".cm-lintLine-error": {
            backgroundImage: "none"
        }
    })
];

export const CHECK_DELAY = 2500;
export const sourceFilesChanged = StateEffect.define<null>();
type Check = (
    request: CheckRequest,
    signal: AbortSignal
) => Promise<CheckResult>;

export function backgroundValidation(
    source: (text: string) => CheckRequest | undefined,
    execute: Check = (request, signal) => checker.check(request, signal),
    enabled = checkerAvailable
) {
    if (!enabled) return [];
    return [
        validationPresentation,
        ViewPlugin.fromClass(
            class {
                private timer?: ReturnType<typeof setTimeout>;
                private controller?: AbortController;
                private generation = 0;
                constructor(private view: EditorView) {
                    this.schedule();
                    document.addEventListener("visibilitychange", this.resume);
                    view.dom.addEventListener("compositionend", this.resume);
                }
                private resume = () => {
                    if (!document.hidden) this.schedule();
                };
                update(update: ViewUpdate) {
                    const dependenciesChanged = update.transactions.some(
                        (transaction) =>
                            transaction.effects.some((effect) =>
                                effect.is(sourceFilesChanged)
                            )
                    );
                    if (update.docChanged || dependenciesChanged) {
                        this.schedule();
                    }
                }
                private schedule() {
                    clearTimeout(this.timer);
                    this.controller?.abort();
                    const generation = ++this.generation;
                    this.timer = setTimeout(async () => {
                        if (document.hidden || this.view.composing) return;
                        const snapshot = this.view.state.doc;
                        const request = source(snapshot.toString());
                        if (!request) {
                            this.view.dispatch(
                                setDiagnostics(this.view.state, [])
                            );
                            return;
                        }
                        if (request.sourceDiagnostics?.length) {
                            // Keep the last known symbols while the CSD wrapper is incomplete.
                            this.view.dispatch(
                                setDiagnostics(
                                    this.view.state,
                                    editorDiagnostics(
                                        snapshot,
                                        request.sourceDiagnostics
                                    )
                                )
                            );
                            return;
                        }
                        const controller = (this.controller =
                            new AbortController());
                        try {
                            const result = await execute(
                                {
                                    ...request,
                                    knownOpcodes: this.view.state
                                        .field(udoCatalog, false)
                                        ?.confirmed.map((udo) => udo.name)
                                },
                                controller.signal
                            );
                            if (
                                !result.available ||
                                controller.signal.aborted ||
                                generation !== this.generation ||
                                this.view.state.doc !== snapshot
                            )
                                return;
                            const diagnostics = editorDiagnostics(
                                snapshot,
                                result.diagnostics.filter(
                                    (item) => item.filename === request.filename
                                )
                            );
                            this.view.dispatch(
                                setDiagnostics(this.view.state, diagnostics),
                                {
                                    effects: [
                                        setPluginTypes.of(
                                            result.pluginTypes ?? []
                                        ),
                                        setPluginSignatures.of(
                                            result.plugins ?? []
                                        ),
                                        (result.valid &&
                                        result.udosComplete !== false
                                            ? setUdoDeclarations
                                            : setPartialUdoDeclarations
                                        ).of(result.udos ?? [])
                                    ]
                                }
                            );
                            // An open list must not retain a removed or renamed UDO.
                            if (completionStatus(this.view.state) === "active")
                                startCompletion(this.view);
                        } catch {
                            // The optional checker must never interrupt editing.
                        }
                    }, CHECK_DELAY);
                }
                destroy() {
                    clearTimeout(this.timer);
                    this.controller?.abort();
                    this.generation++;
                    document.removeEventListener(
                        "visibilitychange",
                        this.resume
                    );
                    this.view.dom.removeEventListener(
                        "compositionend",
                        this.resume
                    );
                }
            }
        )
    ];
}
