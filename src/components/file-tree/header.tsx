import React from "react";
import { useDispatch } from "@root/store";
import { IProject } from "../projects/types";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import DisabledByDefaultRoundedIcon from "@mui/icons-material/DisabledByDefaultRounded";
import Tooltip from "@mui/material/Tooltip";
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
}): React.ReactElement => {
    const theme: any = useTheme();
    const dispatch = useDispatch();
    return (
        <div
            id="web-ide-file-tree-header"
            css={windowHeaderStyle}
            style={{ zIndex: 2 }}
        >
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
                                <CreateNewFolderIcon
                                    style={{ fill: theme.textColorAlt }}
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
                            <DisabledByDefaultRoundedIcon
                                style={{ fill: theme.textColorAlt }}
                            />
                        </span>
                    </Tooltip>
                </span>
            </p>
        </div>
    );
};

export default FileTreeHeader;
