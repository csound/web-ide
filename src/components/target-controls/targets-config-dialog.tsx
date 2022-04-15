import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveChangesToTarget } from "./actions";
import { setOnCloseModal, closeModal } from "@comp/modal/actions";
import { useTheme } from "@emotion/react";
import Select from "react-select";
import {
    selectDefaultTargetName,
    selectProjectDocuments,
    selectProjectTargets
} from "./selectors";
import Checkbox from "@material-ui/core/Checkbox";
import Fab from "@material-ui/core/Fab";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import { ICsoundOptions } from "@comp/csound/types";
import { filenameToCsoundType } from "@comp/csound/utils";
import { IStore } from "@store/types";
import { ITargetMap } from "./types";
import { IDocument, IDocumentsMap } from "@comp/projects/types";
import {
    append,
    ascend,
    assoc,
    assocPath,
    curry,
    either,
    equals,
    isEmpty,
    filter,
    find,
    map,
    keys,
    path,
    pathOr,
    pipe,
    prop,
    propEq,
    range,
    reject,
    reduce,
    sort,
    values,
    when
} from "ramda";
import { hr as hrCss } from "@styles/_common";
import * as SS from "./styles";

interface ITargetFromInput {
    targetName: string;
    oldTargetName: string;
    targetType: string;
    isDefaultTarget: boolean;
    isNameValid: boolean;
    isTypeValid: boolean;
    isOtherwiseValid: boolean;
    csoundOptions?: ICsoundOptions;
    targetDocumentUid?: string;
}

const labelFromValue = (value) =>
    ({
        main: "Main Mode",
        playlist: "Playlist Mode",
        render: "Render Mode"
    }[value]);

const validateTargetDocument = (targetDocumentUid) =>
    typeof targetDocumentUid === "string" ? !isEmpty(targetDocumentUid) : false;

const makeOption = (value: string, disabled: boolean) => ({
    value,
    label: labelFromValue(value),
    disabled
});

