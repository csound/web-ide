import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import {
    ListItemText,
    ListItemButton,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router";
import PersonIcon from "@mui/icons-material/Person";
import CachedAvatar from "../cached-avatar";
import { IProfile } from "../types";

export const FollowersList = ({
    filteredFollowers,
    isLoading = false
}: {
    filteredFollowers: IProfile[];
    isLoading?: boolean;
}): React.ReactElement => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "200px"
                }}
            >
                <CircularProgress size={40} />
            </Box>
        );
    }

    if (!filteredFollowers || filteredFollowers.length === 0) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "200px",
                    padding: 3
                }}
            >
                <PersonIcon
                    sx={{
                        fontSize: 48,
                        color: "text.secondary",
                        marginBottom: 2
                    }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    No Followers Yet
                </Typography>
                <Typography
                    sx={{ textAlign: "center" }}
                    variant="body2"
                    color="text.secondary"
                >
                    This user doesn't have any followers yet.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            {filteredFollowers.map((p) => {
                return (
                    <ListItemButton
                        alignItems="flex-start"
                        key={p.userUid}
                        onClick={() => {
                            navigate(
                                `/profile/${encodeURIComponent(p.username)}`
                            );
                        }}
                    >
                        <StyledUserListItemContainer>
                            <StyledListItemAvatar>
                                <CachedAvatar src={p.photoUrl}>
                                    <PersonIcon />
                                </CachedAvatar>
                            </StyledListItemAvatar>

                            <StyledListItemTopRowText>
                                <ListItemText
                                    primary={p.displayName || p.username}
                                    secondary={p.bio}
                                />
                            </StyledListItemTopRowText>
                        </StyledUserListItemContainer>
                    </ListItemButton>
                );
            })}
        </>
    );
};

export default FollowersList;
