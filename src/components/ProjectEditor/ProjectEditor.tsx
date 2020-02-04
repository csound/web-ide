import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DnDProvider } from "@comp/FileTree/context";
import { Tabs, DragTabList, DragTab, PanelList, Panel } from "react-tabtab";
import { simpleSwitch } from "react-tabtab/lib/helpers/move";
import { subscribeToProjectLastModified } from "@comp/ProjectLastModified/subscribers";
import tabStyles from "./tabStyles";
import { Prompt } from "react-router";
import { Beforeunload } from "react-beforeunload";
import Tooltip from "@material-ui/core/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faWindowClose } from "@fortawesome/free-solid-svg-icons";
import IconButton from "@material-ui/core/IconButton";
import { IDocument } from "../Projects/types";
import { IOpenDocument } from "./types";
import SplitterLayout from "react-splitter-layout";
import IframeComm from "react-iframe-comm";
import { IStore } from "@store/types";
import Editor from "../Editor/Editor";
import AudioEditor from "../AudioEditor/AudioEditor";
import { useTheme } from "emotion-theming";
import { subscribeToProjectChanges } from "@comp/Projects/subscribers";
// import { toggleEditorFullScreen } from "../Editor/actions";
import FileTree from "../FileTree";
import Console from "@comp/Console/Console";
import {
    storeEditorKeyboardCallbacks,
    storeProjectEditorKeyboardCallbacks
} from "@comp/HotKeys/actions";
import { append, reduce, pathOr, propOr } from "ramda";
import { find, isEmpty } from "lodash";
import "react-splitter-layout/lib/index.css";
import {
    closeTabDock,
    rearrangeTabs,
    tabClose,
    tabSwitch,
    setManualPanelOpen
} from "./actions";
import { mapIndexed } from "../../utils";
import { closeProject } from "../Projects/actions";
import { isAudioFile } from "../Projects/utils";
import { windowHeader as windowHeaderStyle } from "@styles/_common";
import * as SS from "./styles";

type EditorForDocumentProps = {
    uid: any;
    doc: IDocument;
    projectUid: string;
};

function EditorForDocument({ uid, projectUid, doc }: EditorForDocumentProps) {
    if (doc.type === "txt") {
        return (
            <Editor
                documentUid={doc.documentUid}
                projectUid={projectUid}
            ></Editor>
        );
    } else if (doc.type === "bin" && isAudioFile(doc.filename)) {
        const path = `${uid}/${projectUid}/${doc.documentUid}`;
        return <AudioEditor audioFileUrl={path} />;
    }
    return (
        <div>
            <p>Unknown document type</p>
        </div>
    );
}

