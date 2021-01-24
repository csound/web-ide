import React, { CElement, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectIsOwner } from "./selectors";
import { DnDProvider } from "@comp/file-tree/context";
import { CsoundObj } from "@csound/browser";
import { IDocument, IProject } from "@comp/projects/types";
import {
    Tabs,
    DragTabList,
    DragTab,
    PanelList,
    Panel
} from "@hlolli/react-tabtab";
import simpleSwitch from "array-move";
import { subscribeToProjectLastModified } from "@comp/project-last-modified/subscribers";
import {
    subscribeToProfile,
    subscribeToProjectsCount
} from "@comp/profile/subscribers";
import tabStyles from "./tab-styles";
import { Prompt } from "react-router";
import { Beforeunload } from "react-beforeunload";
import Tooltip from "@material-ui/core/Tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import IconButton from "@material-ui/core/IconButton";
import { IOpenDocument } from "./types";
import SplitterLayout from "react-splitter-layout";
import { IStore } from "@store/types";
import Editor from "../editor/editor";
import AudioEditor from "../audio-editor/audio-editor";
import { useTheme } from "@emotion/react";
import { subscribeToProjectChanges } from "@comp/projects/subscribers";
// import { toggleEditorFullScreen } from "../Editor/actions";
import CsoundManualWindow from "./csound-manual";
import FileTree from "../file-tree";
import {
    storeEditorKeyboardCallbacks,
    storeProjectEditorKeyboardCallbacks
} from "@comp/hot-keys/actions";
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
import { mapIndexed, isMobile } from "@root/utils";
import { closeProject } from "../projects/actions";
import { isAudioFile } from "../projects/utils";
import * as SS from "./styles";
import { enableMidiInput, enableAudioInput } from "../csound/actions";
import BottomTabs from "@comp/bottom-tabs/component";
import MobileTabs from "@comp/bottom-tabs/mobile-tabs";
import {
    selectBottomTabIndex,
    selectOpenBottomTabs
} from "../bottom-tabs/selectors";
import { BottomTab } from "../bottom-tabs/types";

const TabStyles = tabStyles(false);

type IEditorForDocumentProperties = {
    uid: any;
    doc: IDocument;
    projectUid: string;
    isOwner: boolean;
};

