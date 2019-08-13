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
import DeleteIcon from "@material-ui/icons/Delete";
import { Typography } from "@material-ui/core";
import useStyles from "./styles";
import { IDocument, IProject } from "../Projects/interfaces";
import { newDocument } from "../Projects/actions";
import { IStore } from "../../db/interfaces";

// Use import if/when they add type declerations
const getNodeDataByPath = require("material-ui-tree/lib/util").default;
const Tree = require("material-ui-tree").default;

interface IFileTreeProps {
    projects: IProject[];
}

const FileTree = () => {

    const activeProject: number = useSelector((store: IStore) => store.ProjectsReducer.activeProject);
    const project: IProject = useSelector((store: IStore) => store.ProjectsReducer.projects[activeProject]);
    const dispatch = useDispatch();

    const classes = useStyles({});
    const documents = project.documents.map((document: IDocument, index: number) => {
        return {
            path: document.name,
            type: "blob",
            sha: Math.random(),
        }
    });
    const [state, setState] = useState({
        project,
        expandAll: true,
        alignRight: false,
        unfoldAll: true,
        unfoldFirst: true,
        data: {
            unfoldFirst: true,
            unfoldAll: true,
            path: project.name,
            type: "tree",
            tree: documents,
            sha: Math.random(),
        },
    });

    const renderLabel = useCallback(
        (data, unfoldStatus) => {
            const { path, type } = data;
            let variant: "body1" | "body2" = "body1";
            let iconComp = null;
            if (type === "tree") {
                iconComp = unfoldStatus ? <FolderOpenIcon /> : <FolderIcon />;
            }
            if (type === "blob") {
                variant = "body2";
                if (path.startsWith(".") || path.includes("config")) {
                    iconComp = <SettingsIcon />;
                } else if (path.endsWith(".js")) {
                    iconComp = <DescriptionIcon />;
                } else {
                    iconComp = <InsertDriveFileIcon />;
                }
            }
            return (
                iconComp && (
                    <Typography variant={variant} className={classes.node}>
                        {React.cloneElement(iconComp, { className: classes.icon })}
                        {path}
                    </Typography>
                )
            );
        },
        [classes]
    );

    // const GoldenLayout = useSelector((store: IStore) => store.GoldenLayoutReducer.goldenLayout);

    const getActionsData = useCallback(
        (data, path, unfoldStatus, toggleFoldStatus) => {

            const { type } = data;

            if (type === "blob") {
                // goldenLayoutActions.openTab(GoldenLayout, data.path);
            }

            if (type === "tree") {
                if (!unfoldStatus) {
                    toggleFoldStatus();
                    return null;
                }
                return {
                    icon: <AddIcon style={{color: "white", zoom: "150%",}} />,
                    label: "new",
                    hint: "Insert file",
                    onClick: () => {
                        dispatch(newDocument(activeProject, "untitled.txt", ""))
                        // const treeData = Object.assign({}, state.data);
                        // const nodeData = getNodeDataByPath(treeData, path, "tree");
                        // if (
                        //     !Reflect.has(nodeData, "tree") ||
                        //     !Reflect.has(nodeData.tree, "length")
                        // ) {
                        //     nodeData.tree = [];
                        // }
                        // nodeData.tree.push({
                        //     path: "new file",
                        //     type: "blob",
                        //     sha: Math.random()
                        // });
                        // setState({ ...state, data: treeData });
                    }
                };
            }
            return [
                {
                    icon: <DeleteIcon color="secondary" className={classes.icon} />,
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
        [classes , state, setState, activeProject, dispatch]
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
            className={classes.container + " draggable"}
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
