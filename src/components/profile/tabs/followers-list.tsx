import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import {
    Avatar,
    ListItemText,
    ListItemButton,
    Typography,
    Box,
    CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router";
import PersonIcon from "@mui/icons-material/Person";

export const FollowersList = ({
    filteredFollowers,
    isLoading = false
}: {
    filteredFollowers: Array<any>;
    isLoading?: boolean;
}): React.ReactElement => {
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

    if (!filteredFollowers || filteredFollowers.length === 0) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="200px"
                padding={3}
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
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                >
                    This user doesn't have any followers yet.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            {filteredFollowers.map((p: any, index) => {
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

export default FollowersList;
