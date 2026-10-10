import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import {
    ListItemButton,
    ListItemText,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router";
import PeopleIcon from "@mui/icons-material/People";
import CachedAvatar from "../cached-avatar";
import { IProfile } from "../types";

export const FollowingList = ({
    filteredFollowing,
    isLoading = false
}: {
    filteredFollowing: IProfile[];
    isLoading?: boolean;
}) => {
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

    if (!filteredFollowing || filteredFollowing.length === 0) {
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
                <PeopleIcon
                    sx={{
                        fontSize: 48,
                        color: "text.secondary",
                        marginBottom: 2
                    }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    No Following Yet
                </Typography>
                <Typography
                    sx={{ textAlign: "center" }}
                    variant="body2"
                    color="text.secondary"
                >
                    This user isn't following anyone yet.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            {filteredFollowing.map((p) => {
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
                                    <PeopleIcon />
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
