import React, { useState } from "react";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import { isEmpty } from "lodash";
import { closeModal } from "../Modal/actions";
import { SliderPicker } from "react-color";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { TextField, Button, Popover, Grid } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import IconButton from "@material-ui/core/IconButton";
import ReactAutosuggestExample from "./TagAutoSuggest";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { selectTagsInput } from "./selectors";
import SVGPaths, { SVGComponents } from "./SVGPaths";
const ModalContainer = styled.div`
    display: grid;
    grid-template-rows: 60px 60px 140px 90px 120px 60px;
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

const IconPickerContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr;
    grid-gap: 10px;
    padding: 4px;
    align-items: center;
`;

type IIconPickerIconButton = {
    bgcolor: string;
};
const IconPickerIconButton = styled(IconButton)<IIconPickerIconButton>`
    grid-column: 1;
    grid-row: 1;
    && {
        border-radius: 4px;
        border: 2px solid black;
        background-color: ${props => props.bgcolor};
        fill: #dfa234;
        padding: 0px;
    }
`;

const StyledSketchPicker = styled(SliderPicker)`
    grid-column: 2;
    grid-row: 1;
`;

const RadioGroupContainer = styled.div`
    grid-column: 3;
    grid-row: 1;
`;

const PopoverContainer = styled.div`
    padding: 10px;
    width: 300px;
    height: 400px;
`;

interface IProjectModal {
    projectAction(
        name: string,
        description: string,
        currentTags: string[],
        projectID: string,
        iconName: string,
        iconForegroundColor: string,
        iconBackgroundColor: string
    ): ThunkAction<void, any, null, Action<string>>;
    name: string;
    description: string;
    label: string;
    projectID: string;
    iconName: string;
    iconForegroundColor: string;
    iconBackgroundColor: string;
}

export const ProjectModal = (props: IProjectModal) => {
    const [name, setName] = useState(props.name);
    const [description, setDescription] = useState(props.description);
    const [iconName, setIconName] = useState(props.iconName);
    const [foregroundColor, setIsForegroundColor] = useState(false);
    const [iconForegroundColor, setIconForegroundColor] = useState(
        props.iconForegroundColor || "#fff"
    );
    const [iconBackgroundColor, setIconBackgroundColor] = useState(
        props.iconBackgroundColor || "#000"
    );

    const [popupState, setPopupState] = useState(false);
    const [anchorElement, setAnchorElement] = useState(null);
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
                    props.projectID,
                    iconName,
                    iconForegroundColor,
                    iconBackgroundColor
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

    const handleProfileDropDown = e => {
        e.preventDefault();
        setPopupState(!popupState);
        setAnchorElement(e.currentTarget);
    };

    const handlePopoverClose = () => {
        setPopupState(false);
    };

    let isIconComponent = false;
    let IconComponent: React.ElementType = SVGComponents[`fadADRComponent`];
    if (SVGPaths[iconName]) {
        IconComponent = SVGComponents[`${iconName}Component`];
        isIconComponent = true;
    }
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
                <IconPickerContainer>
                    <IconPickerIconButton
                        aria-label="delete"
                        onClick={handleProfileDropDown}
                        bgcolor={iconBackgroundColor}
                    >
                        {isIconComponent !== false && (
                            <IconComponent
                                width={"100%"}
                                height={"100%"}
                                fill={iconForegroundColor}
                            />
                        )}
                    </IconPickerIconButton>
                    <Popover
                        open={popupState}
                        anchorEl={anchorElement}
                        className="popover_class"
                        anchorOrigin={{ horizontal: "center", vertical: "top" }}
                        transformOrigin={{
                            vertical: "bottom",
                            horizontal: "center"
                        }}
                        onClose={handlePopoverClose}
                    >
                        <PopoverContainer>
                            <Grid container spacing={1}>
                                {Array.isArray(Object.entries(SVGPaths)) &&
                                    Object.entries(SVGPaths).map((e, i) => {
                                        return (
                                            <Grid item xs={6} sm={3} key={i}>
                                                <IconButton
                                                    aria-label="delete"
                                                    onClick={() => {
                                                        setIconName(e[0]);
                                                        handlePopoverClose();
                                                    }}
                                                >
                                                    <img
                                                        alt={"svg icon"}
                                                        src={`${e[1]}`}
                                                        width={40}
                                                        height={40}
                                                    />
                                                </IconButton>
                                            </Grid>
                                        );
                                    })}
                            </Grid>
                        </PopoverContainer>
                    </Popover>
                    <StyledSketchPicker
                        color={
                            foregroundColor
                                ? iconForegroundColor
                                : iconBackgroundColor
                        }
                        onChangeComplete={e => {
                            if (foregroundColor) {
                                setIconForegroundColor(e.hex);
                            } else {
                                setIconBackgroundColor(e.hex);
                            }
                        }}
                    />
                    <RadioGroupContainer>
                        <RadioGroup
                            aria-label="gender"
                            name="gender1"
                            value={
                                foregroundColor ? "foreground" : "background"
                            }
                            onChange={e => {
                                setIsForegroundColor(
                                    e.target.value === "foreground"
                                        ? true
                                        : false
                                );
                            }}
                        >
                            <FormControlLabel
                                value="foreground"
                                control={<Radio />}
                                label="Foreground"
                            />
                            <FormControlLabel
                                value="background"
                                control={<Radio />}
                                label="Background"
                            />
                        </RadioGroup>
                    </RadioGroupContainer>
                </IconPickerContainer>
            </FieldRow>
            <FieldRow row={6}>
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
