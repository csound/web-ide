import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { IDocument, IProject } from "../Projects/interfaces";
import { ISession } from "./interfaces";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { IStore } from "../../db/interfaces";
import Editor from "../Editor/Editor";
import FileTree from "../FileTree";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
import { find } from "lodash";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "react-tabs/style/react-tabs.css";

const Layout = () => {

    const [dimensions, setDimensions] = useState({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
    });

    useEffect(() => {
        const onWindowResize = () => {
            setDimensions({
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
            })
        }

        window.addEventListener('resize', onWindowResize);

        return () => {
            window.removeEventListener('resize', onWindowResize);
        };
    });

    const dispatch = useDispatch();

    const activeProjectUid: string = useSelector((store: IStore) => store.ProjectsReducer.activeProjectUid);

    const project: IProject = useSelector((store: IStore) => find(store.ProjectsReducer.projects, p => p.projectUid === activeProjectUid));

    const session: ISession = useSelector((store: IStore) => find(store.LayoutReducer.sessions, s => s.projectUid === activeProjectUid));

    const openDocuments: IDocument[] = session.tabDock.openDocumentUids.map((documentUid: string) =>
        find(project.documents, d => d.documentUid === documentUid));

    const tabIndex: number = useSelector((store: IStore) => find(store.LayoutReducer.sessions, s => s.projectUid === activeProjectUid).tabDock.tabIndex);

    const openTabList = openDocuments.map((document: IDocument, index: number) => {
        const isActive: boolean = (index === tabIndex);
        return (
            <Tab key={index}>{document.name}
                <Tooltip title="close" placement="right-end">
                    <IconButton size="small" style={{marginLeft: 6, marginBottom: 2}}>
                        <FontAwesomeIcon icon={faTimes} size="sm" color={isActive ? "black" : "white"} />
                    </IconButton>
                </Tooltip>
            </Tab>
        )
    });

    const openTabPanels = openDocuments.map((document: IDocument, index: number) => (
        <TabPanel key={index}>
            <Editor
                currentDocumentValue={document.currentValue}
                documentUid={document.documentUid}
                projectUid={project.projectUid}
                savedValue={document.savedValue}
            />
        </TabPanel>
    ));


    return (
        <ResponsiveGridLayout
            className="layout"
            draggableHandle=".draggable"
            autoSize={false}
            containerHeight={600}
            width={dimensions.innerWidth}
            breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
            cols={{lg: 12, md: 12, sm: 12, xs: 12, xxs: 12}}
            rowHeight={24}
        >
            <div key="a" data-grid={{x: 0, y: 0, w: 3, h: 24, minW: 3}}>
                <FileTree  />
            </div>
            <div key="b" data-grid={{x: 3, y: 0, w: 9, h: 18}}>
                <Tabs defaultIndex={tabIndex} onSelect={(index: number) => dispatch({
                    type: "TAB_DOCK_SWITCH_TAB",
                    projectUid: activeProjectUid,
                    tabIndex: index
                })}>
                    <TabList className="react-tabs__tab-list draggable">
                        {openTabList}
                    </TabList>
                    {openTabPanels}
                </Tabs>
            </div>
        </ResponsiveGridLayout>
    )
}


export default Layout;
