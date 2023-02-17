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
        <div>
            <h2>Confirm Project Delete</h2>
            <TextField
                label={"Project Name"}
                value={name}
                onChange={(event) => {
                    setName(event.target.value);
                }}
            />
            <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                    dispatch(deleteUserProject(projectUid));
                    dispatch(closeModal());
                }}
                style={{ marginTop: 11, marginLeft: 12 }}
                disabled={name !== projectName}
            >
                Delete
            </Button>
        </div>
    );
}
