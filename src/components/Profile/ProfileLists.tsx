import React from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText } from "@material-ui/core";
import FollowingList from "./tabs/FollowingList";
import FollowersList from "./tabs/FollowersList";
import StarsList from "./tabs/StarsList";
import Tooltip from "@material-ui/core/Tooltip";
import ListPlayButton from "./ListPlayButton";
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
} from "./ProfileUI";
import { selectCsoundStatus } from "@comp/Csound/selectors";
import {
    selectFilteredUserFollowing,
    selectFilteredUserFollowers
} from "./selectors";
import { editProject, deleteProject } from "./actions";
import { markProjectPublic } from "@comp/Projects/actions";
import { descend, sort, propOr } from "ramda";
import * as SS from "./styles";

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
                <div>
                    <div css={SS.settingsIconContainer}>
                        <Tooltip
                            title="Toggle project settings"
                            placement="top-end"
                        >
                            <div
                                css={SS.settingsIcon}
                                onClick={e => {
                                    dispatch(editProject(project));
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <SettingsIcon />
                            </div>
                        </Tooltip>
                    </div>
                    <div css={SS.deleteIconContainer}>
                        <Tooltip
                            title={`Delete ${project.name}`}
                            placement="top-end"
                        >
                            <div
                                css={SS.deleteIcon}
                                onClick={e => {
                                    dispatch(deleteProject(project));
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <DeleteIcon />
                            </div>
                        </Tooltip>
                    </div>
                    <div css={SS.publicIconContainer}>
                        <Tooltip
                            title={
                                project.isPublic
                                    ? "Make the project private"
                                    : "Make the project public"
                            }
                            placement="top-end"
                        >
                            <div
                                css={SS.publicIcon}
                                style={{ opacity: !project.isPublic ? 0.6 : 1 }}
                                onClick={e => {
                                    dispatch(
                                        markProjectPublic(
                                            project.projectUid,
                                            !project.isPublic
                                        )
                                    );
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                {project.isPublic ? (
                                    <VisibilityIcon />
                                ) : (
                                    <VisibilityOffIcon />
                                )}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ({
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
                    descend(propOr(-Infinity, "created")),
                    filteredProjects
                ).map((p, i) => {
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
            {selectedSection === 1 && Array.isArray(filteredFollowing) && (
                <FollowingList filteredFollowing={filteredFollowing} />
            )}
            {selectedSection === 2 && Array.isArray(filteredFollowing) && (
                <FollowersList filteredFollowers={filteredFollowers} />
            )}
            {selectedSection === 3 && <StarsList profileUid={profileUid} />}
        </List>
    );
};
