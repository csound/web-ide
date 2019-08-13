import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { IDocument, IProject } from "../Projects/interfaces";
import { IStore } from "../../db/interfaces";
import Editor from "../Editor/Editor";
import FileTree from "../FileTree";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
// import AddIcon from "@material-ui/icons/Add";
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

    const activeProject: number = useSelector((store: IStore) => store.ProjectsReducer.activeProject);

    const project: IProject = useSelector((store: IStore) => store.ProjectsReducer.projects[activeProject]);

    const openTabList = project.documents.map((document: IDocument, index: number) => (
        <Tab key={index}>{document.name}</Tab>
    ));

    // openTabList.push(<Tab key="close"><AddIcon style={{height: 12}} /></Tab>)

    const openTabPanels = project.documents.map((document: IDocument, index: number) => (
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
                <Tabs>
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
