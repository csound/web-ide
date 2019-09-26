import React, { useState } from "react";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import { isEmpty } from "lodash";
import { closeModal } from "../Modal/actions";
import { TextField, Button, MenuItem, Paper } from "@material-ui/core";
import { useDispatch } from "react-redux";
import { addUserProject } from "./actions";
import styled from "styled-components";

import ReactAutosuggestExample from "./TagAutoSuggest";
const ModalContainer = styled.div`
    display: grid;
    grid-template-rows: 60px 60px 140px 120px 60px;
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

export const AddProjectModal = (props: any) => {
    const [name, setName] = useState("New Project");
    const [description, setDescription] = useState("");
    const [chips, setChips] = useState([] as string[]);
    const [textFieldInput, setTextFieldInput] = useState("");
    const [suggestions, setSuggestions] = useState([] as string[]);
    const dispatch = useDispatch();
    const shouldDisable =
        isEmpty(name) || !name.match(/^[A-Za-z0-9 _]*[A-Za-z]+[A-Za-z0-9 _]*$/);
    const handleOnSubmit = async () => {
        try {
            dispatch(addUserProject(name, description));
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
                <h2>Please Name Your Project</h2>
            </FieldRow>

            <FieldRow row={2}>
                <TextField
                    style={textFieldStyle}
                    label={"Name"}
                    value={name}
                    onChange={e => {
                        setName(e.target.value);
                    }}
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={3}>
                <TextField
                    style={textFieldStyle}
                    label={"Description"}
                    value={description}
                    multiline={true}
                    rows="4"
                    onChange={e => {
                        setDescription(e.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={4}>
                <ReactAutosuggestExample fullWidth label={"Tags"} />
            </FieldRow>
            <FieldRow row={5}>
                <Button
                    variant="outlined"
                    color="primary"
                    disabled={shouldDisable}
                    onClick={handleOnSubmit}
                    style={{ marginTop: 11 }}
                >
                    Create Project
                </Button>
            </FieldRow>
        </ModalContainer>
    );
};
