import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, DragTabList, DragTab, PanelList, Panel } from "react-tabtab";
import { simpleSwitch } from "react-tabtab/lib/helpers/move";
import tabStyles from "./tabStyles";
import { Prompt } from "react-router";
import { Beforeunload } from "react-beforeunload";
import Tooltip from "@material-ui/core/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import IconButton from "@material-ui/core/IconButton";
import { IDocument, IProject } from "../Projects/types";
import { IOpenDocument } from "./types";
import SplitterLayout from "react-splitter-layout";
import IframeComm from "react-iframe-comm";
import { IStore } from "@store/types";
import Editor from "../Editor/Editor";
import AudioEditor from "../AudioEditor/AudioEditor";
import { useTheme } from "emotion-theming";
// import { toggleEditorFullScreen } from "../Editor/actions";
import FileTree from "../FileTree";
import Console from "../Console/Console";
import {
    append,
    concat,
    filter,
    indexOf,
    map,
    reduce,
    pathOr,
    pipe,
    prop,
    propOr,
    sortBy
} from "ramda";
import { find, isEmpty } from "lodash";
import "react-splitter-layout/lib/index.css";
import {
    closeTabDock,
    tabClose,
    tabSwitch,
    setManualPanelOpen
} from "./actions";
import { mapIndexed } from "../../utils";
import { closeProject } from "../Projects/actions";
import { isAudioFile } from "../Projects/utils";
import * as SS from "./styles";

type EditorForDocumentProps = {
    uid: any;
    doc: IDocument;
    projectUid: string;
};

function EditorForDocument({ uid, projectUid, doc }: EditorForDocumentProps) {
    if (doc.internalType === "txt") {
        return (
            <Editor
                documentUid={doc.documentUid}
                projectUid={projectUid}
            ></Editor>
        );
    } else if (doc.internalType === "bin" && isAudioFile(doc.filename)) {
        const path = `${uid}/${projectUid}/${doc.documentUid}`;
        return <AudioEditor audioFileUrl={path} />;
    }
    return (
        <div>
            <p>Unknown document type</p>
        </div>
    );
}

