import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { Prompt } from "react-router";
import { Beforeunload } from "react-beforeunload";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { IDocument, IProject } from "../Projects/types";
import { IOpenDocument } from "./types";
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
import { append, reduce, pathOr, propOr } from "ramda";
import { find, isEmpty } from "lodash";
import "react-tabs/style/react-tabs.css";
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

    // The manual is an iframe, which doesn't detect
    // mouve positions, so we add an invidible layer then
    // resizing the manual panel.
    const [manualDrag, setManualDrag] = React.useState(false);
    const activeProject: IProject = props.activeProject;

    const projectUid: string = propOr("", "projectUid", activeProject);

    const tabDockDocuments: IOpenDocument[] = useSelector(s =>
        pathOr(
            [] as IOpenDocument[],
            ["ProjectEditorReducer", "tabDock", "openDocuments"],
            s
        )
    );

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

    const tabIndex: number = useSelector(
        pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"])
    );

    const closeTab = (documentUid, isModified) => {
        dispatch(tabClose(projectUid, documentUid, isModified));
    };

    const openTabList = mapIndexed(
        (document: any, index) => {
            const isActive: boolean = index === tabIndex;
            const isModified: boolean = document.isModifiedLocally;
            return (
                <Tab key={index}>
                    {document!.filename + (isModified ? "*" : "")}
                    <Tooltip title="close" placement="right-end">
                        <IconButton
                            size="small"
                            style={{ marginLeft: 6, marginBottom: 2 }}
                            onClick={e => {
                                e.stopPropagation();
                                closeTab(document.documentUid, isModified);
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
        },
        openDocuments as IDocument[]
    );

    const openTabPanels = mapIndexed(
        (doc: any, index: number) => (
            <TabPanel key={index} style={{ flex: "1 1 auto", marginTop: -10 }}>
                <EditorForDocument
                    uid={activeProject.userUid}
                    projectUid={projectUid}
                    doc={doc}
                />
            </TabPanel>
        ),
        openDocuments
    );

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
        <div />
    ) : (
        <div>
            {tabPanelController}
            <Tabs
                onSelect={switchTab}
                selectedIndex={tabIndex}
                className={"react-tabs"}
                css={SS.tabDock}
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

    React.useEffect(() => {
        return () => {
            dispatch(closeTabDock());
            dispatch(closeProject());
            localStorage.setItem(
                projectUid + ":secondaryPanel",
                secondaryPanel || ""
            );
        };
        // eslint-disable-next-line
    }, []);

    React.useEffect(() => {
        const lastSecondaryPanel = localStorage.getItem(
            projectUid + ":secondaryPanel"
        );
        if (!isEmpty(lastSecondaryPanel)) {
            if (lastSecondaryPanel === "manual") {
                dispatch(setManualPanelOpen(true));
            }
            localStorage.removeItem(projectUid + ":secondaryPanel");
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
