import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "@root/store";
import CodeMirror from "@hlolli/react-codemirror";
import {
    CsoundEditorView,
    drawSelection,
    keymap,
    lineNumbers
} from "@codemirror/view";
import { autocompletion } from "@codemirror/autocomplete";
import {
    defaultKeymap,
    history,
    historyField,
    historyKeymap
} from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { StateField } from "@codemirror/state";
import { CsoundTheme } from "@comp/themes/types";
import { filenameToCsoundType } from "@comp/csound/utils";
import { evalBlinkExtension } from "./utils";
import { IDocument, IProject } from "../projects/types";
import { reject, pathOr, propOr } from "ramda";
import * as projectActions from "../projects/actions";
import { resolveTheme } from "@styles/code-mirror-painter";
import { csoundMode } from "./modes/csound/csound";

declare global {
    interface Window {
        csoundSynopsis: any;
        csoundBuiltinOpcodes: any;
    }
}

export const openEditors: Map<string, CsoundEditorView> = new Map();

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

let updateReduxDocumentValue;

const CodeEditor = ({
    documentUid,
    projectUid
}: {
    documentUid: string;
    projectUid: string;
}): React.ReactElement => {
    const currentThemeName: CsoundTheme = useSelector(
        pathOr("monokai", ["ThemeReducer", "selectedThemeName"])
    );

    const [editorTheme, highlightedTags] = resolveTheme(currentThemeName);

    const [isMounted, setIsMounted] = useState(false);
    const [hasSynopsis, setHasSynopsis] = useState(false);

    const dispatch = useDispatch();

    const onUnmount = useCallback(() => {
        openEditors.delete(documentUid);
        updateReduxDocumentValue && updateReduxDocumentValue.cancel();
    }, [documentUid]);

    useEffect(() => {
        if (window.csoundSynopsis) {
            setHasSynopsis(true);
        } else {
            fetch("/static-manual-index.json")
                .then(async (response) => {
                    const csoundSynopsis: any = await response.json();
                    window.csoundSynopsis = csoundSynopsis;
                    window.csoundBuiltinOpcodes = csoundSynopsis.map(
                        ({ opname }) => opname
                    );
                    setHasSynopsis(true);
                })
                .catch((error: any) =>
                    console.error(
                        "Error while getting static-manual-index.json",
                        error
                    )
                );
        }

        return () => {
            isMounted && onUnmount();
        };
    }, [isMounted, onUnmount, setHasSynopsis]);

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

    const [csoundDocumentStateField, setCsoundDocumentStateField] = useState(
        undefined as
            | StateField<{ documentUid: string; documentType: string }>
            | undefined
    );

    const currentDocumentValue: string = propOr("", "currentValue", document);

    useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
        }
    }, [isMounted, setIsMounted]);

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

    return csoundDocumentStateField &&
        typeof currentDocumentValue === "string" &&
        hasSynopsis ? (
        <CodeMirror
            height="100%"
            value={currentDocumentValue}
            initialState={getInitialState(documentUid)}
            extensions={[
                drawSelection(),
                csoundMode(),
                getHistory(documentUid),
                keymap.of([
                    ...reject(
                        (keyb: any) => ["Mod-Enter"].includes(keyb.key),
                        defaultKeymap
                    ),
                    ...historyKeymap
                ]),
                lineNumbers(),
                bracketMatching(),
                editorTheme,
                highlightedTags,
                autocompletion(),
                csoundDocumentStateField,
                evalBlinkExtension
            ]}
            onChange={(value, viewUpdate) => {
                const state = viewUpdate.state.toJSON(stateFields[documentUid]);
                stateFields[documentUid + ":serialized"] =
                    JSON.stringify(state);
                dispatch(
                    projectActions.updateDocumentValue(
                        value,
                        projectUid,
                        documentUid
                    )
                );
            }}
            onCreateEditor={(editorView: CsoundEditorView) => {
                openEditors.set(documentUid, editorView);
            }}
            basicSetup={false}
            indentWithTab
        />
    ) : (
        <></>
    );
};

export default CodeEditor;
