import React, { useState } from "react";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import { isEmpty } from "lodash";
import { closeModal } from "../Modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { addUserProject } from "./actions";
export const AddProjectModal = (props: any) => {
    const [name, setName] = useState("New Project");
    const dispatch = useDispatch();
    const shouldDisable =
        isEmpty(name) || !name.match(/^[A-Za-z0-9 _]*[A-Za-z]+[A-Za-z0-9 _]*$/);
    const handleOnSubmit = async () => {
        try {
            dispatch(addUserProject(name));
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
        <div>
            <h2>Please Name Your Project</h2>
            <TextField
                style={textFieldStyle}
                label={"Project Name"}
                value={name}
                onChange={e => {
                    setName(e.target.value);
                }}
            />
            <Button
                variant="outlined"
                color="primary"
                disabled={shouldDisable}
                onClick={handleOnSubmit}
                style={{ marginTop: 11 }}
            >
                Create Project
            </Button>
        </div>
    );
};
