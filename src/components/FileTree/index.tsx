import React, { useState, useCallback } from "react";
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

// Use import if/when they add type declerations
const getNodeDataByPath = require("material-ui-tree/lib/util").default;
const Tree = require("material-ui-tree").default;

const FileTree = () => {
    const classes = useStyles({});
    const [state, setState] = useState({
        alignRight: false,
        data: {
            path: "example-collection",
            type: "tree",
        },


        // [
        //     {
        //         path: "ScratchPad",
        //         type: "blob",
        //     },
        //
        // ]
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

    const getActionsData = useCallback(
        (data, path, unfoldStatus) => {
            const { type } = data;
            if (type === "tree") {
                if (!unfoldStatus) {
                    return null;
                }
                return {
                    icon: <AddIcon className={classes.icon} />,
                    label: "new",
                    hint: "Insert file",
                    onClick: () => {
                        const treeData = Object.assign({}, state.data);
                        const nodeData = getNodeDataByPath(treeData, path, "tree");
                        if (
                            !Reflect.has(nodeData, "tree") ||
                            !Reflect.has(nodeData.tree, "length")
                        ) {
                            nodeData.tree = [];
                        }
                        nodeData.tree.push({
                            path: "new file",
                            type: "blob",
                            sha: Math.random()
                        });
                        setState({ ...state, data: treeData });
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
        [classes, state, setState]
    );

    const requestChildrenData = useCallback(
        (data, path, toggleFoldStatus) => {
            const { type } = data;
            if (type === "tree") {
                // GET DATA HERE
                // state;
                // setState;
            } else {
                toggleFoldStatus();
            }
        },
        []
        // [state, setState]
    );

    return (
        <Tree
            className={classes.container}
            data={state.data}
            labelKey="path"
            valueKey="sha"
            childrenKey="tree"
            foldIcon={<ArrowDropDownIcon />}
            unfoldIcon={<ArrowDropUpIcon />}
            loadMoreIcon={<MoreHorizIcon />}
            renderLabel={renderLabel}
            renderLoadMoreText={(page: number, pageSize: number, total: number) =>
                `Loaded: ${(page + 2) *
            pageSize} / Total: ${total}. Click here to load more...`
            }
            pageSize={10}
            actionsAlignRight={false}
            getActionsData={getActionsData}
            requestChildrenData={requestChildrenData}
        />
    );
};

export default FileTree;
