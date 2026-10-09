import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import {
    backgroundValidation,
    sourceFilesChanged,
    validationPresentation
} from "./validation/extension";
import { projectPluginSignatures } from "./validation/plugins/project";
import { checkWithPlugins } from "./validation/plugins/check";
import { watchCompiler, compilerDiagnostics } from "./validation/messages";
import { editorDiagnostics } from "./validation/ranges";
import { setDiagnostics } from "@codemirror/lint";
import { StateEffect } from "@codemirror/state";
import { projectSources } from "./validation/source";
import { csoundEditorLanguage } from "./csound-language";
import { clojureEditorLanguage } from "./clojure-language";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "codemirror";
import {
    crosshairCursor,
    keymap,
    lineNumbers,
    highlightActiveLineGutter,
    highlightActiveLine,
    highlightSpecialChars,
    drawSelection,
    dropCursor
} from "@codemirror/view";
import { autocompletion, closeBrackets } from "@codemirror/autocomplete";
import {
    defaultKeymap,
    history,
    historyField,
    historyKeymap
} from "@codemirror/commands";
import {
    bracketMatching,
    defaultHighlightStyle,
    foldGutter,
    indentOnInput,
    syntaxHighlighting
} from "@codemirror/language";
import { Compartment, EditorState, StateField } from "@codemirror/state";
import { filenameToCsoundType } from "@comp/csound/utils";
import { evalBlinkExtension } from "./utils";
import { IDocument, IProject } from "../projects/types";
import * as projectActions from "../projects/actions";
import { lookupManualString } from "../project-editor/actions";
import { editorStyle } from "@styles/code-mirror-painter";

import { useTheme } from "@emotion/react";
import { codeMirrorTheme } from "@styles/code-mirror-theme";

export const openEditors: Map<string, EditorView> = new Map();

const stateFields: Record<string, any> = {};
const scrollPos: Record<string, number> = {};
const histories: Record<string, any> = {};

const getInitialState = (
    documentUid: string
): { json: any; fields: any } | undefined => {
    const hasHistory = !!stateFields[`${documentUid}:serialized`];
    stateFields[documentUid] = stateFields[documentUid] || {};
    stateFields[documentUid].history =
        stateFields[documentUid].history || historyField;
    return hasHistory
        ? {
              json: JSON.parse(stateFields[`${documentUid}:serialized`]),
              fields: stateFields[documentUid]
          }
        : undefined;
};

const getInitialScrollPosition = (documentUid: string): number =>
    scrollPos[documentUid] || 0;

const getHistory = (documentUid: string): any => {
    if (!histories[documentUid]) {
        histories[documentUid] = history();
    }
    return histories[documentUid];
};

