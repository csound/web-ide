import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "@root/store";
import { shallowEqual } from "react-redux";
import {
    Box,
    Chip,
    IconButton,
    List,
    ListItem,
    Typography
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import {
    selectFollowingLoading,
    selectFollowersLoading,
    selectStarsLoading,
    selectProfileConnections
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
import { ProjectDates } from "@comp/projects/project-dates";
import { IProject } from "@comp/projects/types";
import { editProject, deleteProject } from "./actions";
import { markProjectPublic } from "@comp/projects/actions";
import { descend, sort, propOr } from "ramda";

const ProjectListItem = ({
    isProfileOwner,
    project
}: {
    isProfileOwner: boolean;
    project: IProject;
}) => {
    const dispatch = useDispatch();
    const { isPublic, projectUid, name, description, tags } = project;
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
        <ListItem
            sx={{
                alignItems: "flex-start",
                gap: 1.5,
                px: 2,
                py: 1.5,
                borderTop: 1,
                borderColor: "divider"
            }}
        >
            <ListPlayButton
                size={48}
                projectUid={projectUid}
                projectName={name}
                iconName={project.iconName}
                iconBackgroundColor={project.iconBackgroundColor}
                iconForegroundColor={project.iconForegroundColor}
            />
            <Box
                component={Link}
                to={"/editor/" + projectUid}
                sx={{
                    flex: 1,
                    minWidth: 0,
                    color: "text.primary",
                    textDecoration: "none",
                    borderRadius: 1,
                    "&:hover h2": { textDecoration: "underline" },
                    "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 4
                    }
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1
                    }}
                >
                    <Typography
                        component="h2"
                        variant="subtitle1"
                        sx={{ overflowWrap: "anywhere", lineHeight: 1.4 }}
                    >
                        {name}
                    </Typography>
                    <Box
                        component="span"
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "text.secondary",
                            fontSize: 12
                        }}
                    >
                        {isPublic ? (
                            <PublicIcon fontSize="inherit" />
                        ) : (
                            <LockIcon fontSize="inherit" />
                        )}
                        {isPublic ? "Public" : "Private"}
                    </Box>
                </Box>
                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-line"
                        }}
                    >
                        {description}
                    </Typography>
                )}
                <Box sx={{ color: "text.secondary", mt: 0.75 }}>
                    <ProjectDates project={project} />
                </Box>
                {Array.isArray(tags) && tags.length > 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mt: 1
                        }}
                    >
                        {tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ maxWidth: "100%" }}
                            />
                        ))}
                    </Box>
                )}
            </Box>
            {isProfileOwner && (
                <>
                    <Tooltip title="Project actions">
                        <IconButton
                            aria-label={`Actions for ${name}`}
                            aria-haspopup="menu"
                            aria-expanded={Boolean(menuAnchor)}
                            onClick={openMenu}
                            sx={{ width: 40, height: 40, flexShrink: 0 }}
                        >
                            <MoreVertIcon />
                        </IconButton>
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
                        slotProps={{
                            paper: {
                                sx: {
                                    maxWidth: "calc(100vw - 32px)",
                                    "& .MuiMenuItem-root": {
                                        whiteSpace: "normal",
                                        gap: 1.5,
                                        minHeight: 44
                                    },
                                    "& .MuiMenuItem-root > span": {
                                        overflowWrap: "anywhere",
                                        minWidth: 0
                                    }
                                }
                            }
                        }}
                    >
                        <MenuItem onClick={onTogglePublic}>
                            {isPublic ? (
                                <VisibilityOffIcon />
                            ) : (
                                <VisibilityIcon />
                            )}
                            <span>
                                {isPublic
                                    ? "Make project private"
                                    : "Make project public"}
                            </span>
                        </MenuItem>
                        <MenuItem onClick={onEditProject}>
                            <SettingsIcon />
                            <span>Rename/Edit project</span>
                        </MenuItem>
                        <MenuItem
                            onClick={onDeleteProject}
                            sx={{ color: "error.main" }}
                        >
                            <DeleteIcon />
                            <span>{`Delete ${name}`}</span>
                        </MenuItem>
                    </Menu>
                </>
            )}
        </ListItem>
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
    filteredProjects: IProject[];
}) => {
    const userFollowingSelector = useMemo(
        () => selectProfileConnections(profileUid, "following"),
        [profileUid]
    );

    const userFollowersSelector = useMemo(
        () => selectProfileConnections(profileUid, "followers"),
        [profileUid]
    );

    const userFollowing = useSelector(userFollowingSelector, shallowEqual);
    const userFollowers = useSelector(userFollowersSelector, shallowEqual);

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
