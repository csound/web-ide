import React from "react";
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
    selectCurrentlyPlayingProject
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
    const isCurrentlyPlaying =
        listPlayState === "playing" && projectUid === currentlyPlayingProject;

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
                        <IconButton
                            size="medium"
                            aria-label="Delete"
                            onClick={e => {
                                e.stopPropagation();
                                dispatch(
                                    isCurrentlyPlaying
                                        ? pauseListItem(projectUid)
                                        : playListItem(projectUid)
                                );
                            }}
                        >
                            {isCurrentlyPlaying ? (
                                <PauseIcon
                                    fontSize="large"
                                    style={{
                                        color: theme.profilePlayButton.secondary
                                    }}
                                />
                            ) : (
                                <PlayIcon
                                    fontSize="large"
                                    style={{
                                        color: theme.profilePlayButton.primary
                                    }}
                                />
                            )}
                        </IconButton>
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

export default ({
    selectedSection,
    isProfileOwner,
    filteredProjects,
    username,
    setProfileUid,
    setSelectedSection
}) => {
    const dispatch = useDispatch();
    const listPlayState = useSelector(selectListPlayState);
    const filteredFollowing = useSelector(selectFilteredUserFollowing);
    const profileRequesting = useSelector(selectUserProfileRequesting);
    const currentlyPlayingProject = useSelector(selectCurrentlyPlayingProject);
    return (
        <List>
            {selectedSection === 0 &&
                Array.isArray(filteredProjects) &&
                filteredProjects.map((p, i) => {
                    return (
                        <ProjectListItem
                            key={p.projectUid}
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
                            onClick={async () => {
                                await dispatch(push(`/profile/${p.username}`));
                                setProfileUid(null);
                                setSelectedSection(0);
                            }}
                        >
                            <StyledUserListItemContainer>
                                <StyledListItemAvatar>
                                    <ListItemAvatar>
                                        <Avatar src={p.photoUrl} />
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