const CodeEditor = ({
    documentUid,
    projectUid,
    buffer,
    onBufferChange
}: {
    documentUid: string;
    projectUid: string;
    buffer?: { filename: string; value: string };
    onBufferChange?: (value: string) => void;
}) => {
    const theme = useTheme();
    const themeCompartment = useMemo(() => new Compartment(), []);
    const languageCompartment = useMemo(() => new Compartment(), []);
    const editorReference = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const dispatch = useDispatch();

    const project = useSelector(
        (state: any) =>
            state?.ProjectsReducer?.projects?.[projectUid] ?? ({} as IProject)
    );

    const document = buffer
        ? { filename: buffer.filename, currentValue: buffer.value }
        : (project?.documents?.[documentUid] ?? ({} as IDocument));

    const csoundFileType = filenameToCsoundType(document.filename || "");
    const isMarkdown = /\.(md|markdown)$/i.test(document.filename || "");
    const validationCompartment = useMemo(() => new Compartment(), []);
    const projectRef = useRef(project);
    projectRef.current = project;
    const validationExtension = useMemo(() => {
        if (buffer || !/\.(csd|orc)$/i.test(document.filename || "")) return [];
        const markedIncludes = new Set<string>();
        return backgroundValidation(
            (text) =>
                projectSources(
                    projectRef.current.documents || {},
                    documentUid,
                    text
                ),
            async (request, signal) => {
                const result = await checkWithPlugins(request, signal, () =>
                    projectPluginSignatures(
                        projectUid,
                        projectRef.current.documents || {},
                        request
                    )
                );
                if (!signal.aborted && result.available) {
                    const documents = projectRef.current.documents || {};
                    const sourcesByName = new Map(
                        request.files.map((file) => [file.name, file])
                    );
                    for (const entry of Object.values(
                        documents
                    ) as IDocument[]) {
                        const name = [
                            ...entry.path.map(
                                (id) => documents[id]?.filename || id
                            ),
                            entry.filename
                        ].join("/");
                        if (name === request.filename) continue;
                        const diagnostics = result.diagnostics.filter(
                            (item) => item.filename === name
                        );
                        const source = sourcesByName.get(name);
                        if (
                            source &&
                            (diagnostics.length || markedIncludes.has(name))
                        ) {
                            if (diagnostics.length) markedIncludes.add(name);
                            else markedIncludes.delete(name);
                            compilerDiagnostics(
                                entry.documentUid,
                                source.text,
                                diagnostics
                            );
                        }
                    }
                }
                return result;
            }
        );
    }, [projectUid, documentUid, document.filename, Boolean(buffer)]);

    useEffect(() => {
        let presentedView: EditorView | undefined;
        return watchCompiler(documentUid, ({ text, diagnostics }) => {
            const view = openEditors.get(documentUid);
            if (!view || view.state.doc.toString() !== text) return;
            if (view !== presentedView && diagnostics.length) {
                view.dispatch({
                    effects: StateEffect.appendConfig.of(validationPresentation)
                });
                presentedView = view;
            }
            view.dispatch(
                setDiagnostics(
                    view.state,
                    editorDiagnostics(view.state.doc, diagnostics)
                )
            );
        });
    }, [documentUid]);

    useEffect(() => {
        openEditors
            .get(documentUid)
            ?.dispatch({ effects: sourceFilesChanged.of(null) });
    }, [documentUid, project.documents]);

    const openManual = useCallback(
        (opcode: string) => dispatch(lookupManualString(opcode)),
        [dispatch]
    );
    const languageExtension = useMemo(
        () =>
            isMarkdown
                ? [markdown(), syntaxHighlighting(defaultHighlightStyle)]
                : csoundFileType === "lisp"
                  ? clojureEditorLanguage()
                  : csoundEditorLanguage(csoundFileType, openManual),
        [isMarkdown, csoundFileType, openManual]
    );

    const [csoundDocumentStateField, setCsoundDocumentStateField] = useState<
        StateField<{ documentUid: string; documentType: string }> | undefined
    >(undefined);

    const currentDocumentValue: string = document.currentValue || "";

    const onChange = useCallback(
        (event: any) => {
            if (event.docChanged) {
                if (onBufferChange) {
                    onBufferChange(event.state.doc.toString());
                    return;
                }
                dispatch(
                    projectActions.updateDocumentValue(
                        event.state.doc.toString(),
                        projectUid,
                        documentUid
                    )
                );
            }
        },
        [dispatch, projectUid, documentUid, onBufferChange]
    );

    const onScroll = useCallback(
        (event: any) => {
            scrollPos[documentUid] = event.target.scrollTop;
        },
        [documentUid]
    );

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
        }
        return () => {
            if (isMounted && openEditors.has(documentUid)) {
                const editorStateInstance = openEditors.get(
                    documentUid
                ) as EditorView;
                editorStateInstance.scrollDOM.removeEventListener(
                    "scroll",
                    onScroll
                );
                editorStateInstance.destroy();
                openEditors.delete(documentUid);
                if (buffer) {
                    delete scrollPos[documentUid];
                    delete stateFields[documentUid];
                    delete stateFields[`${documentUid}:serialized`];
                    delete histories[documentUid];
                }
            }
        };
    }, [isMounted, documentUid, onScroll, Boolean(buffer)]);

    useEffect(() => {
        if (editorReference.current && !openEditors.has(documentUid)) {
            const initialState = getInitialState(documentUid);

            const config = {
                extensions: [
                    themeCompartment.of(codeMirrorTheme(theme)),
                    lineNumbers(),
                    highlightActiveLine(),
                    highlightActiveLineGutter(),
                    highlightSpecialChars(),
                    foldGutter(),
                    drawSelection(),
                    dropCursor(),
                    EditorState.allowMultipleSelections.of(true),
                    indentOnInput(),
                    languageCompartment.of(languageExtension),
                    keymap.of([
                        ...defaultKeymap.filter(
                            (keyb) =>
                                keyb &&
                                ![
                                    "Mod-Enter",
                                    "Comd-Enter",
                                    "Ctrl-Enter"
                                ].includes(keyb.key || "")
                        ),
                        ...historyKeymap
                    ]),
                    evalBlinkExtension,
                    bracketMatching(),
                    closeBrackets(),
                    autocompletion(),
                    validationCompartment.of(validationExtension),
                    getHistory(documentUid),
                    EditorView.updateListener.of(onChange),
                    crosshairCursor()
                ]
            };

            const newEditor = initialState
                ? new EditorView({
                      state: EditorState.fromJSON(
                          initialState.json,
                          config,
                          initialState.fields
                      ),
                      parent: editorReference.current
                  })
                : new EditorView({
                      extensions: config.extensions,
                      parent: editorReference.current
                  });

            newEditor.scrollDOM.addEventListener("scroll", onScroll, {
                passive: true
            });
            openEditors.set(documentUid, newEditor);

            newEditor.dispatch({
                changes: {
                    from: 0,
                    to: newEditor.state.doc.length,
                    insert: currentDocumentValue
                }
            });

            const initialScrollPosition = getInitialScrollPosition(documentUid);
            if (initialScrollPosition > 0) {
                newEditor.scrollDOM.scrollTop = initialScrollPosition;
                [1, 10, 100].forEach((timeout) =>
                    setTimeout(() => {
                        try {
                            newEditor.scrollDOM.scrollTop =
                                initialScrollPosition;
                        } catch {}
                    }, timeout)
                );
            }
        }
    }, [
        editorReference,
        currentDocumentValue,
        languageCompartment,
        languageExtension,
        documentUid,
        onChange,
        onScroll,
        theme,
        themeCompartment,
        validationExtension,
        validationCompartment
    ]);

    useEffect(() => {
        openEditors.get(documentUid)?.dispatch({
            effects: validationCompartment.reconfigure(validationExtension)
        });
    }, [documentUid, validationCompartment, validationExtension]);

    useEffect(() => {
        openEditors.get(documentUid)?.dispatch({
            effects: themeCompartment.reconfigure(codeMirrorTheme(theme))
        });
    }, [documentUid, theme, themeCompartment]);

    useEffect(() => {
        openEditors.get(documentUid)?.dispatch({
            effects: languageCompartment.reconfigure(languageExtension)
        });
    }, [documentUid, languageCompartment, languageExtension]);

    useEffect(() => {
        if (isMounted && documentUid && !csoundDocumentStateField) {
            setCsoundDocumentStateField(
                StateField.define({
                    create: () => ({
                        documentUid,
                        documentType: csoundFileType || ""
                    }),
                    update: () => ({
                        documentUid,
                        documentType: csoundFileType || ""
                    })
                })
            );
        }
    }, [isMounted, documentUid, csoundFileType, csoundDocumentStateField]);

    return <div ref={editorReference} css={editorStyle} />;
};

export default CodeEditor;
