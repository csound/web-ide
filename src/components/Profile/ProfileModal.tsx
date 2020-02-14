import React, { useState } from "react";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import { updateUserProfile } from "./actions";
import { closeModal } from "../Modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const ModalContainer = styled.div`
    display: grid;
    grid-template-rows: 80px 80px 60px 140px 60px 60px 60px 60px;
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
    username: string;
    displayName: string;
    bio: string;
    link1: string;
    link2: string;
    link3: string;
    existingNames: string[];
}

export const ProfileModal = (props: IProfileModal) => {
    const [username, setUsername] = useState(props.username);
    const [displayName, setDisplayName] = useState(props.displayName);
    const [bio, setBio] = useState(props.bio);
    const [link1, setLink1] = useState(props.link1);
    const [link2, setLink2] = useState(props.link2);
    const [link3, setLink3] = useState(props.link3);
    const dispatch = useDispatch();

    const existingName = props.existingNames.includes(username);
    const nonAlphaNumeric = !/^[a-zA-Z0-9\-_]{5,40}$/.test(username);
    const emptyString = username.length === 0;

    let errorMessage = "";

    if (existingName === true) {
        errorMessage = "Existing username";
    }

    if (nonAlphaNumeric === true) {
        errorMessage = "Only alphanumeric no spaces, 5-40 characters";
    }

    const handleOnSubmit = async () => {
        try {
            dispatch(
                updateUserProfile(
                    props.username,
                    username,
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
                    label={"Username"}
                    value={username}
                    onChange={e => {
                        setUsername(e.target.value);
                    }}
                    fullWidth
                    helperText={errorMessage}
                    error={nonAlphaNumeric || existingName || emptyString}
                />
            </FieldRow>
            <FieldRow row={3}>
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
            <FieldRow row={4}>
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
            <FieldRow row={5}>
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
            <FieldRow row={6}>
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
            <FieldRow row={7}>
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
            <FieldRow row={8}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleOnSubmit}
                    style={{ marginTop: 11 }}
                    disabled={nonAlphaNumeric || existingName || emptyString}
                >
                    Submit
                </Button>
            </FieldRow>
        </ModalContainer>
    );
};
