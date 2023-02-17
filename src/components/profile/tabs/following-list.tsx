import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../profile-ui";
import { ListItem, Avatar, ListItemText } from "@mui/material";
import { useDispatch } from "react-redux";
import { push } from "connected-react-router";

const FollowingList = ({
    filteredFollowing
}: {
    filteredFollowing: Array<any>;
}): React.ReactElement => {
    const dispatch = useDispatch();
    return (
        <>
            {filteredFollowing.map((p: any, index) => {
                return (
                    <ListItem
                        button
                        alignItems="flex-start"
                        key={index}
                        onClick={() => {
                            dispatch(push(`/profile/${p.username}`));
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
                    </ListItem>
                );
            })}
        </>
    );
};

export default FollowingList;
