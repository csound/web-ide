import React, { useState } from "react";
import { closeModal } from "@comp/modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { deleteUserProject } from "./actions";
import { IProject } from "@comp/projects/types";

export const getDeleteProjectModal = (
    project: IProject
): (() => React.ReactElement) =>
    function DeleteProjectModal() {
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
                        dispatch(deleteUserProject(project));
                        dispatch(closeModal());
                    }}
                    style={{ marginTop: 11, marginLeft: 12 }}
                    disabled={name !== project.name}
                >
                    Delete
                </Button>
            </div>
        );
    };