function EditorForDocument({
    uid,
    projectUid,
    doc,
    isOwner
}: IEditorForDocumentProperties) {
    if (doc.type === "txt") {
        return (
            <Editor
                documentUid={doc.documentUid}
                projectUid={projectUid}
                isOwner={isOwner}
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

type IMainSectionProperties = {
    tabDock: CElement<"div", any>;
};

const MainSection = React.forwardRef(
    (properties: IMainSectionProperties, reference) => {
        const openTabs: BottomTab[] | undefined = useSelector((store: IStore) =>
            selectOpenBottomTabs(store)
        );

        const bottomTabIndex = useSelector((store: IStore) =>
            selectBottomTabIndex(store)
        );

        return (
            <div css={SS.mainTabsSplitter}>
                {!isEmpty(openTabs) && bottomTabIndex > -1 ? (
                    <SplitterLayout
                        vertical
                        secondaryInitialSize={250}
                        ref={reference}
                        customClassName={"main-tab-panels"}
                    >
                        {properties.tabDock}
                        <BottomTabs />
                    </SplitterLayout>
                ) : (
                    properties.tabDock
                )}
            </div>
        );
    }
);

MainSection.displayName = "MainSection";

const ProjectEditor = ({
    activeProject,
    csound
}: {
    activeProject: IProject;
    csound: CsoundObj;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    // The manual is an iframe, which doesn't detect
    // mouse positions, so we add an invidible layer then
    // resizing the manual panel.
    const [manualDrag, setManualDrag] = useState(false);

    const projectUid: string = propOr("", "projectUid", activeProject);
    const projectOwnerUid: string = propOr("", "userUid", activeProject);
    const isOwner: boolean = useSelector(selectIsOwner(projectUid));
    const tabPanelReference = useRef();

    useEffect(() => {
        // start at top on init
        // in this case, prevent
        // jumpy behavior
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
    }, []);

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

        // get some metadata from other people's projects
        const unsubscribeToProfile =
            !isOwner && subscribeToProfile(projectOwnerUid, dispatch);

        const unsubscribeToProjectsCount =
            !isOwner && subscribeToProjectsCount(projectOwnerUid, dispatch);

        return () => {
            unsubscribeProjectChanges();
            unsubscribeToProjectLastModified();
            unsubscribeToProfile && unsubscribeToProfile();
            unsubscribeToProjectsCount && unsubscribeToProjectsCount();
        };
    }, [csound, dispatch, isOwner, projectOwnerUid, projectUid]);

    useEffect(() => {
        dispatch(enableMidiInput());
        dispatch(enableAudioInput());
    }, [dispatch]);

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
        (accumulator: IDocument[], tabDocument: IOpenDocument) => {
            const maybeDocument = pathOr(
                {} as IDocument,
                ["documents", propOr("", "uid", tabDocument)],
                activeProject
            );
            return maybeDocument
                ? append(maybeDocument, accumulator)
                : accumulator;
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
        const documentPathHuman = append(
            document.filename,
            (document.path || []).map((documentUid) =>
                pathOr(
                    "<unknown>",
                    ["documents", documentUid, "filename"],
                    activeProject
                )
            )
        ).join("/");
        return (
            <DragTab closable={true} key={index}>
                <Tooltip
                    placement="right-end"
                    title={
                        document && document.path
                            ? document.path.length > 0
                                ? documentPathHuman
                                : document.filename
                            : ""
                    }
                >
                    <p style={{ margin: 0 }}>
                        {document
                            ? document.filename +
                              (isOwner && isModified ? "*" : "")
                            : ""}
                    </p>
                </Tooltip>
                <Tooltip title={"close"} placement="right-end">
                    <IconButton
                        size="small"
                        css={SS.closeButton}
                        onClick={(event) => {
                            event.stopPropagation();
                            closeTab(document.documentUid, isModified);
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faTimes}
                            size="sm"
                            color={
                                isActive
                                    ? theme.textColor
                                    : theme.unfocusedTextColor
                            }
                        />
                    </IconButton>
                </Tooltip>
            </DragTab>
        );
    }, openDocuments as IDocument[]);

    const openTabPanels = mapIndexed(
        (document_: any, index: number) => (
            <Panel key={index}>
                <EditorForDocument
                    uid={activeProject.userUid}
                    projectUid={projectUid}
                    isOwner={isOwner}
                    doc={document_}
                />
            </Panel>
        ),
        openDocuments
    );

    const switchTab = (index: number) => {
        localStorage.setItem(projectUid + ":tabIndex", `${index}`);
        dispatch(tabSwitch(index));
    };

    const someUnsavedData: boolean = isOwner
        ? !!find(
              openDocuments,
              (document_: IDocument) => document_.isModifiedLocally === true
          )
        : false;

    const unsavedDataExitText =
        "You still have unsaved changes, are you sure you want to quit?";
    const unsavedDataExitPrompt = someUnsavedData && (
        <React.Fragment>
            <Beforeunload onBeforeunload={() => unsavedDataExitText} />
            <Prompt when={someUnsavedData} message={unsavedDataExitText} />
        </React.Fragment>
    );

    const tabDock = isEmpty(openDocuments) ? (
        <div style={{ position: "relative" }} />
    ) : (
        <Tabs
            activeIndex={Math.min(tabIndex, tabDockDocuments.length - 1)}
            onTabChange={switchTab}
            customStyle={TabStyles}
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
            <DragTabList id="drag-tab-list">{openTabList}</DragTabList>
            <PanelList>{openTabPanels}</PanelList>
        </Tabs>
    );

    const isManualVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.manualVisible
    );

    const isFileTreeVisible = useSelector(
        (store: IStore) => store.ProjectEditorReducer.fileTreeVisible
    );

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
    }, [dispatch, projectUid]);

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
    }, [dispatch]);

    return isMobile() ? (
        <MobileTabs
            activeProject={activeProject}
            projectUid={projectUid}
            tabDock={tabDock}
        />
    ) : (
        <DnDProvider project={activeProject}>
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
                        <MainSection
                            ref={tabPanelReference}
                            tabDock={tabDock}
                        />
                        {isManualVisible && (
                            <CsoundManualWindow
                                manualDrag={manualDrag}
                                projectUid={projectUid}
                            />
                        )}
                    </SplitterLayout>
                </SplitterLayout>
            </div>
        </DnDProvider>
    );
};

export default ProjectEditor;
