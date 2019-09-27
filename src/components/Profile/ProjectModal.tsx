import React, { useState } from "react";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import { isEmpty } from "lodash";
import { closeModal } from "../Modal/actions";
import { TextField, Button } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

import ReactAutosuggestExample from "./TagAutoSuggest";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { selectTagsInput } from "./selectors";
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

interface IProjectModal {
    projectAction(
        name: string,
        description: string,
        currentTags: string[],
        projectID: string
    ): ThunkAction<void, any, null, Action<string>>;
    name: string;
    description: string;
    label: string;
    projectID: string;
}

export const ProjectModal = (props: IProjectModal) => {
    const [name, setName] = useState(props.name);
    const [description, setDescription] = useState(props.description);
    const dispatch = useDispatch();
    const shouldDisable =
        isEmpty(name) || !name.match(/^[A-Za-z0-9 _]*[A-Za-z]+[A-Za-z0-9 _]*$/);
    const currentTags = useSelector(selectTagsInput);

    const handleOnSubmit = async () => {
        try {
            dispatch(
                props.projectAction(
                    name,
                    description,
                    currentTags,
                    props.projectID
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
                    {props.label} Project
                </Button>
            </FieldRow>
        </ModalContainer>
    );
};
