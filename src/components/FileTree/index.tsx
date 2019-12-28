import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import ArrowDropUpIcon from "@material-ui/icons/ArrowDropUp";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import FolderIcon from "@material-ui/icons/Folder";
import SettingsIcon from "@material-ui/icons/Settings";
import DescriptionIcon from "@material-ui/icons/Description";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/EditTwoTone";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import * as SS from "./styles";
import { IDocument, IDocumentsMap, IProject } from "../Projects/types";
import { newDocument, deleteFile, renameDocument } from "../Projects/actions";
import { tabOpenByDocumentUid } from "../ProjectEditor/actions";
import {
    assocPath,
    equals,
    pathOr,
    propOr,
    type as Rtype,
    values
} from "ramda";
import Tree, {
    MuiTreeData,
    MuiTreeLabelButtonData,
    MuiTreeIconButtonData
} from "material-ui-tree";
import { sortBy } from "lodash";

const muiTheme = createMuiTheme();

const FileTree = () => {
    const activeProjectUid = useSelector(
        pathOr("", ["ProjectsReducer", "activeProjectUid"])
    );

    const project: IProject | null = useSelector(
        pathOr(null, ["ProjectsReducer", "projects", activeProjectUid])
    );

    const documents: IDocumentsMap | null = useSelector(
        pathOr(null, [
            "ProjectsReducer",
            "projects",
            activeProjectUid,
            "documents"
        ])
    );

    const dispatch = useDispatch();

    const fileTreeDocs = documents
        ? sortBy(
              values(documents).map((document: IDocument, index: number) => {
                  return {
                      path: document.filename,
                      type: "blob",
                      sha: document.documentUid
                  };
              }),
              [
                  function(d) {
                      return d.path;
                  }
              ]
          )
        : null;

    const [state, setState] = useState({
        expandAll: false,
        alignRight: false,
        unfoldAll: false,
        unfoldFirst: false,
        data: {
            unfoldFirst: false,
            unfoldAll: false,
            path: project ? (project as IProject).name : "",
            type: "tree",
            tree: fileTreeDocs || [],
            sha: Math.random()
        }
    });

    if (!equals(state.data.tree, fileTreeDocs)) {
        setState(assocPath(["data", "tree"], fileTreeDocs));
    }

    const renderLabel = useCallback(
        (data, unfoldStatus) => {
            if (!project) return <></>;
            const { path, type } = data;
            const rootDirectoryElem = path === (project as IProject).name;
            let IconComp: any;
            if (type === "tree") {
                if (rootDirectoryElem) {
                    IconComp = FolderOpenIcon;
                } else {
                    IconComp = unfoldStatus ? FolderOpenIcon : FolderIcon;
                }
            }
            if (type === "blob") {
                if (Rtype(data.sha) !== "String") return <></>;
                // variant = "body2";
                if (path.startsWith(".") || path.includes("config")) {
                    IconComp = SettingsIcon;
                } else if (
                    path.endsWith(".csd") ||
                    path.endsWith(".sco") ||
                    path.endsWith(".orc") ||
                    path.endsWith(".udo") ||
                    false
                ) {
                    IconComp = DescriptionIcon;
                } else {
                    IconComp = InsertDriveFileIcon;
                }
            }

            const onFileClick = e => {
                dispatch(tabOpenByDocumentUid(data.sha));
            };
            return (
                <>
                    {rootDirectoryElem ? (
                        <div
                            css={SS.invisibleUnClickableArea}
                            onMouseEnter={e => {
                                e.nativeEvent.stopImmediatePropagation();
                                e.preventDefault();
                            }}
                            onMouseOver={e => {
                                e.nativeEvent.stopImmediatePropagation();
                                e.preventDefault();
                            }}
                            onClick={e => {
                                e.nativeEvent.stopImmediatePropagation();
                                e.preventDefault();
                            }}
                        />
                    ) : (
                        <div
                            css={SS.invisibleClickableArea}
                            onClick={onFileClick}
                        />
                    )}

                    <span css={SS.fileTreeNode} onClick={onFileClick}>
                        <IconComp css={SS.fileIcon} onClick={onFileClick} />
                        <p onClick={onFileClick} css={SS.fileTreeNodeText}>
                            {path}
                        </p>
                    </span>
                </>
            );
        },
        [dispatch, project]
    );

    const getActionsData = useCallback(
        (
            data: MuiTreeData,
            path: number[],
            unfoldStatus: boolean,
            toggleFoldStatus: () => void
        ): (MuiTreeLabelButtonData | MuiTreeIconButtonData)[] => {
            const { type } = data;
            if (type === "tree") {
                if (!unfoldStatus) {
                    toggleFoldStatus();
                }
                return {
                    icon: <AddIcon style={{ display: "none" }} />,
                    label: "",
                    hint: "Insert file",
                    onClick: () =>
                        project &&
                        dispatch(
                            newDocument((project as IProject).projectUid, "")
                        )
                } as any;
            }
            return [
                {
                    icon: <EditIcon css={SS.editIcon} />,
                    hint: `Rename ${propOr("", "path", data)}`,
                    onClick: () =>
                        dispatch(
                            renameDocument(
                                propOr("", "sha", data),
                                propOr("", "path", path)
                            )
                        )
                },
                {
                    icon: <DeleteIcon color="secondary" css={SS.deleteIcon} />,
                    hint: `Delete ${propOr("", "path", data)}`,
                    onClick: () => {
                        typeof data.sha === "string" &&
                            dispatch(deleteFile(data.sha));
                    }
                }
            ] as MuiTreeIconButtonData[];
        },
        [project, dispatch]
    );

    const requestChildrenData = useCallback((data, path, toggleFoldStatus) => {
        const { type } = data;

        if (type === "blob") {
            toggleFoldStatus();
        }
    }, []);

    return (
        <ThemeProvider theme={muiTheme}>
            <Tree
                className={" MuiFileTree"}
                css={SS.container}
                data={state.data}
                labelKey="path"
                valueKey="sha"
                childrenKey="tree"
                foldIcon={
                    <ArrowDropDownIcon
                        style={{ color: "white" }}
                        fontSize="large"
                    />
                }
                unfoldIcon={
                    <ArrowDropUpIcon
                        style={{ color: "white" }}
                        fontSize="large"
                    />
                }
                loadMoreIcon={
                    <MoreHorizIcon
                        style={{ color: "white" }}
                        fontSize="large"
                    />
                }
                renderLabel={renderLabel}
                pageSize={99999}
                actionsAlignRight={false}
                getActionsData={getActionsData}
                requestChildrenData={requestChildrenData}
            />
        </ThemeProvider>
    );
};

export default FileTree;
