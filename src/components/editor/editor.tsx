import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import { csoundMode } from "@hlolli/codemirror-lang-csound";
import { EditorView } from "codemirror";
import {
    crosshairCursor,
    keymap,
    lineNumbers,
    highlightActiveLineGutter,
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
    foldGutter,
    indentOnInput
} from "@codemirror/language";
import { EditorState, StateField } from "@codemirror/state";
import { filenameToCsoundType } from "@comp/csound/utils";
import { evalBlinkExtension } from "./utils";
import { IDocument, IProject } from "../projects/types";
import { reject, pathOr, propOr } from "ramda";
import * as projectActions from "../projects/actions";
import { editorStyle } from "@styles/code-mirror-painter";

export const openEditors: Map<string, EditorView> = new Map();

const stateFields: Record<string, any> = {};
const scrollPos: Record<string, number> = {};
const histories: Record<string, any> = {};

const getInitialState = (
    documentUid: string
): { json: any; fields: any } | undefined => {
    const hasHistory = Boolean(stateFields[documentUid + ":serialized"]);
    stateFields[documentUid] = stateFields[documentUid] || {};
    stateFields[documentUid].history =
        stateFields[documentUid].history || historyField;
    return hasHistory
        ? {
              json: JSON.parse(stateFields[documentUid + ":serialized"]),
              fields: stateFields[documentUid]
          }
        : undefined;
};

const getInitialScrollPosition = (documentUid: string): number => {
    return scrollPos[documentUid] || 0;
};

const getHistory = (documentUid: string): any => {
    const previousHistory = histories[documentUid];
    if (previousHistory) {
        return previousHistory;
    } else {
        histories[documentUid] = history();
        return histories[documentUid];
    }
};

const CodeEditor = ({
    documentUid,
    projectUid
}: {
    documentUid: string;
    projectUid: string;
}): React.ReactElement => {
    const editorReference = useRef(null);
    const [isMounted, setIsMounted] = useState(false);
    const dispatch = useDispatch();

    const project = useSelector(
        pathOr({} as IProject, ["ProjectsReducer", "projects", projectUid])
    );

    const document = pathOr(
        {} as IDocument,
        ["documents", documentUid],
        project
    );

    const csoundFileType = filenameToCsoundType(document.filename || "");

    const [csoundDocumentStateField, setCsoundDocumentStateField] = useState(
        undefined as
            | StateField<{ documentUid: string; documentType: string }>
            | undefined
    );

    const currentDocumentValue: string = propOr("", "currentValue", document);

    const onChange = useCallback(
        (event: any) => {
            if (event?.state?.doc) {
                dispatch(
                    projectActions.updateDocumentValue(
                        event.state.doc.toString(),
                        projectUid,
                        documentUid
                    )
                );
            }
        },
        [dispatch, projectUid, documentUid]
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
            }
        };
    }, [isMounted, setIsMounted, documentUid, onScroll]);

    useEffect(() => {
        if (editorReference.current && !openEditors.has(documentUid)) {
            const initialState = getInitialState(documentUid);
            // console.log({ initialState });
            const config = {
                extensions: [
                    lineNumbers(),
                    highlightActiveLineGutter(),
                    highlightSpecialChars(),
                    foldGutter(),
                    drawSelection(),
                    dropCursor(),
                    EditorState.allowMultipleSelections.of(true),
                    indentOnInput(),
                    csoundMode({
                        fileType: (["sco", "orc", "csd"].includes(
                            csoundFileType || ""
                        )
                            ? csoundFileType
                            : "orc") as "sco" | "orc" | "csd"
                    }),
                    keymap.of([
                        ...reject(
                            (keyb: any) =>
                                [
                                    "Mod-Enter",
                                    "Comd-Enter",
                                    "Ctrl-Enter"
                                ].includes(keyb.key),
                            defaultKeymap
                        ),
                        ...historyKeymap
                    ]),
                    evalBlinkExtension,
                    bracketMatching(),
                    closeBrackets(),
                    autocompletion(),
                    getHistory(documentUid),
                    EditorView.updateListener.of(onChange),
                    crosshairCursor()
                ]
            };
            const newEditor = initialState
                ? new EditorView({
                      state: EditorState.fromJSON(
                          initialState?.json || {},
                          config,
                          initialState?.fields || {}
                      ),

                      parent: editorReference.current
                  })
                : new EditorView({
                      extensions: config.extensions,
                      parent: editorReference.current
                  });
            newEditor.scrollDOM.addEventListener("scroll", onScroll);
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
                for (const timeout of [1, 10, 100]) {
                    setTimeout(() => {
                        try {
                            newEditor.scrollDOM.scrollTop =
                                initialScrollPosition;
                        } catch {}
                    }, timeout);
                }
            }
        }
    }, [
        editorReference,
        currentDocumentValue,
        csoundFileType,
        documentUid,
        onChange,
        onScroll
    ]);

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
    }, [
        isMounted,
        documentUid,
        csoundFileType,
        csoundDocumentStateField,
        setCsoundDocumentStateField
    ]);

    return <div ref={editorReference} css={editorStyle} />;
};

export default CodeEditor;
