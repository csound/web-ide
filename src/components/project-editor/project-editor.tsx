import React, { useEffect, useState } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { selectIsOwner } from "./selectors";
import { DnDProvider } from "@comp/file-tree/context";
import { NonCloudFile } from "@comp/file-tree/types";
import { IDocument, IProject } from "@comp/projects/types";
import {
    Tabs,
    DragTabList,
    DragTab,
    PanelList,
    Panel
} from "@root/tabtab/index.js";
import { arrayMoveImmutable as simpleSwitch } from "array-move";
import { subscribeToProjectLastModified } from "@comp/project-last-modified/subscribers";
import {
    subscribeToProfile,
    subscribeToProjectsCount
} from "@comp/profile/subscribers";
import tabStyles, { tabListStyle } from "./tab-styles";
import { isAudioFile } from "../projects/utils";
import { Beforeunload } from "react-beforeunload";
import { IOpenDocument } from "./types";
import SplitPane_ from "react-split-pane";
import Editor from "../editor/editor";
import { AudioEditor } from "../audio-editor/audio-editor";
import { subscribeToProjectChanges } from "@comp/projects/subscribers";
import CsoundManualWindow from "./csound-manual";
import { FileTree } from "../file-tree";
import {
    storeEditorKeyboardCallbacks,
    storeProjectEditorKeyboardCallbacks
} from "@comp/hot-keys/actions";
import { pathOr, propOr } from "ramda";
import { find, isEmpty } from "lodash";
import {
    rearrangeTabs,
    tabClose,
    tabSwitch,
    setManualPanelOpen
} from "./actions";
import { mapIndexed, isMobile } from "@root/utils";
import * as SS from "./styles";
import BottomTabs from "@comp/bottom-tabs/component";
import MobileTabs from "@comp/bottom-tabs/mobile-tabs";
import {
    selectBottomTabIndex,
    selectOpenBottomTabs
} from "../bottom-tabs/selectors";
import { BottomTab } from "../bottom-tabs/types";

const TabStyles = tabStyles(false);
const SplitPane = SplitPane_ as any;

type IEditorForDocumentProperties = {
    uid: any;
    doc: IDocument | IOpenDocument;
    projectUid: string;
    isOwner: boolean;
};

type AnyTab = IDocument | IOpenDocument | NonCloudFile;

const MySplit = ({
    primary,
    split,
    minSize,
    maxSize,
    defaultSize,
    onDragStarted,
    onDragFinished,
    children
}: {
    primary: string;
    split: string;
    minSize: string;
    maxSize: string;
    defaultSize: string;
    onDragStarted: () => void;
    onDragFinished: () => void;
    children: React.ReactNode[];
}) => {
    const filteredChildren = children.filter(Boolean);
    return filteredChildren.length === 1 ? (
        filteredChildren[0]
    ) : (
        <SplitPane
            primary={primary}
            split={split}
            minSize={minSize}
            maxSize={maxSize}
            defaultSize={defaultSize}
            onDragStarted={onDragStarted}
            onDragFinished={onDragFinished}
        >
            {filteredChildren}
        </SplitPane>
    );
};

export function EditorForDocument({
    uid,
    projectUid,
    doc
}: IEditorForDocumentProperties) {
    if ((doc as IDocument).type === "txt") {
        return (
            <Editor
                documentUid={(doc as IDocument).documentUid}
                projectUid={projectUid}
            ></Editor>
        );
    } else if (
        (doc as IDocument).type === "bin" &&
        isAudioFile((doc as IDocument).filename)
    ) {
        const path = `${uid}/${projectUid}/${(doc as IDocument).documentUid}`;
        return <AudioEditor audioFileUrl={path} />;
    } else if (
        (doc as IOpenDocument).isNonCloudDocument &&
        (doc as IOpenDocument).nonCloudFileAudioUrl
    ) {
        return (
            <AudioEditor
                audioFileUrl={
                    (doc as IOpenDocument).nonCloudFileAudioUrl as string
                }
            />
        );
    }

    return (
        <div>
            <p>Unknown document type</p>
        </div>
    );
}

const MainSection = ({
    tabDock,
    setIsDragging
}: {
    tabDock: React.ReactElement;
    setIsDragging?: (isDragging: boolean) => void;
}) => {
    const openTabs: BottomTab[] | undefined = useSelector((store: RootState) =>
        selectOpenBottomTabs(store)
    );

    const bottomTabIndex = useSelector((store: RootState) =>
        selectBottomTabIndex(store)
    );
    const showBottomTabs = !isEmpty(openTabs) && bottomTabIndex > -1;

    return (
        <div>
            <SplitPane
                split="horizontal"
                primary="first"
                minSize={showBottomTabs ? "25%" : "100%"}
                defaultSize="75%"
                className={"main-tab-panels"}
                onDragStarted={() => setIsDragging && setIsDragging(true)}
                onDragFinished={() => setIsDragging && setIsDragging(false)}
            >
                {[tabDock, <BottomTabs key="2" />]}
            </SplitPane>
        </div>
    );
};

MainSection.displayName = "MainSection";

