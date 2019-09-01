// import React, { useEffect, useState } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { IDocument, IProject } from "../Projects/types";
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
import { find, isEmpty } from "lodash";
import { filterUndef } from "../../utils";
import "react-tabs/style/react-tabs.css";
import "react-splitter-layout/lib/index.css";

const Layout = props => {
    // const [dimensions, setDimensions] = useState({
    //     innerWidth: window.innerWidth,
    //     innerHeight: window.innerHeight
    // });

    // useEffect(() => {
    //     const onWindowResize = () => {
    //         setDimensions({
    //             innerWidth: window.innerWidth,
    //             innerHeight: window.innerHeight
    //         });
    //     };
    //
    //     window.addEventListener("resize", onWindowResize);
    //
    //     return () => {
    //         window.removeEventListener("resize", onWindowResize);
    //     };
    // });

    const dispatch = useDispatch();

    const activeProjectUid: string = useSelector(
        (store: IStore) => store.ProjectsReducer.activeProjectUid
    );

    const project: IProject = useSelector((store: IStore) =>
        find(
            store.ProjectsReducer.projects,
            p => p.projectUid === activeProjectUid
        )
    );

    const tabDockDocuments = useSelector(
        (store: IStore) =>
            store.LayoutReducer.sessions[activeProjectUid].tabDock.openDocuments
    );

    const openDocumentsUnfilt: (IDocument | undefined)[] = tabDockDocuments.map(
        openDocument =>
            find(
                Object.values(project.documents),
                d => d.documentUid === openDocument.uid
            )
    );

    const openDocuments: IDocument[] = filterUndef(
        openDocumentsUnfilt
    ) as IDocument[];

    const tabIndex: number = useSelector(
        (store: IStore) =>
            store.LayoutReducer.sessions[activeProjectUid].tabDock.tabIndex
    );

    const closeTab = (documentUid, projectUid) => {
        dispatch({
            type: "TAB_CLOSE",
            documentUid,
            projectUid
        });
    };

    const openTabList = openDocuments.map(
        (document: IDocument | undefined, index: number) => {
            const isActive: boolean = index === tabIndex;
            return (
                <Tab key={index}>
                    {document!.filename}
                    <Tooltip title="close" placement="right-end">
                        <IconButton
                            size="small"
                            style={{ marginLeft: 6, marginBottom: 2 }}
                            onClick={e => {
                                e.stopPropagation();
                                closeTab(
                                    document!.documentUid,
                                    activeProjectUid
                                );
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
                    currentDocumentValue={document.currentValue}
                    documentUid={document.documentUid}
                    projectUid={project.projectUid}
                    savedValue={document.savedValue}
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
        dispatch({
            type: "TAB_DOCK_SWITCH_TAB",
            projectUid: activeProjectUid,
            tabIndex: index
        });
    };

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
    );
};

export default Layout;
