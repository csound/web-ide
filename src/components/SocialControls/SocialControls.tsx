import React, { useEffect } from "react";
import * as SS from "./styles";
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
import { getLoggedInUserStars, toggleStarProject } from "../Profile/actions";
import { markProjectPublic } from "../Projects/actions";
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
        fill: #8f9089;
    }
`;

const StyledOutlinedStarIcon = styled(OutlinedStarIcon)`
    && {
        fill: #8f9089;
    }
`;

const StyledShareIcon = styled(ShareIcon)`
    && {
        fill: #8f9089;
    }
`;

const StyledPublicIcon = styled(VisibilityIcon)`
    && {
        fill: #8f9089;
    }
`;

const StyledPublicOffIcon = styled(VisibilityOffIcon)`
    && {
        fill: #8f9089;
    }
`;

const StyledLabelContainer = styled.div`
    padding: 2px;
    font-size: 15px;
    font-weight: 500;
    color: ${props => props.theme.color.primary};
    letter-spacing: 1.25px;
`;

const SocialControls = () => {
    const starred = useSelector(selectUserStarredProject);
    const projectUid = useSelector(selectActiveProjectUid);
    const isOwner = useSelector(selectIsOwner(projectUid as any));
    const isPublic = useSelector(selectProjectPublic);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(getLoggedInUserStars());
    }, [dispatch]);
    return (
        <>
            {isPublic && (
                <div css={SS.buttonContainer}>
                    <StyledIconButton
                        size="medium"
                        onClick={() => {
                            dispatch(openSimpleModal(ShareDialog));
                        }}
                    >
                        <StyledShareIcon fontSize="large" />
                        <StyledLabelContainer>Share</StyledLabelContainer>
                    </StyledIconButton>
                </div>
            )}
            <div css={SS.buttonContainer}>
                <StyledIconButton
                    size="medium"
                    onClick={() => {
                        if (projectUid !== null) {
                            dispatch(toggleStarProject(projectUid));
                        }
                    }}
                >
                    {starred && <StyledStarIcon fontSize="large" />}
                    {!starred && <StyledOutlinedStarIcon fontSize="large" />}
                    <StyledLabelContainer>
                        {starred && "un"}star
                    </StyledLabelContainer>
                </StyledIconButton>
            </div>
            {isOwner && (
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
                        <StyledLabelContainer>Public</StyledLabelContainer>
                    </StyledIconButton>
                </div>
            )}
        </>
    );
};

export default SocialControls;
