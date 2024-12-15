import { RootState } from "@root/store";
import {
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import ProjectAvatar from "@elem/project-avatar";
import { IProject } from "@comp/projects/types";
import { selectProfileStars } from "../selectors";
import { ListItemButton, ListItemText } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { push } from "connected-react-router";
import { isEmpty } from "ramda";
import * as SS from "./styles";
import { UnknownAction } from "redux";

const StarsList = ({ profileUid }: { profileUid: string }) => {
    const dispatch = useDispatch();
    const profileStars = useSelector(selectProfileStars(profileUid));
    const cachedProjects = useSelector(
        (store: RootState) => store.ProjectsReducer.projects
    );
    return isEmpty(profileStars) ? (
        <></>
    ) : (
        profileStars.map((projectUid, index) => {
            const project: IProject = cachedProjects[profileUid]!;

            return (
                <ListItemButton
                    alignItems="flex-start"
                    css={SS.starItemContainer}
                    key={index}
                    onClick={() => {
                        dispatch(
                            push(
                                `/editor/${projectUid}`
                            ) as unknown as UnknownAction
                        );
                    }}
                >
                    <StyledUserListItemContainer>
                        <div css={SS.starItemIcon}>
                            {project && (
                                <ProjectAvatar
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
                </ListItemButton>
            );
        })
    );
};

export default StarsList;
