import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import { ListItem, Avatar, ListItemText, ListItemButton } from "@mui/material";
import { useDispatch } from "react-redux";
import { push } from "connected-react-router";
import { UnknownAction } from "redux";

const FollowersList = ({
    filteredFollowers
}: {
    filteredFollowers: Array<any>;
}): React.ReactElement => {
    const dispatch = useDispatch();
    return (
        <>
            {filteredFollowers.map((p: any, index) => {
                return (
                    <ListItemButton
                        alignItems="flex-start"
                        key={index}
                        onClick={() => {
                            dispatch(
                                push(
                                    `/profile/${p.username}`
                                ) as unknown as UnknownAction
                            );
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