const ProjectEditor = ({ activeProject, csound }) => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    // The manual is an iframe, which doesn't detect
    // mouse positions, so we add an invidible layer then
    // resizing the manual panel.
    const [manualDrag, setManualDrag] = useState(false);
    const projectUid: string = propOr("", "projectUid", activeProject);
    const tabPanelRef = useRef();

    useEffect(() => {
        const unsubscribeProjectChanges = subscribeToProjectChanges(
            projectUid,
            dispatch,
            csound
        );
        const unsubscribeToProjectLastModified = subscribeToProjectLastModified(
            projectUid,
            dispatch
        );
        return () => {
            unsubscribeProjectChanges();
            unsubscribeToProjectLastModified();
        };
        // eslint-disable-next-line
    }, []);

    const tabDockDocuments: IOpenDocument[] = useSelector(
        pathOr([] as IOpenDocument[], [
            "ProjectEditorReducer",
            "tabDock",
            "openDocuments"
        ])
    );

    const tabIndex: number = useSelector(
        pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"])
    );

    const openDocuments: IDocument[] = reduce(
        (acc: IDocument[], tabDoc: IOpenDocument) => {
            const maybeDoc = pathOr(
                {} as IDocument,
                ["documents", propOr("", "uid", tabDoc)],
                activeProject
            );
            return maybeDoc ? append(maybeDoc, acc) : acc;
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
        const docPathHuman = append(
            document.filename,
            (document.path || []).map(docUid =>
                pathOr(
                    "<unknown>",
                    ["documents", docUid, "filename"],
                    activeProject
                )
            )
        ).join("/");
        return (
            <DragTab closable={true} key={index}>
                <>
                    <Tooltip
                        placement="right-end"
                        title={
                            document.path
                                ? document.path.length > 0
                                    ? docPathHuman
                                    : document!.filename
                                : ""
                        }
                    >
                        <p style={{ margin: 0 }}>
                            {document!.filename + (isModified ? "*" : "")}
                        </p>
                    </Tooltip>
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
                </>
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

    const tabDock = isEmpty(openDocuments) ? (
        <div style={{ height: "50vh" }} />
    ) : (
        <Tabs
            activeIndex={Math.min(tabIndex, tabDockDocuments.length - 1)}
            onTabChange={switchTab}
            customStyle={tabStyles}
            showModalButton={false}
            showArrowButton={"auto"}
            onTabSequenceChange={({ oldIndex, newIndex }) => {
                dispatch(
                    rearrangeTabs(
                        projectUid,
                        simpleSwitch(tabDockDocuments, oldIndex, newIndex),
                        newIndex
                    )
                );
            }}
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
        <div style={{ width: "100%", height: "100%", paddingTop: 35 }}>
            <IframeComm
                attributes={{
                    src: "/manual/main?cache=1001",
                    width: "100%",
                    height: "100%"
                }}
                postMessageData={manualLookupString || ""}
                handleReceiveMessage={onManualMessage}
            />
            <div css={windowHeaderStyle}>
                <p>
                    Csound Manual
                    <span css={SS.headIconsContainer}>
                        <Tooltip title="close window">
                            <span
                                onClick={() =>
                                    dispatch(setManualPanelOpen(false))
                                }
                            >
                                <FontAwesomeIcon
                                    icon={faWindowClose}
                                    size="sm"
                                    color={theme.alternativeColor.primary}
                                />
                            </span>
                        </Tooltip>
                    </span>
                </p>
            </div>
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

    const isManualVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.manualVisible
    );
    const isConsoleVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.consoleVisible
    );
    const isFileTreeVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.fileTreeVisible
    );

    useEffect(() => {
        return () =>
            sessionStorage.setItem(
                projectUid + ":manualVisible",
                `${isManualVisible || false}`
            );
        // eslint-disable-next-line
    }, [isManualVisible]);

    useEffect(() => {
        if (projectUid) {
            dispatch(storeProjectEditorKeyboardCallbacks(projectUid));
            dispatch(storeEditorKeyboardCallbacks(projectUid));
        }
    }, [dispatch, projectUid]);

    useEffect(() => {
        document.body.scrollTo(0, 0);
        return () => {
            dispatch(closeTabDock());
            dispatch(closeProject());
        };
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const lastIsManualVisible = sessionStorage.getItem(
            projectUid + ":manualVisible"
        );
        if (!isEmpty(lastIsManualVisible)) {
            if (lastIsManualVisible === "true") {
                dispatch(setManualPanelOpen(true));
            }
            sessionStorage.removeItem(projectUid + ":manualVisible");
        }
        // eslint-disable-next-line
    }, []);

    return (
        <DnDProvider project={activeProject}>
            <style>{`#root {overflow: hidden!important;}
                     body > .ps__rail-x {display:none!important;}
                     body > .ps__rail-y {display:none!important;}`}</style>
            <div css={SS.splitterLayoutContainer}>
                {unsavedDataExitPrompt}
                <SplitterLayout
                    primaryIndex={1}
                    primaryMinSize={400}
                    secondaryInitialSize={250}
                    secondaryMinSize={250}
                >
                    {isFileTreeVisible && <FileTree />}

                    <SplitterLayout
                        horizontal
                        secondaryInitialSize={500}
                        onDragStart={() => setManualDrag(true)}
                        onDragEnd={() => setManualDrag(false)}
                    >
                        {!isConsoleVisible ? (
                            tabDock
                        ) : (
                            <SplitterLayout
                                vertical
                                secondaryInitialSize={250}
                                ref={tabPanelRef}
                                customClassName={"panel-with-tab-dock"}
                            >
                                {tabDock}
                                <Console />
                            </SplitterLayout>
                        )}

                        {isManualVisible && manualWindow}
                    </SplitterLayout>
                </SplitterLayout>
            </div>
        </DnDProvider>
    );
};

export default ProjectEditor;
