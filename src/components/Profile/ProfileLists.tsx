import React from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
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
    StyledListButtonsContainer
} from "./ProfileUI";
import PlayIcon from "@material-ui/icons/PlayCircleFilledRounded";
import PauseIcon from "@material-ui/icons/PauseCircleFilledRounded";
import AssignmentIcon from "@material-ui/icons/Assignment";
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
    deleteProject
} from "./actions";
export default ({ selectedSection, filteredProjects, isProfileOwner }) => {
    const dispatch = useDispatch();
    const listPlayState = useSelector(selectListPlayState);
    const filteredFollowing = useSelector(selectFilteredUserFollowing);
    const profileRequesting = useSelector(selectUserProfileRequesting);
    const currentlyPlayingProject = useSelector(selectCurrentlyPlayingProject);

    return (
        <PerfectScrollbar>
            <List>
                {selectedSection === 0 &&
                    Array.isArray(filteredProjects) &&
                    profileRequesting === false &&
                    filteredProjects.map((p, i) => {
                        return (
                            <ListItem
                                button
                                alignItems="flex-start"
                                onClick={e => {
                                    dispatch(push("/editor/" + p.projectUid));
                                }}
                                key={i}
                            >
                                <StyledListItemContainer
                                    isProfileOwner={isProfileOwner}
                                >
                                    <StyledListItemAvatar>
                                        <ListItemAvatar>
                                            <Avatar>
                                                <AssignmentIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                    </StyledListItemAvatar>

                                    <StyledListItemTopRowText>
                                        <ListItemText
                                            primary={p.name}
                                            secondary={p.description}
                                        />
                                    </StyledListItemTopRowText>

                                    <StyledListItemChipsRow>
                                        {Array.isArray(p.tags) &&
                                            p.tags.map(
                                                (
                                                    t: React.ReactNode,
                                                    i:
                                                        | string
                                                        | number
                                                        | undefined
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
                                            p.projectUid ===
                                                currentlyPlayingProject && (
                                                <IconButton
                                                    size="medium"
                                                    aria-label="Delete"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        dispatch(
                                                            pauseListItem(
                                                                p.projectUid
                                                            )
                                                        );
                                                    }}
                                                >
                                                    <PauseIcon fontSize="large" />
                                                </IconButton>
                                            )) || (
                                            <IconButton
                                                size="medium"
                                                aria-label="Delete"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    dispatch(
                                                        playListItem(
                                                            p.projectUid
                                                        )
                                                    );
                                                }}
                                            >
                                                <PlayIcon fontSize="large" />
                                            </IconButton>
                                        )}
                                    </StyledListPlayButtonContainer>
                                    {isProfileOwner && (
                                        <StyledListButtonsContainer>
                                            <Button
                                                color="primary"
                                                onClick={e => {
                                                    dispatch(editProject(p));
                                                    e.stopPropagation();
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                color="primary"
                                                onClick={e => {
                                                    dispatch(deleteProject(p));
                                                    e.stopPropagation();
                                                }}
                                            >
                                                delete
                                            </Button>
                                        </StyledListButtonsContainer>
                                    )}
                                </StyledListItemContainer>
                            </ListItem>
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
        </PerfectScrollbar>
    );
};
