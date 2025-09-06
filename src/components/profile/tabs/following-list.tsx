import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import {
    ListItemButton,
    Avatar,
    ListItemText,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router";
import PeopleIcon from "@mui/icons-material/People";

export const FollowingList = ({
    filteredFollowing,
    isLoading = false
}: {
    filteredFollowing: Array<any>;
    isLoading?: boolean;
}) => {
    const navigate = useNavigate();

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

    if (!filteredFollowing || filteredFollowing.length === 0) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="200px"
                padding={3}
            >
                <PeopleIcon
                    sx={{
                        fontSize: 48,
                        color: "text.secondary",
                        marginBottom: 2
                    }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Following Yet
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                >
                    This user isn't following anyone yet.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            {filteredFollowing.map((p: any, index) => {
                return (
                    <ListItemButton
                        alignItems="flex-start"
                        key={index}
                        onClick={() => {
                            navigate(`/profile/${p.username}`);
                        }}
                    >
                        <StyledUserListItemContainer>
                            <StyledListItemAvatar>
                                <Avatar src={p.photoUrl} />
                            </StyledListItemAvatar>

                            <StyledListItemTopRowText>
                                <ListItemText
                                    primary={p.displayName}
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
