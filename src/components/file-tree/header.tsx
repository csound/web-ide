import React from "react";
import { useDispatch } from "react-redux";
import { IProject } from "../projects/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus, faWindowClose } from "@fortawesome/free-solid-svg-icons";
import Tooltip from "@material-ui/core/Tooltip";
import { useTheme } from "@emotion/react";
import { windowHeader as windowHeaderStyle } from "@styles/_common";
import { setFileTreePanelOpen } from "@comp/project-editor/actions";
import { newFolder } from "@comp/projects/actions";
import * as SS from "./styles";

const FileTreeHeader = ({
    project,
    isOwner
}: {
    project: IProject;
    isOwner: boolean;
}) => {
    const theme: any = useTheme();
    const dispatch = useDispatch();
    return (
        <>
            <div css={windowHeaderStyle} style={{ zIndex: 2 }}>
                <p>
                    {project ? project.name : ""}
                    <span css={SS.headIconsContainer}>
                        {isOwner && (
                            <Tooltip title="create new directory">
                                <span
                                    css={SS.newFolderIcon}
                                    onClick={() =>
                                        dispatch(newFolder(project.projectUid))
                                    }
                                >
                                    <FontAwesomeIcon
                                        icon={faFolderPlus}
                                        size="sm"
                                        color={theme.textColorAlt}
                                    />
                                </span>
                            </Tooltip>
                        )}

                        <Tooltip title="close window">
                            <span
                                onClick={() =>
                                    dispatch(setFileTreePanelOpen(false))
                                }
                            >
                                <FontAwesomeIcon
                                    icon={faWindowClose}
                                    size="sm"
                                    color={theme.textColorAlt}
                                />
                            </span>
                        </Tooltip>
                    </span>
                </p>
            </div>
        </>
    );
};

export default FileTreeHeader;
