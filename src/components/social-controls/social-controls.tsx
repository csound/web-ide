import React, { useEffect } from "react";
import { useDispatch, useSelector } from "@root/store";
import * as SS from "./styles";
import { subscribeToProjectStars } from "./subscribers";
import Tooltip from "@mui/material/Tooltip";
import { IconButton } from "@mui/material";
import { exportProject, markProjectPublic } from "@comp/projects/actions";
import StarIcon from "@mui/icons-material/Star";
import OutlinedStarIcon from "@mui/icons-material/StarBorderOutlined";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ShareIcon from "@mui/icons-material/Share";
import styled from "@emotion/styled";
import {
    selectUserStarredProject,
    selectActiveProjectUid,
    selectProjectPublic
} from "./selectors";
import {
    selectLoggedInUid,
    selectLoginRequesting
} from "@comp/login/selectors";

import { starOrUnstarProject } from "@comp/profile/actions";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { openSimpleModal } from "../modal/actions";

const StyledIconButton = styled(IconButton)`
    && {
        border-radius: 0;
        padding: 2px;
    }
`;
const StyledDownloadIcon = styled(CloudDownloadIcon)`
    && {
        fill: ${(properties) => properties.theme.altTextColor};
    }
`;
const StyledStarIcon = styled(StarIcon)`
    && {
        fill: ${(properties) => properties.theme.starActive};
    }
`;

const StyledOutlinedStarIcon = styled(OutlinedStarIcon)`
    && {
        fill: ${(properties) => properties.theme.altTextColor};
    }
`;

const StyledShareIcon = styled(ShareIcon)`
    && {
        fill: ${(properties) => properties.theme.altTextColor};
    }
`;

const StyledPublicIcon = styled(VisibilityIcon)`
    && {
        fill: ${(properties) => properties.theme.altTextColor};
    }
`;

const StyledPublicOffIcon = styled(VisibilityOffIcon)`
    && {
        fill: ${(properties) => properties.theme.altTextColor};
    }
`;

const SocialControls = ({ activeProjectUid }: { activeProjectUid: string }) => {
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const starred = useSelector(
        selectUserStarredProject(loggedInUserUid, activeProjectUid)
    );
    const isRequestingLogin = useSelector(selectLoginRequesting);
    const isOwner = useSelector(selectIsOwner);
    const isPublic = useSelector(selectProjectPublic);
    const dispatch = useDispatch();

    useEffect(() => {
        if (activeProjectUid && !isRequestingLogin && loggedInUserUid) {
            const unsubscribe = subscribeToProjectStars(
                activeProjectUid,
                dispatch
            );
            return unsubscribe;
        }
    }, [activeProjectUid, isRequestingLogin, loggedInUserUid, dispatch]);

    return (
        <>
            {!isOwner && isPublic && (
                <Tooltip title="Download project as Zip" placement="bottom-end">
                    <div css={SS.buttonContainer}>
                        <StyledIconButton
                            size="medium"
                            onClick={() => {
                                dispatch(exportProject());
                            }}
                        >
                            <StyledDownloadIcon fontSize="large" />
                        </StyledIconButton>
                    </div>
                </Tooltip>
            )}
            {isPublic && (
                <Tooltip title={`Share this project`} placement="bottom-end">
                    <div css={SS.buttonContainer}>
                        <StyledIconButton
                            size="medium"
                            onClick={() => {
                                dispatch(openSimpleModal("share-dialog", {}));
                            }}
                        >
                            <StyledShareIcon fontSize="large" />
                        </StyledIconButton>
                    </div>
                </Tooltip>
            )}
            <Tooltip
                title={`${starred ? "un" : ""}star`}
                placement="bottom-end"
            >
                <div css={SS.buttonContainer}>
                    <StyledIconButton
                        size="medium"
                        onClick={() => {
                            if (activeProjectUid && loggedInUserUid) {
                                dispatch(
                                    starOrUnstarProject(
                                        activeProjectUid,
                                        loggedInUserUid
                                    )
                                );
                            }
                        }}
                    >
                        {starred ? (
                            <StyledStarIcon fontSize="large" />
                        ) : (
                            <StyledOutlinedStarIcon fontSize="large" />
                        )}
                    </StyledIconButton>
                </div>
            </Tooltip>
            {isOwner && (
                <Tooltip title={isPublic ? "Hide project" : "Unhide project"}>
                    <div css={SS.buttonContainer}>
                        <StyledIconButton
                            size="medium"
                            onClick={() => {
                                if (typeof activeProjectUid === "string") {
                                    dispatch(
                                        markProjectPublic(
                                            activeProjectUid,
                                            !isPublic
                                        )
                                    );
                                }
                            }}
                        >
                            {isPublic ? (
                                <StyledPublicIcon fontSize="large" />
                            ) : (
                                <StyledPublicOffIcon fontSize="large" />
                            )}
                        </StyledIconButton>
                    </div>
                </Tooltip>
            )}
        </>
    );
};

export default SocialControls;
