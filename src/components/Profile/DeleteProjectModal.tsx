import React, { useState } from "react";
import { closeModal } from "../Modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { deleteUserProject } from "./actions";
export const getDeleteProjectModal = (doc: any) => (props: any) => {
    const [name, setName] = useState("");
    const dispatch = useDispatch();
    return (
        <div>
            <h2>Confirm Project Delete</h2>
            <TextField
                label={"Project Name"}
                value={name}
                onChange={e => {
                    setName(e.target.value);
                }}
            />
            <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                    dispatch(deleteUserProject(doc));
                    dispatch(closeModal());
                }}
                style={{ marginTop: 11 }}
                disabled={name !== doc.name}
            >
                Delete
            </Button>
        </div>
    );
};