const TargetsConfigDialog = (): React.ReactElement => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    const dropdownStyle = {
        control: (provided, state) => SS.control(theme),
        container: (provided, state) => SS.dropdownContainerForDialog(theme),
        valueContainer: (provided, state) => SS.valueContainer(theme),
        groupHeading: (provided, state) => SS.groupHeading,
        placeholder: (provided, state) => SS.placeholder,
        menu: (provided, state) => SS.menuForDialog(theme),
        menuList: (provided, state) => SS.menuList(theme),
        option: (provided, { isDisabled }) =>
            isDisabled ? SS.menuOptionDisabled(theme) : SS.menuOption(theme),
        indicatorsContainer: (provided, state) => SS.indicatorContainer(theme),
        indicatorSeparator: (provided, state) => SS.indicatorSeparator
    };

    const activeProjectUid: string = useSelector((store: IStore) => {
        return pathOr("", ["ProjectsReducer", "activeProjectUid"], store);
    });

    const defaultTargetName: string | undefined = useSelector(
        selectDefaultTargetName(activeProjectUid)
    );

    const documentsMap: IDocumentsMap | undefined = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const allDocuments: IDocument[] | undefined =
        documentsMap && values(documentsMap);

    const targets: ITargetMap | undefined = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsToLocalState = useCallback(
        () =>
            targets
                ? sort(
                      ascend(prop("targetName")),
                      reduce(
                          (accumulator: ITargetFromInput[], k: string) =>
                              (pipe as any)(
                                  assoc("isNameValid", true),
                                  assoc("isTypeValid", true),
                                  assoc("isOtherwiseValid", true),
                                  assoc(
                                      "isDefaultTarget",
                                      defaultTargetName ===
                                          targets[k].targetName
                                  ),
                                  assoc("oldTargetName", targets[k].targetName),
                                  (x) => append(x, accumulator)
                              )(targets[k]),
                          [],
                          keys(targets) as string[]
                      )
                  )
                : ([] as ITargetFromInput[]),
        [defaultTargetName, targets]
    );

    const [storedTargets, setStoredTargets] = useState(targetsToLocalState());

    useEffect(() => {
        setStoredTargets(targetsToLocalState());
        return () => setStoredTargets(targetsToLocalState());
    }, [targetsToLocalState]);

    const [newTargets, setNewTargets] = useState(storedTargets);

    const mainArea = map((index: number) => {
        const thisTarget = newTargets[index] as ITargetFromInput;

        const { targetName, oldTargetName, targetType, isDefaultTarget } =
            thisTarget;
        const { targetDocumentUid } = thisTarget;
        const validateTargetType = (targetType) =>
            typeof targetType === "string" ? !isEmpty(targetName) : false;

        const handleSelect = curry((field: string, error) => {
            setNewTargets(
                (pipe as any)(
                    assocPath([index, field], error.value),
                    when(
                        () => field === "targetType",
                        assocPath(
                            [index, "isTypeValid"],
                            validateTargetType(error.value)
                        )
                    ),
                    when(
                        () => field === "targetDocumentUid",
                        assocPath(
                            [index, "isOtherwiseValid"],
                            validateTargetDocument(error.value)
                        )
                    )
                )(newTargets)
            );
        });

        const dropdownStyleWithValidation = (field: string) =>
            isEmpty(path([index, field], newTargets))
                ? assoc(
                      "control",
                      (provided, state) => SS.controlError,
                      dropdownStyle
                  )
                : dropdownStyle;

        const validateTargetName = (targetName) =>
            !isEmpty(targetName) &&
            (oldTargetName !== targetName
                ? !reject(
                      propEq("oldTargetName", oldTargetName),
                      newTargets
                  ).some(propEq("targetName", targetName))
                : true);

        const targetNameIsValid = validateTargetName(targetName);
        const handleTargetNameInput = (event) => {
            const isNameValid = validateTargetName(event.target.value);
            (pipe as any)(
                assocPath([index, "targetName"], event.target.value),
                assocPath([index, "isNameValid"], isNameValid),
                setNewTargets
            )(newTargets);
        };

        return (
            <div
                key={index}
                css={SS.targetsDialogMain}
                style={{
                    borderColor: targetNameIsValid ? "inherit" : theme.errorText
                }}
            >
                <FormGroup row>
                    <TextField
                        label="target name"
                        value={targetName}
                        error={!targetNameIsValid}
                        onChange={handleTargetNameInput}
                    />
                    <Tooltip title={"delete target"} placement="right-end">
                        <Fab
                            onClick={() =>
                                setNewTargets(
                                    reject(
                                        propEq("targetName", targetName),
                                        newTargets
                                    )
                                )
                            }
                            css={SS.closeIcon}
                            color="secondary"
                            variant="circular"
                            size="small"
                        >
                            <CloseIcon />
                        </Fab>
                    </Tooltip>
                </FormGroup>
                <FormGroup style={{ marginTop: 24 }} row>
                    <p css={SS.targetLabel}>{"target type"}</p>
                    <Select
                        defaultValue={"main"}
                        value={targetType}
                        onChange={handleSelect("targetType")}
                        options={
                            [
                                makeOption("main", false),
                                makeOption("playlist", true),
                                makeOption("render", true)
                            ] as any
                        }
                        isOptionDisabled={prop("disabled")}
                        isSearchable={false}
                        closeMenuOnSelect={true}
                        placeholder={
                            targetType ? labelFromValue(targetType) : "Type"
                        }
                        styles={dropdownStyleWithValidation("targetType")}
                    />
                    {targetType === "main" && (
                        <div style={{ marginLeft: 12 }}>
                            <p css={SS.targetLabel}>{"main document"}</p>
                            <Select
                                value={targetDocumentUid || ""}
                                onChange={handleSelect("targetDocumentUid")}
                                options={pipe(
                                    filter<any, any>(
                                        either(
                                            ({ filename }) =>
                                                equals(
                                                    "csd",
                                                    filenameToCsoundType(
                                                        filename
                                                    )
                                                ),
                                            ({ filename }) =>
                                                equals(
                                                    "orc",
                                                    filenameToCsoundType(
                                                        filename
                                                    )
                                                )
                                        )
                                    ),
                                    sort(ascend(prop("filename"))),
                                    map((document_: any) => ({
                                        label: document_.filename,
                                        value: document_.documentUid
                                    }))
                                )(allDocuments as IDocument[])}
                                isOptionDisabled={prop("disabled")}
                                isSearchable={false}
                                closeMenuOnSelect={true}
                                placeholder={pathOr(
                                    "Select main document",
                                    [targetDocumentUid || "", "filename"],
                                    documentsMap
                                )}
                                styles={dropdownStyleWithValidation(
                                    "targetDocumentUid"
                                )}
                            />
                        </div>
                    )}
                </FormGroup>{" "}
                {targetType === "main" && (
                    <FormGroup row>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    color="primary"
                                    checked={isDefaultTarget}
                                    onChange={(event) =>
                                        setNewTargets(
                                            map(
                                                (target: ITargetFromInput) =>
                                                    assoc(
                                                        "isDefaultTarget",
                                                        target.targetName ===
                                                            targetName
                                                            ? event.target
                                                                  .checked
                                                            : false,
                                                        target
                                                    ),
                                                newTargets
                                            )
                                        )
                                    }
                                />
                            }
                            label="Mark as default target"
                        />
                    </FormGroup>
                )}
            </div>
        );
    }, range(0, newTargets.length));

    const createTargetButton = (
        <Fab
            color="primary"
            variant="extended"
            aria-label="Add"
            size="small"
            onClick={() => {
                setNewTargets(
                    append(
                        {
                            csoundOptions: {} as ICsoundOptions,
                            isNameValid: false,
                            isTypeValid: false,
                            isOtherwiseValid: false,
                            isDefaultTarget: false,
                            targetDocumentUid: "",
                            targetName: "",
                            targetType: ""
                        } as ITargetFromInput,
                        newTargets
                    )
                );
            }}
        >
            Add Target
            <AddIcon />
        </Fab>
    );

    const someErrorPresent: boolean =
        newTargets.some(propEq("isNameValid", false)) ||
        newTargets.some(propEq("isTypeValid", false)) ||
        newTargets.some(propEq("isOtherwiseValid", false));
    const someChangesMade = !equals(storedTargets, newTargets);
    const shouldDisallowSave = someErrorPresent || !someChangesMade;

    useEffect(() => {
        dispatch(
            setOnCloseModal(() => {
                shouldDisallowSave && dispatch(closeModal());
            })
        );
    }, [dispatch, shouldDisallowSave]);

    const firestoreNewTargets = (newTargets: ITargetFromInput[]) =>
        reduce(
            (
                accumulator: ITargetMap,
                {
                    targetName,
                    targetType,
                    targetDocumentUid,
                    csoundOptions
                }: ITargetFromInput
            ) => {
                const firebaseTarget = {
                    targetName,
                    targetType,
                    targetDocumentUid,
                    csoundOptions
                };
                return assoc(targetName, firebaseTarget, accumulator);
            },
            {},
            newTargets as ITargetFromInput[]
        ) as ITargetMap;

    const saveButton = (
        <Fab
            color="primary"
            variant="extended"
            aria-label="Save"
            size="small"
            disabled={shouldDisallowSave}
            onClick={() => {
                const maybeDefaultTarget = find(
                    prop("isDefaultTarget"),
                    newTargets
                );
                dispatch(
                    saveChangesToTarget(
                        activeProjectUid,
                        firestoreNewTargets(newTargets),
                        maybeDefaultTarget && maybeDefaultTarget.targetName,
                        () => setStoredTargets(newTargets)
                    )
                );
            }}
            style={{ marginLeft: 12 }}
        >
            Save changes
            <SaveIcon />
        </Fab>
    );

    const closeButton = (
        <Fab
            color="primary"
            variant="extended"
            aria-label="Close"
            size="small"
            style={{ marginLeft: 12 }}
            onClick={() => dispatch(closeModal())}
        >
            Close
        </Fab>
    );

    const bottomArea = (
        <div css={SS.targetsDialogBottom}>
            {createTargetButton}
            {saveButton}
            {closeButton}
        </div>
    );

    const fallbackText = (
        <p
            style={{
                color: theme.altTextColor,
                userSelect: "none"
            }}
        >
            {'No targets found, press "ADD TARGET" to get started. '}
        </p>
    );
    return (
        <div css={SS.targetsDialog}>
            {isEmpty(targets) && fallbackText}
            {mainArea}
            <hr css={hrCss} />
            {bottomArea}
        </div>
    );
};

export default TargetsConfigDialog;
