import React from "react";
import { Link } from "react-router-dom";
import {
    Button,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText
} from "@material-ui/core";
import ListPlayButton from "./ListPlayButton";
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
    // StyledListStarButtonContainer,
    StyledListButtonsContainer
} from "./ProfileUI";
// import PlayIcon from "@material-ui/icons/PlayCircleFilledRounded";
// import PauseIcon from "@material-ui/icons/PauseCircleFilledRounded";
// import StarIcon from "@material-ui/icons/Star";
// import OutlinedStarIcon from "@material-ui/icons/StarBorder";
import { selectCsoundStatus } from "@comp/Csound/selectors";
import { selectFilteredUserFollowing } from "./selectors";
import {
    // pauseListItem,
    // playListItem,
    editProject,
    deleteProject
    // toggleStarProject
} from "./actions";

const ProjectListItem = props => {
    const { isProfileOwner, project } = props;
    const dispatch = useDispatch();
    const { projectUid, name, description, tags } = project;

    return (
        <div style={{ position: "relative" }}>
            <Link to={"/editor/" + projectUid}>
                <ListItem button alignItems="flex-start">
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
            </Link>
            <StyledListPlayButtonContainer>
                <ListPlayButton projectUid={projectUid} />
            </StyledListPlayButtonContainer>
        </div>
    );
};

export default ({
    profileUid,
    selectedSection,
    isProfileOwner,
    filteredProjects,
    username,
    setProfileUid,
    setSelectedSection
}) => {
    const dispatch = useDispatch();
    const csoundStatus = useSelector(selectCsoundStatus);
    const filteredFollowing = useSelector(
        selectFilteredUserFollowing(profileUid)
    );

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
                            csoundStatus={csoundStatus}
                            username={username}
                        />
                    );
                })}
            {selectedSection === 1 &&
                Array.isArray(filteredFollowing) &&
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
