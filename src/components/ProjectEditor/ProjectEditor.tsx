import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { Prompt } from "react-router";
import { Beforeunload } from "react-beforeunload";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { IDocument, IProject } from "../Projects/types";
import SplitterLayout from "react-splitter-layout";
import IframeComm from "react-iframe-comm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faExpand
    // faWindowRestore
} from "@fortawesome/free-solid-svg-icons";
import { IStore } from "../../db/interfaces";
import Editor from "../Editor/Editor";
import AudioEditor from "../AudioEditor/AudioEditor";
import { toggleEditorFullScreen } from "../Editor/actions";
import FileTree from "../FileTree";
import Console from "../Console/Console";
import { isEmpty, reduce } from "lodash";
import "react-tabs/style/react-tabs.css";
import "react-splitter-layout/lib/index.css";
import {
    closeTabDock,
    tabClose,
    tabSwitch,
    setManualPanelOpen
} from "./actions";
import { filterUndef } from "../../utils";
import { closeProject } from "../Projects/actions";
import { isAudioFile } from "../Projects/utils";
import { selectActiveProject } from "../Projects/selectors";

type EditorForDocumentProps = {
    uid: any;
    doc: IDocument;
    projectUid: string;
};

function EditorForDocument({ uid, projectUid, doc }: EditorForDocumentProps) {
    if (doc.type === "txt") {
        return <Editor documentUid={doc.documentUid} projectUid={projectUid} />;
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

const ProjectEditor = props => {
    const dispatch = useDispatch();

    // The manual is an iframe, which doesn't detect
    // mouve positions, so we add an invidible layer then
    // resizing the manual panel.
    const [manualDrag, setManualDrag] = React.useState(false);

    const activeProject: IProject = useSelector(selectActiveProject)!;

    const projectUid: string = activeProject.projectUid;

    const tabDockDocuments = useSelector(
        (store: IStore) =>
            store.ProjectEditorReducer.tabDock.openDocuments || []
    );

    const openDocuments: IDocument[] = useSelector((store: IStore) =>
        reduce(
            tabDockDocuments,
            (acc, tabDoc) => {
                const maybeDoc = activeProject.documents[tabDoc.uid];
                if (maybeDoc) {
                    acc.push(maybeDoc as IDocument);
                }
                return acc;
            },
            [] as IDocument[]
        )
    );

    const tabIndex: number = useSelector(
        (store: IStore) => store.ProjectEditorReducer.tabDock.tabIndex
    );

    const closeTab = (documentUid, isModified) => {
        dispatch(tabClose(documentUid, isModified));
    };

    const openTabList = openDocuments.map(
        (document: IDocument | undefined, index: number) => {
            const isActive: boolean = index === tabIndex;
            const isModified = document!.isModifiedLocally;
            return (
                <Tab key={index}>
                    {document!.filename + (isModified ? "*" : "")}
                    <Tooltip title="close" placement="right-end">
                        <IconButton
                            size="small"
                            style={{ marginLeft: 6, marginBottom: 2 }}
                            onClick={e => {
                                e.stopPropagation();
                                closeTab(document!.documentUid, isModified);
                            }}
                        >
                            <FontAwesomeIcon
                                icon={faTimes}
                                size="sm"
                                color={isActive ? "black" : "#f8f8f2"}
                            />
                        </IconButton>
                    </Tooltip>
                </Tab>
            );
        }
    );

    const openTabPanels = filterUndef(openDocuments).map(
        (doc: IDocument, index: number) => (
            <TabPanel key={index} style={{ flex: "1 1 auto", marginTop: -10 }}>
                <EditorForDocument
                    uid={activeProject.userUid}
                    projectUid={projectUid}
                    doc={doc}
                />
            </TabPanel>
        )
    );

    // <Tooltip title="Undock" placement="right-end">
    //     <IconButton size="small">
    //         <FontAwesomeIcon
    //             icon={faWindowRestore}
    //             size="sm"
    //             color="#f8f8f2"
    //         />
    //     </IconButton>
    // </Tooltip>

    const tabPanelController = (
        <div className="tab-panel-controller">
            <Tooltip title="FullScreen" placement="right-end">
                <IconButton size="small" onClick={toggleEditorFullScreen}>
                    <FontAwesomeIcon
                        icon={faExpand}
                        size="sm"
                        color="#f8f8f2"
                    />
                </IconButton>
            </Tooltip>
        </div>
    );

    const switchTab = (index: number, lastIndex: number, event: Event) => {
        dispatch(tabSwitch(index));
    };

    const someUnsavedData = openDocuments.some(
        doc => doc.isModifiedLocally === true
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
        <div />
    ) : (
        <div>
            {tabPanelController}
            <Tabs
                onSelect={switchTab}
                selectedIndex={tabIndex}
                style={{ height: "100%", display: "flex", flexFlow: "column" }}
            >
                <TabList
                    className="react-tabs__tab-list draggable"
                    style={{ flex: "0 1 auto" }}
                >
                    {openTabList}
                </TabList>
                {openTabPanels}
            </Tabs>
        </div>
    );

    const manualLookupString = useSelector(
        (store: IStore) => store.ProjectEditorReducer.manualLookupString
    );

    const onManualMessage = evt => {
        // if (typeof evt.data.playCSD === "string") {
        //     playCSD(evt.data.playCSD);
        // }
    };

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

    React.useEffect(() => {
        return () => {
            dispatch(closeTabDock());
            dispatch(closeProject());
            localStorage.setItem(
                projectUid + ":secondaryPanel",
                secondaryPanel || ""
            );
        };
    }, [projectUid, secondaryPanel, dispatch]);

    React.useEffect(() => {
        const lastSecondaryPanel = localStorage.getItem(
            projectUid + ":secondaryPanel"
        );
        if (!isEmpty(lastSecondaryPanel)) {
            if (lastSecondaryPanel === "manual") {
                dispatch(setManualPanelOpen(true));
            }
        }
        // eslint-disable-next-line
    }, [projectUid]);

    return (
        <div>
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
