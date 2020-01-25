import React, { useEffect } from "react";
import { subscribeToProjectLastModified } from "@comp/ProjectLastModified/subscribers";
import {
    Button,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    IconButton
} from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { push } from "connected-react-router";
import {
    StyledListItemContainer,
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledListItemChipsRow,
    StyledUserListItemContainer,
    StyledChip,
    StyledListPlayButtonContainer,
    StyledListStarButtonContainer,
    StyledListButtonsContainer
} from "./ProfileUI";
import PlayIcon from "@material-ui/icons/PlayCircleFilledRounded";
import PauseIcon from "@material-ui/icons/PauseCircleFilledRounded";
import AssignmentIcon from "@material-ui/icons/Assignment";
import StarIcon from "@material-ui/icons/Star";
import OutlinedStarIcon from "@material-ui/icons/StarBorder";
import {
    selectListPlayState,
    selectFilteredUserFollowing,
    selectUserProfileRequesting,
    selectCurrentlyPlayingProject,
    selectIsUserProfileOwner
} from "./selectors";
import {
    pauseListItem,
    playListItem,
    editProject,
    deleteProject,
    toggleStarProject
} from "./actions";
import { useTheme } from "emotion-theming";

const ProjectListItem = props => {
    const {
        isProfileOwner,
        project,
        listPlayState,
        currentlyPlayingProject
    } = props;
    const dispatch = useDispatch();
    const theme: any = useTheme();
    const { projectUid, name, description, tags, starred } = project;

    return (
        <div style={{ position: "relative" }}>
            <ListItem
                button
                alignItems="flex-start"
                onClick={e => {
                    dispatch(push("/editor/" + projectUid));
                }}
            >
                <StyledListItemContainer isProfileOwner={isProfileOwner}>
                    <StyledListItemAvatar>
                        <ListItemAvatar>
                            <Avatar>
                                <AssignmentIcon />
                            </Avatar>
                        </ListItemAvatar>
                    </StyledListItemAvatar>
                    <StyledListStarButtonContainer>
                        <IconButton
                            size="small"
                            onClick={e => {
                                dispatch(toggleStarProject(projectUid));
                                e.stopPropagation();
                            }}
                        >
                            {starred && <StarIcon />}
                            {!starred && <OutlinedStarIcon />}
                        </IconButton>
                    </StyledListStarButtonContainer>

                    <StyledListItemTopRowText>
                        <ListItemText primary={name} secondary={description} />
                    </StyledListItemTopRowText>

                    <StyledListItemChipsRow>
                        {Array.isArray(tags) &&
                            tags.map(
                                (
                                    t: React.ReactNode,
                                    i: string | number | undefined
                                ) => {
                                    return (
                                        <StyledChip
                                            color="primary"
                                            key={i}
                                            label={t}
                                        />
                                    );
                                }
                            )}
                    </StyledListItemChipsRow>
                    <StyledListPlayButtonContainer>
                        {(listPlayState === "playing" &&
                            projectUid === currentlyPlayingProject && (
                                <IconButton
                                    size="medium"
                                    aria-label="Delete"
                                    onClick={e => {
                                        e.stopPropagation();
                                        dispatch(pauseListItem(projectUid));
                                    }}
                                >
                                    <PauseIcon
                                        fontSize="large"
                                        style={{
                                            color:
                                                theme.profilePlayButton
                                                    .secondary
                                        }}
                                    />
                                </IconButton>
                            )) || (
                            <IconButton
                                size="medium"
                                aria-label="Delete"
                                onClick={e => {
                                    e.stopPropagation();
                                    dispatch(playListItem(projectUid));
                                }}
                            >
                                <PlayIcon
                                    fontSize="large"
                                    style={{
                                        color: theme.profilePlayButton.primary
                                    }}
                                />
                            </IconButton>
                        )}
                    </StyledListPlayButtonContainer>
                </StyledListItemContainer>
            </ListItem>
            {isProfileOwner && (
                <StyledListButtonsContainer>
                    <Button
                        color="primary"
                        onClick={e => {
                            dispatch(editProject(project));
                            e.stopPropagation();
                        }}
                    >
                        Edit
                    </Button>
                    <Button
                        color="secondary"
                        onClick={e => {
                            dispatch(deleteProject(project));
                            e.stopPropagation();
                        }}
                    >
                        delete
                    </Button>
                </StyledListButtonsContainer>
            )}
        </div>
    );
};

export default ({ selectedSection, filteredProjects, username }) => {
    const dispatch = useDispatch();
    const listPlayState = useSelector(selectListPlayState);
    const filteredFollowing = useSelector(selectFilteredUserFollowing);
    const profileRequesting = useSelector(selectUserProfileRequesting);
    const currentlyPlayingProject = useSelector(selectCurrentlyPlayingProject);
    const isProfileOwner = useSelector(selectIsUserProfileOwner);

    useEffect(() => {
        if (Array.isArray(filteredProjects)) {
            const unsubArray = filteredProjects.map(proj =>
                subscribeToProjectLastModified(proj.projectUid, dispatch)
            );
            return () => unsubArray.forEach(unsub => unsub());
        }
    }, [filteredProjects, dispatch]);

    return (
        <List>
            {selectedSection === 0 &&
                Array.isArray(filteredProjects) &&
                profileRequesting === false &&
                filteredProjects.map((p, i) => {
                    return (
                        <ProjectListItem
                            key={i}
                            isProfileOwner={isProfileOwner}
                            project={p}
                            listPlayState={listPlayState}
                            currentlyPlayingProject={currentlyPlayingProject}
                            username={username}
                        />
                    );
                })}
            {selectedSection === 1 &&
                Array.isArray(filteredFollowing) &&
                profileRequesting === false &&
                filteredFollowing.map((p: any, i) => {
                    return (
                        <ListItem
                            button
                            alignItems="flex-start"
                            key={i}
                            onClick={() => {
                                dispatch(
                                    push(`/profile/${p.username}`, {
                                        fromFollowing: true
                                    })
                                );
                            }}
                        >
                            <StyledUserListItemContainer>
                                <StyledListItemAvatar>
                                    <ListItemAvatar>
                                        <Avatar src={p.imageUrl} />
                                    </ListItemAvatar>
                                </StyledListItemAvatar>

                                <StyledListItemTopRowText>
                                    <ListItemText
                                        primary={p.displayName}
                                        secondary={p.bio}
                                    />
                                </StyledListItemTopRowText>
                            </StyledUserListItemContainer>
                        </ListItem>
                    );
                })}
        </List>
    );
};