const ProjectEditor = ({
    activeProject
}: {
    activeProject: IProject;
}): React.ReactElement => {
    const dispatch = useDispatch();

    // The manual is an iframe, which doesn't detect
    // mouse positions, so we add an invidible layer then
    // resizing the manual panel.
    const [isDragging, setIsDragging] = useState(false);

    const projectUid: string = propOr("", "projectUid", activeProject);
    const projectOwnerUid: string = propOr("", "userUid", activeProject);
    const projectName: string = propOr(
        "Undefined Project",
        "name",
        activeProject
    );
    const isOwner: boolean = useSelector(selectIsOwner);

    useEffect(() => {
        if (document.title !== projectName) {
            document.title = projectName;
        }
    }, [projectName]);

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
            dispatch
        );
        const unsubscribeToProjectLastModified =
            subscribeToProjectLastModified(projectUid);

        // get some metadata from other people's projects
        const unsubscribeToProfile =
            !isOwner && subscribeToProfile(projectOwnerUid, dispatch);

        const unsubscribeToProjectsCount =
            !isOwner && subscribeToProjectsCount(projectOwnerUid, dispatch);

        return () => {
            unsubscribeProjectChanges();
            unsubscribeToProjectLastModified.then((unsub) => unsub());
            unsubscribeToProfile && unsubscribeToProfile();
            unsubscribeToProjectsCount && unsubscribeToProjectsCount();
        };
    }, [dispatch, isOwner, projectOwnerUid, projectUid]);

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

    const openDocuments: AnyTab[] = tabDockDocuments.reduce(
        (accumulator: AnyTab[], tabDocument: IOpenDocument) => {
            const maybeDocument = activeProject.documents[tabDocument.uid];
            const isNonCloudFile = tabDocument.isNonCloudDocument || false;

            return isNonCloudFile
                ? [tabDocument, ...accumulator]
                : maybeDocument && Object.keys(maybeDocument).length > 0
                  ? [maybeDocument, ...accumulator]
                  : accumulator;
        },
        [] as AnyTab[]
    );

    const closeTab = (documentUid: string, isModified: boolean) => {
        dispatch(tabClose(projectUid, documentUid, isModified));
    };

    const openTabList = mapIndexed((document: any, index) => {
        const isModified: boolean = document.isModifiedLocally;
        return (
            <DragTab
                id={"drag-tab-open-" + index}
                closable={true}
                key={index}
                closeCallback={() =>
                    closeTab(document.documentUid || document.uid, isModified)
                }
                currentIndex={tabIndex}
                thisIndex={index}
            >
                <p style={{ margin: 0 }}>
                    {document
                        ? (document.filename || document.name || document.uid) +
                          (isOwner && isModified ? "*" : "")
                        : ""}
                </p>
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
        </React.Fragment>
    );

    const tabDock: React.ReactElement = isEmpty(openDocuments) ? (
        <div key="0" style={{ position: "relative" }} />
    ) : (
        <div key="1" css={tabListStyle}>
            <Tabs
                defaultIndex={Math.min(tabIndex, tabDockDocuments.length - 1)}
                activeIndex={Math.min(tabIndex, tabDockDocuments.length - 1)}
                onTabChange={switchTab}
                customStyle={TabStyles}
                showModalButton={false}
                showArrowButton={"auto"}
                onTabSequenceChange={({
                    oldIndex,
                    newIndex
                }: {
                    oldIndex: number;
                    newIndex: number;
                }) => {
                    dispatch(
                        rearrangeTabs(
                            projectUid,
                            simpleSwitch(tabDockDocuments, oldIndex, newIndex),
                            newIndex
                        )
                    );
                }}
            >
                <DragTabList items={openTabList} />
                <PanelList>{openTabPanels}</PanelList>
            </Tabs>
        </div>
    );

    const isManualVisible = useSelector(
        (store: RootState) => store.ProjectEditorReducer.manualVisible
    );

    const isFileTreeVisible = useSelector(
        (store: RootState) => store.ProjectEditorReducer.fileTreeVisible
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
            storeProjectEditorKeyboardCallbacks(projectUid);
            storeEditorKeyboardCallbacks(projectUid);
        }
    }, [dispatch, projectUid]);

    return isMobile() ? (
        <MobileTabs
            activeProject={activeProject}
            projectUid={projectUid}
            currentDocument={
                openDocuments[tabIndex] as IDocument | IOpenDocument | undefined
            }
        />
    ) : (
        <>
            {unsavedDataExitPrompt}
            <DnDProvider project={activeProject}>
                <div css={SS.splitterRoot}>
                    <MySplit
                        primary="second"
                        split="vertical"
                        minSize="80%"
                        maxSize="0"
                        defaultSize="80%"
                        onDragStarted={() => setIsDragging(true)}
                        onDragFinished={() => setIsDragging(false)}
                    >
                        {isFileTreeVisible && (
                            <FileTree activeProjectUid={projectUid} />
                        )}
                        <MySplit
                            primary="first"
                            split="vertical"
                            minSize="80%"
                            maxSize="0"
                            defaultSize="60%"
                            onDragStarted={() => setIsDragging(true)}
                            onDragFinished={() => setIsDragging(false)}
                        >
                            <MainSection
                                tabDock={tabDock}
                                setIsDragging={setIsDragging}
                            />
                            {isManualVisible && (
                                <CsoundManualWindow
                                    projectUid={projectUid}
                                    isDragging={isDragging}
                                />
                            )}
                        </MySplit>
                    </MySplit>
                </div>
            </DnDProvider>
        </>
    );
};

export default ProjectEditor;
