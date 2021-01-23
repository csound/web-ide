import React from "react";
import { Link } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import { List, ListItem, ListItemText } from "@material-ui/core";
import FollowingList from "./tabs/following-list";
import FollowersList from "./tabs/followers-list";
import StarsList from "./tabs/stars-list";
import ListPlayButton from "./list-play-button";
import SettingsIcon from "@material-ui/icons/Settings";
import DeleteIcon from "@material-ui/icons/DeleteOutline";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { useDispatch, useSelector } from "react-redux";
import {
    StyledListItemContainer,
    StyledListItemTopRowText,
    StyledListItemChipsRow,
    StyledChip,
    StyledListPlayButtonContainer,
    StyledListButtonsContainer
} from "./profile-ui";
import { selectCsoundStatus } from "@comp/csound/selectors";
import {
    selectFilteredUserFollowing,
    selectFilteredUserFollowers
} from "./selectors";
import { editProject, deleteProject } from "./actions";
import { markProjectPublic } from "@comp/projects/actions";
import { descend, sort, propOr } from "ramda";
import * as SS from "./styles";

const ProjectListItem = (properties) => {
    const { isProfileOwner, project } = properties;
    const dispatch = useDispatch();
    const { isPublic, projectUid, name, description, tags } = project;
    ReactTooltip.rebuild();

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
                    iconNameProp={false}
                    iconBackgroundColorProp={false}
                    iconForegroundColorProp={false}
                />
            </StyledListPlayButtonContainer>
            {isProfileOwner && (
                <>
                    <div
                        css={SS.settingsIconContainer}
                        data-tip={"Toggle project settings"}
                    >
                        <div
                            css={SS.settingsIcon}
                            key={projectUid}
                            onMouseOver={() => {
                                ReactTooltip.rebuild();
                            }}
                            onClick={(event) => {
                                dispatch(editProject(project));
                                event.preventDefault();
                                event.stopPropagation();
                            }}
                        >
                            <SettingsIcon />
                        </div>
                    </div>
                    <div
                        css={SS.deleteIconContainer}
                        data-tip={`Delete ${name}`}
                    >
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
                    <div
                        css={SS.publicIconContainer}
                        data-tip={
                            isPublic
                                ? "Make the project private"
                                : "Make the project public"
                        }
                    >
                        <div
                            css={SS.publicIcon}
                            style={{ opacity: !isPublic ? 0.6 : 1 }}
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
                </>
            )}
        </div>
    );
};

const ProfileLists = ({
    profileUid,
    selectedSection,
    isProfileOwner,
    filteredProjects,
    username,
    setProfileUid
}) => {
    const csoundStatus = useSelector(selectCsoundStatus);
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
                            csoundStatus={csoundStatus}
                            username={username}
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
