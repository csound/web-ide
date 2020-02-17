import React from "react";
import { IStore } from "@store/types";
import {
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../ProfileUI";
import ProjectIcon from "../ProjectIcon";
import { selectProfileStars } from "../selectors";
import { ListItem, ListItemText } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import { push } from "connected-react-router";
import { isEmpty, propOr } from "ramda";
import * as SS from "./styles";

const StarsList = ({ profileUid }) => {
    const dispatch = useDispatch();
    const profileStars = useSelector(selectProfileStars(profileUid));
    const cachedProjects = useSelector(
        (store: IStore) => store.ProjectsReducer.projects
    );
    return isEmpty(profileStars) ? (
        <></>
    ) : (
        profileStars.map((projectUid, index) => {
            const project = propOr(null, projectUid, cachedProjects);
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
                                    onClick={() => {}}
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
