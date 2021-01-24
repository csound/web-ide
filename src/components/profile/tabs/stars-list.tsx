import React from "react";
import { IStore } from "@store/types";
import {
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import ProjectIcon from "../project-icon";
import { selectProfileStars } from "../selectors";
import { ListItem, ListItemText } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { push } from "connected-react-router";
import { isEmpty, prop } from "ramda";
import * as SS from "./styles";

const StarsList = ({
    profileUid
}: {
    profileUid: string;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const profileStars = useSelector(selectProfileStars(profileUid));
    const cachedProjects = useSelector(
        (store: IStore) => store.ProjectsReducer.projects
    );
    return isEmpty(profileStars) ? (
        <></>
    ) : (
        profileStars.map((projectUid, index) => {
            const project = prop(projectUid, cachedProjects);
            return (
                <ListItem
                    button
                    alignItems="flex-start"
                    css={SS.starItemContainer}
                    key={index}
                    onClick={() => {
                        dispatch(push(`/editor/${projectUid}`));
                    }}
                >
                    <StyledUserListItemContainer>
                        <div css={SS.starItemIcon}>
                            {project && (
                                <ProjectIcon
                                    iconName={project.iconName}
                                    iconBackgroundColor={
                                        project.iconBackgroundColor
                                    }
                                    iconForegroundColor={
                                        project.iconForegroundColor
                                    }
                                />
                            )}
                        </div>
                        <StyledListItemTopRowText>
                            <ListItemText
                                primary={project ? project.name : ""}
                                secondary={project ? project.description : ""}
                            />
                        </StyledListItemTopRowText>
                    </StyledUserListItemContainer>
                </ListItem>
            );
        })
    );
};

export default StarsList;
