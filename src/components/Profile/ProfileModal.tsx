import React, { useState } from "react";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import { closeModal } from "../Modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
const ModalContainer = styled.div`
    display: grid;
    grid-template-rows: 60px 60px 140px 60px 60px 60px 60px;
    grid-template-columns: 400px;
    border-radius: 5px;
`;

interface IFieldRow {
    row: number;
}
const FieldRow = styled.div<IFieldRow>`
    grid-row: ${props => props.row};
    grid-column: 1;
`;

interface IProfileModal {
    profileAction(
        username: string,
        displayName: string,
        bio: string,
        link1: string,
        link2: string,
        link3: string
    ): ThunkAction<void, any, null, Action<string>>;
    displayName: string;
    bio: string;
    username: string;
    link1: string;
    link2: string;
    link3: string;
}

export const ProfileModal = (props: IProfileModal) => {
    const [displayName, setDisplayName] = useState(props.displayName);
    const [bio, setBio] = useState(props.bio);
    const [link1, setLink1] = useState(props.link1);
    const [link2, setLink2] = useState(props.link2);
    const [link3, setLink3] = useState(props.link3);
    const dispatch = useDispatch();

    const handleOnSubmit = async () => {
        try {
            dispatch(
                props.profileAction(
                    props.username,
                    displayName,
                    bio,
                    link1,
                    link2,
                    link3
                )
            );
            dispatch(closeModal());
        } catch (e) {
            dispatch(
                openSnackbar(
                    "Could not create project: " + e,
                    SnackbarType.Error
                )
            );
        }
    };
    const textFieldStyle = { marginBottom: 12, marginRight: 5 };

    return (
        <ModalContainer>
            <FieldRow row={1}>
                <h2>Edit Profile</h2>
            </FieldRow>

            <FieldRow row={2}>
                <TextField
                    style={textFieldStyle}
                    label={"Display Name"}
                    value={displayName}
                    onChange={e => {
                        setDisplayName(e.target.value);
                    }}
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={3}>
                <TextField
                    style={textFieldStyle}
                    label={"Bio"}
                    value={bio}
                    multiline={true}
                    rows="4"
                    onChange={e => {
                        setBio(e.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={4}>
                <TextField
                    style={textFieldStyle}
                    label={"Link 1"}
                    value={link1}
                    rows="4"
                    onChange={e => {
                        setLink1(e.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={5}>
                <TextField
                    style={textFieldStyle}
                    label={"Link 2"}
                    value={link2}
                    rows="4"
                    onChange={e => {
                        setLink2(e.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={6}>
                <TextField
                    style={textFieldStyle}
                    label={"Link 3"}
                    value={link3}
                    rows="4"
                    onChange={e => {
                        setLink3(e.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={7}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleOnSubmit}
                    style={{ marginTop: 11 }}
                >
                    Submit
                </Button>
            </FieldRow>
        </ModalContainer>
    );
};
