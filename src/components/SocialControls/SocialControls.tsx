import React, { useEffect } from "react";
import * as SS from "./styles";
import { subscribeToProjectStars } from "./subscribers";
import Tooltip from "@material-ui/core/Tooltip";
import { useSelector, useDispatch } from "react-redux";
import { IconButton } from "@material-ui/core";
import StarIcon from "@material-ui/icons/Star";
import OutlinedStarIcon from "@material-ui/icons/StarBorderOutlined";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import ShareIcon from "@material-ui/icons/Share";
import styled from "styled-components";
import {
    selectUserStarredProject,
    selectActiveProjectUid,
    selectProjectPublic
} from "./selectors";
import { selectLoggedInUid } from "@comp/Login/selectors";
import { selectLoginRequesting } from "@comp/Login/selectors";
import { markProjectPublic } from "../Projects/actions";
import { starOrUnstarProject } from "@comp/Profile/actions";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import { openSimpleModal } from "../Modal/actions";
import ShareDialog from "../ShareDialog";

const StyledIconButton = styled(IconButton)`
    && {
        border-radius: 0;
        padding: 2px;
    }
`;
const StyledStarIcon = styled(StarIcon)`
    && {
        fill: ${props => props.theme.starActive};
    }
`;

const StyledOutlinedStarIcon = styled(OutlinedStarIcon)`
    && {
        fill: ${props => props.theme.starInactive};
    }
`;

const StyledShareIcon = styled(ShareIcon)`
    && {
        fill: ${props => props.theme.socialIcon};
    }
`;

const StyledPublicIcon = styled(VisibilityIcon)`
    && {
        fill: ${props => props.theme.publicIcon};
    }
`;

const StyledPublicOffIcon = styled(VisibilityOffIcon)`
    && {
        fill: ${props => props.theme.publicIcon};
    }
`;

const SocialControls = () => {
    const projectUid = useSelector(selectActiveProjectUid);
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const starred = useSelector(
        selectUserStarredProject(loggedInUserUid, projectUid)
    );
    const isRequestingLogin = useSelector(selectLoginRequesting);
    const isOwner = useSelector(selectIsOwner(projectUid as any));
    const isPublic = useSelector(selectProjectPublic);
    const dispatch = useDispatch();

    useEffect(() => {
        if (projectUid && !isRequestingLogin && loggedInUserUid) {
            const unsubscribe = subscribeToProjectStars(projectUid, dispatch);
            return unsubscribe;
        }
    }, [projectUid, isRequestingLogin, loggedInUserUid, dispatch]);

    return (
        <>
            {isPublic && (
                <Tooltip title={`Share this project`} placement="bottom-end">
                    <div css={SS.buttonContainer}>
                        <StyledIconButton
                            size="medium"
                            onClick={() => {
                                dispatch(openSimpleModal(ShareDialog));
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
                            if (projectUid !== null) {
                                dispatch(
                                    starOrUnstarProject(
                                        projectUid,
                                        loggedInUserUid
                                    )
                                );
                            }
                        }}
                    >
                        {starred && <StyledStarIcon fontSize="large" />}
                        {!starred && (
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
                                if (projectUid !== null) {
                                    dispatch(markProjectPublic(!isPublic));
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
