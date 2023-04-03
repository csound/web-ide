import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "@root/store";
import { csoundMode } from "@hlolli/codemirror-lang-csound";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { autocompletion } from "@codemirror/autocomplete";
import {
    defaultKeymap,
    history,
    historyField,
    historyKeymap
} from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { EditorState, StateField } from "@codemirror/state";
// import { CsoundTheme } from "@comp/themes/types";
import { filenameToCsoundType } from "@comp/csound/utils";
import { evalBlinkExtension } from "./utils";
import { IDocument, IProject } from "../projects/types";
import { reject, pathOr, propOr } from "ramda";
import * as projectActions from "../projects/actions";
import { editorStyle } from "@styles/code-mirror-painter";

export const openEditors: Map<string, EditorView> = new Map();

const stateFields: Record<string, any> = {};
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

const getHistory = (documentUid: string): any => {
    const previousHistory = histories[documentUid];
    if (previousHistory) {
        return previousHistory;
    } else {
        histories[documentUid] = history();
        return histories[documentUid];
    }
};

// let updateReduxDocumentValue;

const CodeEditor = ({
    documentUid,
    projectUid
}: {
    documentUid: string;
    projectUid: string;
}): React.ReactElement => {
    const editorReference = useRef(null);
    // const currentThemeName: CsoundTheme = useSelector(
    //     pathOr("monokai", ["ThemeReducer", "selectedThemeName"])
    // );

    // const [editorTheme, highlightedTags] = resolveTheme(currentThemeName);

    const [isMounted, setIsMounted] = useState(false);
    // const [hasSynopsis, setHasSynopsis] = useState(false);

    const dispatch = useDispatch();

    // const onUnmount = useCallback(() => {
    //     updateReduxDocumentValue && updateReduxDocumentValue.cancel();
    // }, [documentUid]);

    const activeProjectUid = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const project = useSelector(
        pathOr({} as IProject, [
            "ProjectsReducer",
            "projects",
            activeProjectUid
        ])
    );

    const document = pathOr(
        {} as IDocument,
        ["documents", documentUid],
        project
    );

    const csoundFileType = filenameToCsoundType(document.filename || "");

    console.log({ csoundFileType });

    const [csoundDocumentStateField, setCsoundDocumentStateField] = useState(
        undefined as
            | StateField<{ documentUid: string; documentType: string }>
            | undefined
    );

    const currentDocumentValue: string = propOr("", "currentValue", document);

    const onChange = useCallback(
        (event) => {
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

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
        }
        return () => {
            if (isMounted && openEditors.has(documentUid)) {
                const editorStateInstance = openEditors.get(
                    documentUid
                ) as EditorView;
                editorStateInstance.destroy();
                openEditors.delete(documentUid);
            }
        };
    }, [isMounted, setIsMounted, documentUid]);

    useEffect(() => {
        if (editorReference.current && !openEditors.has(documentUid)) {
            const initialState = getInitialState(documentUid);
            console.log({ initialState });
            const config = {
                extensions: [
                    basicSetup,
                    csoundMode({
                        fileType: (["sco", "orc", "csd"].includes(
                            csoundFileType || ""
                        )
                            ? csoundFileType
                            : "orc") as "sco" | "orc" | "csd"
                    }),
                    keymap.of([
                        ...reject(
                            (keyb: any) => ["Mod-Enter"].includes(keyb.key),
                            defaultKeymap
                        ),
                        ...historyKeymap
                    ]),
                    evalBlinkExtension,
                    bracketMatching(),
                    autocompletion(),
                    getHistory(documentUid),
                    EditorView.updateListener.of(onChange)
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

            openEditors.set(documentUid, newEditor);
            newEditor.dispatch({
                changes: {
                    from: 0,
                    to: newEditor.state.doc.length,
                    insert: currentDocumentValue
                }
            });
        }
    }, [
        editorReference,
        currentDocumentValue,
        csoundFileType,
        documentUid,
        onChange
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
    //  csoundDocumentStateField &&
    //     typeof currentDocumentValue === "string" &&
    //     hasSynopsis ? (
    //     <CodeMirror
    //         height="100%"
    //         value={currentDocumentValue}
    //         initialState={getInitialState(documentUid)}
    //         extensions={[
    //             // drawSelection(),
    //             csoundMode({ fileType: "csd" })
    //             // getHistory(documentUid),
    //             // keymap.of([
    //             //     ...reject(
    //             //         (keyb: any) => ["Mod-Enter"].includes(keyb.key),
    //             //         defaultKeymap
    //             //     ),
    //             //     ...historyKeymap
    //             // ]),
    //             // lineNumbers(),
    //             // bracketMatching(),
    //             // editorTheme,
    //             // highlightedTags,
    //             // autocompletion(),
    //             // csoundDocumentStateField,
    //             // evalBlinkExtension
    //         ]}
    //         onChange={(value, viewUpdate) => {
    //             const state = viewUpdate.state.toJSON(stateFields[documentUid]);
    //             stateFields[documentUid + ":serialized"] =
    //                 JSON.stringify(state);
    //             dispatch(
    //                 projectActions.updateDocumentValue(
    //                     value,
    //                     projectUid,
    //                     documentUid
    //                 )
    //             );
    //         }}
    //         onCreateEditor={(editorView: CsoundEditorView) => {
    //             openEditors.set(documentUid, editorView);
    //         }}
    //         basicSetup={false}
    //         indentWithTab
    //     />
    // ) : (
    //     <></>
    // );
};

export default CodeEditor;
