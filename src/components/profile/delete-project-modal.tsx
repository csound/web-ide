import React, { useState } from "react";
import { closeModal } from "../modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { deleteUserProject } from "./actions";

export const getDeleteProjectModal = (document_: any) => (properties: any) => {
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
                    dispatch(deleteUserProject(document_));
                    dispatch(closeModal());
                }}
                style={{ marginTop: 11, marginLeft: 12 }}
                disabled={name !== document_.name}
            >
                Delete
            </Button>
        </div>
    );
};
