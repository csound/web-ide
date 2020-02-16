import React from "react";
import {
    StyledListItemAvatar,
    StyledListItemTopRowText,
    StyledUserListItemContainer
} from "../ProfileUI";
import { ListItem, Avatar, ListItemText } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { push } from "connected-react-router";

const FollowersList = ({ filteredFollowers }) => {
    const dispatch = useDispatch();
    return filteredFollowers.map((p: any, i) => {
        return (
            <ListItem
                button
                alignItems="flex-start"
                key={i}
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
    });
};

export default FollowersList;
