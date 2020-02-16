import React from "react";
import { Link } from "react-router-dom";
import { List, ListItem, ListItemText } from "@material-ui/core";
import FollowingList from "./tabs/FollowingList";
import FollowersList from "./tabs/FollowersList";
import Tooltip from "@material-ui/core/Tooltip";
import ListPlayButton from "./ListPlayButton";
import SettingsIcon from "@material-ui/icons/Settings";
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
import { editProject } from "./actions";
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
                <ListPlayButton projectUid={projectUid} />
            </StyledListPlayButtonContainer>
            {isProfileOwner && (
                <div css={SS.settingsIconContainer}>
                    <Tooltip title="Toggle project settings">
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
            {selectedSection === 1 && Array.isArray(filteredFollowing) && (
                <FollowingList filteredFollowing={filteredFollowing} />
            )}
            {selectedSection === 2 && Array.isArray(filteredFollowing) && (
                <FollowersList filteredFollowers={filteredFollowers} />
            )}
        </List>
    );
};
