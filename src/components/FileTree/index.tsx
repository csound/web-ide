import React, { useState, useCallback } from "react";
import { connect, useSelector, useDispatch } from "react-redux";
// import Switch from "@material-ui/core/Switch";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import FolderIcon from "@material-ui/icons/Folder";
import SettingsIcon from "@material-ui/icons/Settings";
import DescriptionIcon from "@material-ui/icons/Description";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { Typography } from "@material-ui/core";
import useStyles from "./styles";
import { IDocument, IProject } from "../Projects/interfaces";
import { newDocument } from "../Projects/actions";
import { tabOpenByDocumentUid } from "../Layout/actions";
import { IStore } from "../../db/interfaces";
// import { find, findIndex } from "lodash";

// Use import if/when they add type declerations
const getNodeDataByPath = require("material-ui-tree/lib/util").default;
const Tree = require("material-ui-tree").default;

interface IFileTreeProps {
    projects: IProject[];
}

const initialSelectBlock: any = {};

const FileTree = () => {

    const activeProjectUid: string = useSelector((store: IStore) => store.ProjectsReducer.activeProjectUid);
    const project: IProject = useSelector((store: IStore) => store.ProjectsReducer.projects[activeProjectUid]);
    const documents: {[documentUid: string]: IDocument} = useSelector((store: IStore) => store.ProjectsReducer.projects[activeProjectUid].documents);

    const dispatch = useDispatch();

    const classes = useStyles({});

    const fileTreeDocs = Object.values(documents).map((document: IDocument, index: number) => {
        return {
            path: document.name,
            type: "blob",
            sha: document.documentUid,
        }
    });

    const [state, setState] = useState({
        project,
        expandAll: false,
        alignRight: false,
        unfoldAll: false,
        unfoldFirst: false,
        data: {
            unfoldFirst: false,
            unfoldAll: false,
            path: project.name,
            type: "tree",
            tree: fileTreeDocs,
            sha: Math.random(),
        },
    });

    if (fileTreeDocs.length !== state.data.tree.length) {
        state.data.tree = fileTreeDocs;
        setState(state);
    }

    const renderLabel = useCallback(
            (data, unfoldStatus) => {
                const { path, type } = data;
                let textClassName: "active" | "inactive" | "closed" = "inactive";
                let variant: "body1" | "body2" = "body1";
                let iconComp = null;
                if (type === "tree") {
                    iconComp = unfoldStatus ? <FolderOpenIcon /> : <FolderIcon />;
                }
                if (type === "blob") {
                    // console.log(activeTabDocUid === data.sha, activeTabDocUid, data.sha)
                    // if (activeTabDocUid === data.sha) {
                    //     secondaryClassName = "active";
                    // }
                    variant = "body2";
                    if (path.startsWith(".") || path.includes("config")) {
                        iconComp = <SettingsIcon />;
                    } else if (path.endsWith(".csd") || path.endsWith(".sco") || path.endsWith(".orc") || path.endsWith(".udo")) {
                        iconComp = <DescriptionIcon />;
                    } else {
                        iconComp = <InsertDriveFileIcon />;
                    }
                }

                return (
                    <Typography variant={variant} className={classes.node}>
                        {React.cloneElement(iconComp, { className: classes.fileIcon })}
                        <span className={classes[textClassName]}>{path}</span>
                    </Typography>
                );
            },
        [classes]
    );

    // const GoldenLayout = useSelector((store: IStore) => store.GoldenLayoutReducer.goldenLayout);

    const getActionsData = useCallback(
        (data, path, unfoldStatus, toggleFoldStatus) => {

            const { type } = data;

            if (type === "blob") {
                if (!initialSelectBlock[data.sha.toString()] && !unfoldStatus) {
                    initialSelectBlock[data.sha.toString()] = true;
                } else {
                    dispatch(tabOpenByDocumentUid(activeProjectUid, data.sha))
                    // console.log("CLICK!?", type, unfoldStatus, data);
                }
                // goldenLayoutActions.openTab(GoldenLayout, data.path);
            }

            if (type === "tree") {
                if (!unfoldStatus) {
                    toggleFoldStatus();
                    return null;
                }
                return {
                    icon: <AddIcon style={{color: "white", zoom: "175%",}} />,
                    label: "new",
                    hint: "Insert file",
                    onClick: () => {
                        dispatch(newDocument(activeProjectUid, "untitled.txt", ""));
                    }
                };
            }
            return [
                {
                    icon: <EditIcon color="secondary" className={classes.editIcon} />,
                    hint: "Rename file",
                    onClick: () => {
                        setState({ ...state });
                    }
                },
                {
                    icon: <DeleteIcon color="secondary" className={classes.deleteIcon} />,
                    hint: "Delete file",
                    onClick: () => {
                        const treeData = Object.assign({}, state.data);
                        const parentData = getNodeDataByPath(
                            treeData,
                            path.slice(0, path.length - 1),
                            "tree"
                        );
                        const lastIndex = path[path.length - 1];
                        parentData.tree.splice(lastIndex, 1);
                        setState({ ...state, data: treeData });
                    }
                }
            ];
        },
        [classes , state, setState, activeProjectUid, dispatch]
    );

    const requestChildrenData = useCallback(
        (data, path, toggleFoldStatus) => {

            const { type } = data;

            if (type === "blob") {
                toggleFoldStatus();
            }
            // if (type === "tree") {
            //     toggleFoldStatus();
            // } else {
            //     toggleFoldStatus();
            // }
        },
        []
        // [state, setState]
    );

    return (
        <Tree
            className={classes.container + " draggable MuiFileTree"}
            data={state.data}
            labelKey="path"
            valueKey="sha"
            childrenKey="tree"
            foldIcon={<ArrowDropDownIcon style={{color: "white"}} fontSize="large" />}
            unfoldIcon={<ArrowDropUpIcon style={{color: "white"}} fontSize="large" />}
            loadMoreIcon={<MoreHorizIcon style={{color: "white"}} fontSize="large" />}
            renderLabel={renderLabel}
            pageSize={10}
            actionsAlignRight={false}
            getActionsData={getActionsData}
            requestChildrenData={requestChildrenData}
        />
    );
};

// const ProjectsFileTree = () => {
//
//     const projects = useSelector((store: IStore) => store.ProjectsReducer.projects);
//
//     const projectTrees = projects.map((project: IProject, index: number) => {
//         return FileTree(project, index)
//     });
//
//     return (
//         <div id="project-trees-container">{projectTrees}</div>
//     )
// }


export default connect(null, {})(FileTree);
