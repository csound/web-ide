import React, { useState } from "react";
import { ProfileDialog } from "./profile-dialog";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";
import { updateUserProfile } from "./actions";
import { closeModal } from "../modal/actions";
import { TextField, Button, MenuItem } from "@mui/material";
import { useDispatch } from "@root/store";
import { isValidUsername } from "./save-profile";

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
    const existingName = properties.existingNames.includes(username);
    const nonAlphaNumeric = !isValidUsername(username);
    const emptyString = username.length === 0;

    let errorMessage = "";

    if (existingName === true) {
        errorMessage = "Existing username";
    }

    if (nonAlphaNumeric === true) {
        errorMessage = "Use 1–49 letters, numbers, underscores or hyphens";
    }

    const handleOnSubmit = async () => {
        try {
            await dispatch(
                updateUserProfile(
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
                    "Could not save profile: " + error,
                    SnackbarType.Error
                )
            );
        }
    };
    return (
        <ProfileDialog
            title="Edit Profile"
            actions={
                <>
                    <Button
                        color="inherit"
                        onClick={() => dispatch(closeModal())}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleOnSubmit}
                        disabled={
                            nonAlphaNumeric || existingName || emptyString
                        }
                    >
                        Save changes
                    </Button>
                </>
            }
        >
            <TextField
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                fullWidth
                size="small"
                helperText={errorMessage}
                error={nonAlphaNumeric || existingName || emptyString}
            />
            <TextField
                label="Display Name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                label="Bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                size="small"
            />
            <TextField
                label="Link 1"
                value={link1}
                onChange={(event) => setLink1(event.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                label="Link 2"
                value={link2}
                onChange={(event) => setLink2(event.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                label="Link 3"
                value={link3}
                onChange={(event) => setLink3(event.target.value)}
                fullWidth
                size="small"
            />
            <TextField
                select
                label="Profile page background shape"
                value={backgroundIndex}
                onChange={(event) =>
                    setBackgroundIndex(Number(event.target.value))
                }
                fullWidth
                size="small"
            >
                {backgroundOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </TextField>
        </ProfileDialog>
    );
};
