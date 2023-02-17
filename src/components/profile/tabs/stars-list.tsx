import React from "react";
import { RootState } from "@store/types";
import {
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import ProjectAvatar from "@elem/project-avatar";
import { IProject } from "@comp/projects/types";
import { selectProfileStars } from "../selectors";
import { ListItem, ListItemText } from "@mui/material";
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
        (store: RootState) => store.ProjectsReducer.projects
    );
    return isEmpty(profileStars) ? (
        <></>
    ) : (
        profileStars.map((projectUid, index) => {
            const project: IProject = prop(projectUid, cachedProjects);
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
                            {project && <ProjectAvatar project={project} />}
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
