import React, { useState } from "react";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";
import { updateUserProfile } from "./actions";
import { closeModal } from "../modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { useTheme } from "@emotion/react";
import * as TargetSS from "@comp/target-controls/styles";
import styled from "styled-components";
import Select from "react-select";

const ModalContainer = styled.div`
    display: grid;
    grid-auto-rows: minmax(60px, auto);
    grid-template-columns: 400px;
    border-radius: 5px;
`;

interface IFieldRow {
    row: number;
}
const FieldRow = styled.div<IFieldRow>`
    grid-row: ${(properties) => properties.row};
    grid-column: 1;
`;

interface IProfileModal {
    username: string;
    displayName: string;
    bio: string;
    link1: string;
    link2: string;
    link3: string;
    backgroundIndex: number;
    existingNames: string[];
}

const backgroundOptions = [
    { label: "carbon", value: 0 },
    { label: "stripes", value: 1 },
    { label: "microbial", value: 2 },
    { label: "tartan", value: 3 },
    { label: "yin yang", value: 4 }
];

export const ProfileModal = (properties: IProfileModal): React.ReactElement => {
    const [username, setUsername] = useState(properties.username);
    const [displayName, setDisplayName] = useState(properties.displayName);
    const [bio, setBio] = useState(properties.bio);
    const [link1, setLink1] = useState(properties.link1);
    const [link2, setLink2] = useState(properties.link2);
    const [link3, setLink3] = useState(properties.link3);
    const [backgroundIndex, setBackgroundIndex] = useState(
        properties.backgroundIndex || 0
    );
    const dispatch = useDispatch();
    const theme = useTheme();
    const existingName = properties.existingNames.includes(username);
    const nonAlphaNumeric = !/^[\w-]{5,40}$/.test(username);
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
                    properties.username,
                    username,
                    displayName,
                    bio,
                    link1,
                    link2,
                    link3,
                    backgroundIndex
                )
            );
            dispatch(closeModal());
        } catch (error) {
            dispatch(
                openSnackbar(
                    "Could not create project: " + error,
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
                    onChange={(event) => {
                        setUsername(event.target.value);
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
                    onChange={(event) => {
                        setDisplayName(event.target.value);
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
                    onChange={(event) => {
                        setBio(event.target.value);
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
                    onChange={(event) => {
                        setLink1(event.target.value);
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
                    onChange={(event) => {
                        setLink2(event.target.value);
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
                    onChange={(event) => {
                        setLink3(event.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={8} style={{ marginTop: 24 }}>
                <div>
                    <strong>{"Profile page background shape"}</strong>
                    <Select
                        value={backgroundIndex}
                        placeholder={backgroundOptions[backgroundIndex].label}
                        isSearchable={false}
                        onChange={(event: any) =>
                            setBackgroundIndex(event.value)
                        }
                        options={backgroundOptions as any}
                        styles={
                            {
                                control: (provided, state) => TargetSS.control,
                                container: (provided, state) =>
                                    TargetSS.dropdownContainer(theme),
                                groupHeading: (provided, state) =>
                                    TargetSS.groupHeading,
                                placeholder: (provided, state) =>
                                    TargetSS.placeholder,
                                menu: (provided, state) => TargetSS.menu,
                                menuList: (provided, state) =>
                                    TargetSS.menuList(theme),
                                option: (provided, state) =>
                                    TargetSS.menuOption,
                                indicatorsContainer: (provided, state) =>
                                    TargetSS.indicatorContainer(theme),
                                indicatorSeparator: (provided, state) =>
                                    TargetSS.indicatorSeparator
                            } as any
                        }
                    />
                </div>
            </FieldRow>
            <FieldRow row={9} style={{ marginTop: 24 }}>
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
