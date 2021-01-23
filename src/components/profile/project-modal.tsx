import React, { useEffect, useState } from "react";
import Tooltip from "@material-ui/core/Tooltip";
import SVGPaths from "./svg-paths";
import { addUserProject, editUserProject } from "./actions";
import { openSnackbar } from "../snackbar/actions";
import { SnackbarType } from "../snackbar/types";
import { closeModal } from "../modal/actions";
import { SliderPicker } from "react-color";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { TextField, Button, Popover, Grid } from "@material-ui/core";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import IconButton from "@material-ui/core/IconButton";
import ReactAutosuggestExample from "./tag-auto-suggest";
import { selectTags } from "./selectors";
import { equals, isEmpty, not } from "ramda";
import ProjectIcon from "./project-icon";

const ModalContainer = styled.div`
    display: grid;
    grid-auto-rows: minmax(90px, auto);
    grid-template-columns: 400px;
    border-radius: 5px;
`;
interface IFieldRow {
    row: number;
}
const FieldRow = styled.div<IFieldRow>`
    grid-row: ${(properties) => properties.row};
    grid-column: 1;
`;

const IconPickerContainer = styled.div`
    display: grid;
    position: relative;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr;
    grid-gap: 10px;
    padding: 4px;
    align-items: center;
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
    name: string;
    description: string;
    label: string;
    projectID: string;
    iconForegroundColor: string | undefined;
    iconBackgroundColor: string | undefined;
    iconName: string | undefined;
    newProject: boolean;
}

export const ProjectModal = (properties: IProjectModal) => {
    const [name, setName] = useState(properties.name);
    const [description, setDescription] = useState(properties.description);
    const [iconName, setIconName] = useState(properties.iconName);
    const [foregroundColor, setIsForegroundColor] = useState(false);
    const [iconForegroundColor, setIconForegroundColor] = useState(
        properties.iconForegroundColor || "#fff"
    );
    const [iconBackgroundColor, setIconBackgroundColor] = useState(
        properties.iconBackgroundColor || "#000"
    );

    const [popupState, setPopupState] = useState(false);
    const [anchorElement, setAnchorElement] = useState();
    const dispatch = useDispatch();
    const currentTags = useSelector(selectTags(properties.projectID));
    const [modifiedTags, setModifiedTags] = useState([]);
    const shouldDisable = isEmpty(name);

    useEffect(() => {
        if (not(equals(currentTags, modifiedTags)) && !isEmpty(currentTags)) {
            setModifiedTags(currentTags);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTags]);

    const handleOnSubmit = async () => {
        try {
            dispatch(
                properties.newProject
                    ? addUserProject(
                          name,
                          description,
                          modifiedTags,
                          properties.projectID,
                          iconName || "default",
                          iconForegroundColor || "#000000",
                          iconBackgroundColor || "#FFF"
                      )
                    : editUserProject(
                          name,
                          description,
                          modifiedTags,
                          properties.projectID,
                          iconName || "default",
                          iconForegroundColor || "#000000",
                          iconBackgroundColor || "#FFF"
                      )
            );
            dispatch(closeModal());
        } catch (error) {
            dispatch(
                openSnackbar(
                    "Could not create project: " + error,
                    SnackbarType.Error
                )
            );
        }
    };
    const textFieldStyle = { marginBottom: 12, marginRight: 5 };

    const handleProfileDropDown = (event) => {
        event.preventDefault();
        setPopupState(!popupState);
        setAnchorElement(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setPopupState(false);
    };

    return (
        <ModalContainer>
            <FieldRow row={1}>
                {properties.newProject ? (
                    <h2>Please Name Your Project</h2>
                ) : (
                    <h2>{`Editing "${name}"`}</h2>
                )}
            </FieldRow>

            <FieldRow row={2}>
                <TextField
                    style={textFieldStyle}
                    label={"Name"}
                    error={shouldDisable}
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
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
                    onChange={(event) => {
                        setDescription(event.target.value);
                    }}
                    margin="normal"
                    fullWidth
                />
            </FieldRow>
            <FieldRow row={4}>
                <ReactAutosuggestExample
                    projectUid={properties.projectID}
                    modifiedTags={modifiedTags}
                    setModifiedTags={setModifiedTags}
                    fullWidth
                    label={"Tags"}
                />
            </FieldRow>
            <FieldRow row={5}>
                <IconPickerContainer>
                    <Tooltip title={"select an icon for your project"}>
                        <>
                            <ProjectIcon
                                iconName={iconName || ""}
                                iconBackgroundColor={iconBackgroundColor}
                                iconForegroundColor={iconForegroundColor}
                                onClick={handleProfileDropDown}
                            />
                        </>
                    </Tooltip>
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
                                    Object.entries(SVGPaths).map(
                                        (entry, index) => {
                                            return (
                                                <Grid
                                                    item
                                                    xs={6}
                                                    sm={3}
                                                    key={index}
                                                >
                                                    <IconButton
                                                        aria-label="delete"
                                                        onClick={() => {
                                                            setIconName(
                                                                entry[0]
                                                            );
                                                            handlePopoverClose();
                                                        }}
                                                    >
                                                        <img
                                                            alt={"svg icon"}
                                                            src={`${entry[1]}`}
                                                            width={40}
                                                            height={40}
                                                        />
                                                    </IconButton>
                                                </Grid>
                                            );
                                        }
                                    )}
                            </Grid>
                        </PopoverContainer>
                    </Popover>
                    <StyledSketchPicker
                        color={
                            foregroundColor
                                ? iconForegroundColor
                                : iconBackgroundColor
                        }
                        onChangeComplete={(event) => {
                            if (foregroundColor) {
                                setIconForegroundColor(event.hex);
                            } else {
                                setIconBackgroundColor(event.hex);
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
                            onChange={(event) => {
                                setIsForegroundColor(
                                    event.target.value === "foreground"
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
                    {properties.label}
                </Button>
            </FieldRow>
        </ModalContainer>
    );
};
