import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "@root/store";
import { List, ListItem, ListItemText } from "@mui/material";
import FollowingList from "./tabs/following-list";
import FollowersList from "./tabs/followers-list";
import StarsList from "./tabs/stars-list";
import { ListPlayButton } from "./list-play-button";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Tooltip from "@mui/material/Tooltip";
import {
    StyledListItemContainer,
    StyledListItemTopRowText,
    StyledListItemChipsRow,
    StyledChip,
    StyledListPlayButtonContainer,
    StyledListButtonsContainer
} from "./profile-ui";
import {
    selectFilteredUserFollowing,
    selectFilteredUserFollowers
} from "./selectors";
import { IProject } from "@comp/projects/types";
import { editProject, deleteProject } from "./actions";
import { markProjectPublic } from "@comp/projects/actions";
import { descend, sort, propOr } from "ramda";
import * as SS from "./styles";

const ProjectListItem = ({
    isProfileOwner,
    project
}: {
    isProfileOwner: boolean;
    project: IProject;
}) => {
    const dispatch = useDispatch();
    const { isPublic, projectUid, name, description, tags } = project;
    return (
        <div style={{ position: "relative" }}>
            <Link to={"/editor/" + projectUid}>
                <ListItem alignItems="flex-start">
                    <StyledListItemContainer isProfileOwner={isProfileOwner}>
                        <StyledListItemTopRowText>
                            <ListItemText
                                primary={name}
                                secondary={description}
                            />
                        </StyledListItemTopRowText>
                        <StyledListItemChipsRow>
                            {Array.isArray(tags) &&
                                tags.map(
                                    (
                                        t: React.ReactNode,
                                        index: string | number | undefined
                                    ) => {
                                        return (
                                            <StyledChip
                                                color="primary"
                                                key={index}
                                                label={t}
                                            />
                                        );
                                    }
                                )}
                        </StyledListItemChipsRow>
                    </StyledListItemContainer>
                </ListItem>
                {isProfileOwner && <StyledListButtonsContainer />}
            </Link>
            <StyledListPlayButtonContainer>
                <ListPlayButton
                    projectUid={projectUid}
                    iconName={project.iconName}
                    iconBackgroundColor={project.iconBackgroundColor}
                    iconForegroundColor={project.iconForegroundColor}
                />
            </StyledListPlayButtonContainer>
            {isProfileOwner && (
                <>
                    <Tooltip title="Toggle project settings" followCursor>
                        <div css={SS.settingsIconContainer}>
                            <div
                                css={SS.settingsIcon}
                                key={projectUid}
                                onClick={(event) => {
                                    dispatch(editProject(project));
                                    event.preventDefault();
                                    event.stopPropagation();
                                }}
                            >
                                <SettingsIcon />
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Delete ${name}`} followCursor>
                        <div css={SS.deleteIconContainer}>
                            <div
                                css={SS.deleteIcon}
                                onClick={(event) => {
                                    dispatch(deleteProject(project));
                                    event.preventDefault();
                                    event.stopPropagation();
                                }}
                            >
                                <DeleteIcon />
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip
                        title={
                            isPublic
                                ? "Make the project private"
                                : "Make the project public"
                        }
                        followCursor
                    >
                        <div css={SS.publicIconContainer}>
                            <div
                                css={SS.publicIcon}
                                style={{ opacity: isPublic ? 1 : 0.6 }}
                                onClick={(event) => {
                                    dispatch(
                                        markProjectPublic(projectUid, !isPublic)
                                    );
                                    event.preventDefault();
                                    event.stopPropagation();
                                }}
                            >
                                {isPublic ? (
                                    <VisibilityIcon />
                                ) : (
                                    <VisibilityOffIcon />
                                )}
                            </div>
                        </div>
                    </Tooltip>
                </>
            )}
        </div>
    );
};

const ProfileLists = ({
    profileUid,
    selectedSection,
    isProfileOwner,
    filteredProjects
}: {
    profileUid: string;
    selectedSection: number;
    isProfileOwner: boolean;
    filteredProjects: Array<any>;
}): React.ReactElement => {
    const filteredFollowing = useSelector(
        selectFilteredUserFollowing(profileUid)
    );
    const filteredFollowers = useSelector(
        selectFilteredUserFollowers(profileUid)
    );

    return (
        <List>
            {selectedSection === 0 &&
                Array.isArray(filteredProjects) &&
                sort(
                    descend(propOr(Number.NEGATIVE_INFINITY, "created")),
                    filteredProjects
                ).map((project) => {
                    return (
                        <ProjectListItem
                            key={project.projectUid}
                            isProfileOwner={isProfileOwner}
                            project={project}
                        />
                    );
                })}
            {selectedSection === 1 && Array.isArray(filteredFollowing) && (
                <FollowingList filteredFollowing={filteredFollowing} />
            )}
            {selectedSection === 2 && Array.isArray(filteredFollowers) && (
                <FollowersList filteredFollowers={filteredFollowers} />
            )}
            {selectedSection === 3 && <StarsList profileUid={profileUid} />}
        </List>
    );
};

export default ProfileLists;