const ProjectEditor = props => {
    const dispatch = useDispatch();
    const theme: any = useTheme();
    const [tabOrder, setTabOrder_] = useState([] as string[]);

    // The manual is an iframe, which doesn't detect
    // mouve positions, so we add an invidible layer then
    // resizing the manual panel.
    const [manualDrag, setManualDrag] = useState(false);
    const activeProject: IProject = props.activeProject;
    const projectUid: string = propOr("", "projectUid", activeProject);

    const tabDockDocuments: IOpenDocument[] = useSelector(
        pipe(
            pathOr([] as IOpenDocument[], [
                "ProjectEditorReducer",
                "tabDock",
                "openDocuments"
            ]),
            sortBy(tb => indexOf(prop("uid", tb), tabOrder))
        )
    );

    const tabIndex: number = useSelector(
        pipe(
            pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"]),
            idx => {
                if (idx < 0) {
                    return idx;
                } else {
                    return Math.min(tabDockDocuments.length - 1, idx);
                }
            }
        )
    );

    const setTabOrder = (newTabOrder: string[]) => {
        if (tabDockDocuments.length > 0 && newTabOrder.length > 0) {
            localStorage.setItem(
                projectUid + ":tabOrder",
                JSON.stringify(newTabOrder)
            );
        }
        setTabOrder_(newTabOrder);
    };

    useEffect(() => {
        if (tabOrder.length === 0 && tabDockDocuments.length > 0) {
            const lastTabOrder = localStorage.getItem(projectUid + ":tabOrder");
            if (
                lastTabOrder &&
                lastTabOrder.length > 0 &&
                lastTabOrder !== "[]"
            ) {
                try {
                    setTabOrder(JSON.parse(lastTabOrder) as string[]);
                } catch (error) {
                    console.error(error);
                }
            } else {
                setTabOrder(map(prop("uid"), tabDockDocuments));
            }
        } else if (tabDockDocuments.length !== tabOrder.length) {
            if (tabDockDocuments.length > tabOrder.length) {
                // Tab was added
                const newTabs = map(
                    (td: IOpenDocument) => td.uid,
                    filter(
                        (td: IOpenDocument) =>
                            !tabOrder.some(toUid => toUid === td.uid),
                        tabDockDocuments
                    )
                );
                setTabOrder(concat(tabOrder, newTabs));
            } else {
                // Tab was removed
                setTabOrder(
                    filter(
                        tabUid =>
                            tabDockDocuments.some(
                                (tdd: IOpenDocument) => tdd.uid === tabUid
                            ),
                        tabOrder
                    )
                );
            }
        }
        // eslint-disable-next-line
    }, [tabDockDocuments]);

    const openDocuments: IDocument[] = isEmpty(projectUid)
        ? ([] as IDocument[])
        : reduce(
              (acc, tabDoc) => {
                  const maybeDoc = pathOr(
                      {} as IDocument,
                      ["documents", propOr("", "uid", tabDoc)],
                      activeProject
                  );
                  return maybeDoc ? append(maybeDoc as IDocument, acc) : acc;
              },
              [] as IDocument[],
              tabDockDocuments
          );

    const closeTab = (documentUid, isModified) => {
        dispatch(tabClose(projectUid, documentUid, isModified));
    };

    const openTabList = mapIndexed((document: any, index) => {
        const isActive: boolean = index === tabIndex;
        const isModified: boolean = document.isModifiedLocally;

        return (
            <DragTab closable={true} key={index}>
                {document!.filename + (isModified ? "*" : "")}
                <Tooltip title={"close"} placement="right-end">
                    <IconButton
                        size="small"
                        css={SS.closeButton}
                        onClick={e => {
                            e.stopPropagation();
                            closeTab(document.documentUid, isModified);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faTimes}
                            size="sm"
                            color={
                                isActive
                                    ? theme.color.primary
                                    : theme.highlightAlt.primary
                            }
                        />
                    </IconButton>
                </Tooltip>
            </DragTab>
        );
    }, openDocuments as IDocument[]);

    const openTabPanels = mapIndexed(
        (doc: any, index: number) => (
            <Panel key={index}>
                <EditorForDocument
                    uid={activeProject.userUid}
                    projectUid={projectUid}
                    doc={doc}
                />
            </Panel>
        ),
        openDocuments
    );

    const switchTab = (index: number) => {
        localStorage.setItem(projectUid + ":tabIndex", `${index}`);
        dispatch(tabSwitch(index));
    };

    const someUnsavedData: boolean = !!find(
        openDocuments,
        (doc: IDocument) => doc.isModifiedLocally === true
    );

    const unsavedDataExitText =
        "You still have unsaved changes, are you sure you want to quit?";
    const unsavedDataExitPrompt = someUnsavedData && (
        <React.Fragment>
            <Beforeunload onBeforeunload={() => unsavedDataExitText} />
            <Prompt when={someUnsavedData} message={unsavedDataExitText} />
        </React.Fragment>
    );

    const tabDock =
        isEmpty(openDocuments) || isEmpty(tabOrder) ? (
            <div />
        ) : (
            <Tabs
                activeIndex={tabIndex}
                onTabChange={switchTab}
                customStyle={tabStyles}
                onTabSequenceChange={({ oldIndex, newIndex }) => {
                    setTabOrder(simpleSwitch(tabOrder, oldIndex, newIndex));
                    tabOrder[oldIndex] === tabDockDocuments[tabIndex].uid &&
                        switchTab(newIndex);
                }}
                onTabEdit={console.log}
            >
                <DragTabList>{openTabList}</DragTabList>
                <PanelList>{openTabPanels}</PanelList>
            </Tabs>
        );

    const manualLookupString = useSelector(
        (store: IStore) => store.ProjectEditorReducer.manualLookupString
    );

    const onManualMessage = evt => {};

    const manualWindow = (
        <div style={{ width: "100%", height: "100%" }}>
            <IframeComm
                attributes={{
                    src: "/manual/main?cache=1001",
                    width: "100%",
                    height: "100%"
                }}
                postMessageData={manualLookupString || ""}
                handleReceiveMessage={onManualMessage}
            />
            {manualDrag && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        zIndex: 200,
                        position: "absolute",
                        top: 0
                    }}
                />
            )}
        </div>
    );

    const secondaryPanel = useSelector(
        (store: IStore) => store.ProjectEditorReducer.secondaryPanel
    );

    useEffect(() => {
        return () =>
            sessionStorage.setItem(
                projectUid + ":secondaryPanel",
                secondaryPanel || ""
            );
        // eslint-disable-next-line
    }, [secondaryPanel]);

    useEffect(() => {
        return () => {
            dispatch(closeTabDock());
            dispatch(closeProject());
        };
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const lastSecondaryPanel = sessionStorage.getItem(
            projectUid + ":secondaryPanel"
        );
        if (!isEmpty(lastSecondaryPanel)) {
            if (lastSecondaryPanel === "manual") {
                dispatch(setManualPanelOpen(true));
            }
            sessionStorage.removeItem(projectUid + ":secondaryPanel");
        }
        // eslint-disable-next-line
    }, []);

    return (
        <div css={SS.splitterLayoutContainer}>
            {unsavedDataExitPrompt}
            <SplitterLayout
                primaryIndex={1}
                primaryMinSize={400}
                secondaryInitialSize={250}
                secondaryMinSize={250}
            >
                <FileTree />
                <SplitterLayout
                    horizontal
                    secondaryInitialSize={500}
                    onDragStart={() => setManualDrag(true)}
                    onDragEnd={() => setManualDrag(false)}
                >
                    <SplitterLayout vertical secondaryInitialSize={250}>
                        {tabDock}
                        <Console />
                    </SplitterLayout>
                    {secondaryPanel === "manual" ? manualWindow : null}
                </SplitterLayout>
            </SplitterLayout>
        </div>
    );
};

export default ProjectEditor;
