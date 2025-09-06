import { RootState } from "@root/store";
import {
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import ProjectAvatar from "@elem/project-avatar";
import { IProject } from "@comp/projects/types";
import { selectProfileStars } from "../selectors";
import {
    ListItemButton,
    ListItemText,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { isEmpty } from "ramda";
import StarIcon from "@mui/icons-material/Star";
import * as SS from "./styles";

export const StarsList = ({
    profileUid,
    isLoading = false
}: {
    profileUid: string;
    isLoading?: boolean;
}) => {
    const navigate = useNavigate();
    const profileStars = useSelector(selectProfileStars(profileUid));
    const cachedProjects = useSelector(
        (store: RootState) => store.ProjectsReducer.projects
    );

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="200px"
            >
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (isEmpty(profileStars)) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="200px"
                padding={3}
            >
                <StarIcon
                    sx={{
                        fontSize: 48,
                        color: "text.secondary",
                        marginBottom: 2
                    }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Starred Projects
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                >
                    This user hasn't starred any projects yet.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            {profileStars.map((projectUid, index) => {
                const project: IProject = cachedProjects[projectUid]!;

                return (
                    <ListItemButton
                        alignItems="flex-start"
                        css={SS.starItemContainer}
                        key={index}
                        onClick={() => {
                            navigate(`/editor/${projectUid}`);
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
                                    secondary={
                                        project ? project.description : ""
                                    }
                                />
                            </StyledListItemTopRowText>
                        </StyledUserListItemContainer>
                    </ListItemButton>
                );
            })}
        </>
    );
};
