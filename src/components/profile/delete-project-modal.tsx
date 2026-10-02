import { ProfileDialog } from "./profile-dialog";
import React, { useState } from "react";
import { useDispatch } from "@root/store";
import { closeModal } from "@comp/modal/actions";
import { TextField, Button } from "@mui/material";
import { deleteUserProject } from "./actions";

export function DeleteProjectModal({
    projectUid,
    projectName
}: {
    projectUid: string;
    projectName: string;
}) {
    const [name, setName] = useState("");
    const dispatch = useDispatch();
    return (
        <ProfileDialog
            title="Confirm Project Delete"
            width={440}
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
                        color="error"
                        onClick={() => {
                            dispatch(deleteUserProject(projectUid));
                            dispatch(closeModal());
                        }}
                        disabled={name !== projectName}
                    >
                        Delete
                    </Button>
                </>
            }
        >
            <TextField
                label="Project Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                helperText={<>Type “{projectName}” to confirm.</>}
            />
        </ProfileDialog>
    );
}
