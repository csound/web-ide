import React, { useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "@root/store";
import { List, ListItem, ListItemText } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import {
    selectFollowingLoading,
    selectFollowersLoading,
    selectStarsLoading
} from "./selectors";
import { FollowingList } from "./tabs/following-list";
import { FollowersList } from "./tabs/followers-list";
import { StarsList } from "./tabs/stars-list";
import { ListPlayButton } from "./list-play-button";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
    StyledListItemContainer,
    StyledListItemTopRowText,
    StyledListItemChipsRow,
    StyledChip,
    StyledListPlayButtonContainer,
    StyledListButtonsContainer
} from "./profile-ui";
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
    const isMobileLayout = useMediaQuery("(max-width: 760px)");
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const closeMenu = () => {
        setMenuAnchor(null);
    };

    const openMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
    };

    const onEditProject = (event: React.MouseEvent<HTMLElement>) => {
        dispatch(editProject(project));
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
    };

    const onDeleteProject = (event: React.MouseEvent<HTMLElement>) => {
        dispatch(deleteProject(project));
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
    };

    const onTogglePublic = (event: React.MouseEvent<HTMLElement>) => {
        dispatch(markProjectPublic(projectUid, !isPublic));
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
    };

    return (
        <div style={{ position: "relative" }}>
            <Link to={"/editor/" + projectUid}>
                <ListItem alignItems="flex-start">
                    <StyledListItemContainer isProfileOwner={isProfileOwner}>
                        <StyledListItemTopRowText>
                            <ListItemText
                                primary={
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8
                                        }}
                                    >
                                        <span>{name}</span>
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                fontSize: 12,
                                                lineHeight: 1,
                                                border: "1px solid currentColor",
                                                borderRadius: 12,
                                                padding: "3px 8px",
                                                opacity: isPublic ? 0.75 : 1,
                                                fontWeight: 600
                                            }}
                                            aria-label={
                                                isPublic
                                                    ? "Project is public"
                                                    : "Project is private"
                                            }
                                            title={
                                                isPublic
                                                    ? "Project is public"
                                                    : "Project is private"
                                            }
                                        >
                                            {isPublic ? (
                                                <PublicIcon fontSize="inherit" />
                                            ) : (
                                                <LockIcon fontSize="inherit" />
                                            )}
                                            {isPublic ? "Public" : "Private"}
                                        </span>
                                    </span>
                                }
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
                {isProfileOwner && !isMobileLayout && (
                    <StyledListButtonsContainer />
                )}
            </Link>
            <StyledListPlayButtonContainer>
                <ListPlayButton
                    projectUid={projectUid}
                    iconName={project.iconName}
                    iconBackgroundColor={project.iconBackgroundColor}
                    iconForegroundColor={project.iconForegroundColor}
                />
            </StyledListPlayButtonContainer>
            {isProfileOwner && isMobileLayout && (
                <>
                    <Tooltip title="Project actions" followCursor>
                        <div css={SS.mobileActionsContainer}>
                            <div
                                css={SS.mobileActionsButton}
                                onClick={openMenu}
                            >
                                <MoreVertIcon />
                            </div>
                        </div>
                    </Tooltip>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={closeMenu}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right"
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right"
                        }}
                    >
                        <MenuItem onClick={onTogglePublic}>
                            {isPublic ? (
                                <VisibilityOffIcon />
                            ) : (
                                <VisibilityIcon />
                            )}
                            <span style={{ marginLeft: 8 }}>
                                {isPublic
                                    ? "Make project private"
                                    : "Make project public"}
                            </span>
                        </MenuItem>
                        <MenuItem onClick={onEditProject}>
                            <SettingsIcon />
                            <span style={{ marginLeft: 8 }}>
                                Rename/Edit project
                            </span>
                        </MenuItem>
                        <MenuItem onClick={onDeleteProject}>
                            <DeleteIcon />
                            <span
                                style={{ marginLeft: 8 }}
                            >{`Delete ${name}`}</span>
                        </MenuItem>
                    </Menu>
                </>
            )}
            {isProfileOwner && !isMobileLayout && (
                <>
                    <Tooltip title="Toggle project settings" followCursor>
                        <div css={SS.settingsIconContainer}>
                            <div
                                css={SS.settingsIcon}
                                key={projectUid}
                                onClick={onEditProject}
                            >
                                <SettingsIcon />
                            </div>
                        </div>
                    </Tooltip>
                    <Tooltip title={`Delete ${name}`} followCursor>
                        <div css={SS.deleteIconContainer}>
                            <div css={SS.deleteIcon} onClick={onDeleteProject}>
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
                                onClick={onTogglePublic}
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

export const ProfileLists = ({
    profileUid,
    selectedSection,
    isProfileOwner,
    filteredProjects
}: {
    profileUid: string;
    selectedSection: number;
    isProfileOwner: boolean;
    filteredProjects: Array<any>;
}) => {
    const userFollowing = useSelector(
        (state) =>
            state.ProfileReducer.profiles[profileUid]?.userFollowing ?? []
    );

    const userFollowers = useSelector((state) =>
        (state.ProfileReducer.profiles[profileUid]?.followers ?? []).map(
            (followerUid) => state.ProfileReducer.profiles[followerUid]
        )
    );

    // Loading states
    const followingLoading = useSelector(selectFollowingLoading(profileUid));
    const followersLoading = useSelector(selectFollowersLoading(profileUid));
    const starsLoading = useSelector(selectStarsLoading(profileUid));

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
            {selectedSection === 1 && (
                <FollowingList
                    filteredFollowing={userFollowing}
                    isLoading={followingLoading}
                />
            )}
            {selectedSection === 2 && (
                <FollowersList
                    filteredFollowers={userFollowers}
                    isLoading={followersLoading}
                />
            )}
            {selectedSection === 3 && (
                <StarsList profileUid={profileUid} isLoading={starsLoading} />
            )}
        </List>
    );
};
