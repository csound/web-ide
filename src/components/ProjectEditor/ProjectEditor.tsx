import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { Beforeunload } from "react-beforeunload";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { IDocument } from "../Projects/types";
import SplitterLayout from "react-splitter-layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTimes,
    faExpand,
    faWindowRestore
} from "@fortawesome/free-solid-svg-icons";
import { IStore } from "../../db/interfaces";
import Editor from "../Editor/Editor";
import { toggleEditorFullScreen } from "../Editor/actions";
import FileTree from "../FileTree";
import Console from "../Console/Console";
import { isEmpty, reduce } from "lodash";
import "react-tabs/style/react-tabs.css";
import "react-splitter-layout/lib/index.css";
import { tabClose, tabSwitch } from "./actions";

const ProjectEditor = props => {
    const dispatch = useDispatch();

    const projectUid: string = useSelector(
        (store: IStore) => store.projects.activeProject!.projectUid!
    );

    const tabDockDocuments = useSelector(
        (store: IStore) =>
            store.ProjectEditorReducer.tabDock.openDocuments || []
    );

    const openDocuments: IDocument[] = useSelector((store: IStore) =>
        reduce(
            tabDockDocuments,
            (acc, tabDoc) => {
                const maybeDoc = store.projects.activeProject!.documents[
                    tabDoc.uid
                ];
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

    const openTabPanels = openDocuments.map(
        (document: IDocument, index: number) => (
            <TabPanel key={index} style={{ flex: "1 1 auto", marginTop: -10 }}>
                <Editor
                    documentUid={document.documentUid}
                    projectUid={projectUid}
                />
            </TabPanel>
        )
    );

    const tabPanelController = (
        <div className="tab-panel-controller">
            <Tooltip title="Undock" placement="right-end">
                <IconButton size="small">
                    <FontAwesomeIcon
                        icon={faWindowRestore}
                        size="sm"
                        color="#f8f8f2"
                    />
                </IconButton>
            </Tooltip>
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
        <Beforeunload onBeforeunload={() => unsavedDataExitText} />
    );

    const tabDock = isEmpty(openDocuments) ? (
        <div />
    ) : (
        <div key="b" data-grid={{ x: 3, y: 0, w: 9, h: 18 }}>
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
                <SplitterLayout vertical secondaryInitialSize={250}>
                    {tabDock}
                    <Console />
                </SplitterLayout>
            </SplitterLayout>
        </div>
    );
};

export default ProjectEditor;
