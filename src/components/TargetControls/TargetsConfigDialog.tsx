import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveChangesToTarget } from "./actions";
import { setOnCloseModal, closeModal } from "@comp/Modal/actions";
import { useTheme } from "emotion-theming";
import PerfectScrollbar from "react-perfect-scrollbar";
import Select from "react-select";
import {
    selectDefaultTargetName,
    selectProjectDocuments,
    selectProjectTargets
} from "./selectors";
import {
    Checkbox,
    Fab,
    FormControlLabel,
    FormGroup,
    TextField
} from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip";
import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import { ICsoundOptions } from "@comp/Csound/types";
import { filenameToCsoundType } from "@comp/Csound/utils";
import { IStore } from "@store/types";
import { ITargetMap } from "./types";
import { IDocument, IDocumentsMap } from "@comp/Projects/types";
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

const dropdownStyle = {
    control: (provided, state) => SS.control,
    container: (provided, state) => SS.dropdownContainerForDialog,
    groupHeading: (provided, state) => SS.groupHeading,
    placeholder: (provided, state) => SS.placeholder,
    menu: (provided, state) => SS.menuForDialog,
    menuList: (provided, state) => SS.menuList,
    option: (provided, { isDisabled }) =>
        isDisabled ? SS.menuOptionDisabled : SS.menuOption,
    indicatorsContainer: (provided, state) => SS.indicatorContainer,
    indicatorSeparator: (provided, state) => SS.indicatorSeparator
};

const TargetsConfigDialog = () => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    const activeProjectUid: string = useSelector((store: IStore) => {
        return pathOr("", ["ProjectsReducer", "activeProjectUid"], store);
    });

    const defaultTargetName: string | null = useSelector(
        selectDefaultTargetName(activeProjectUid)
    );

    const documentsMap: IDocumentsMap | null = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const allDocuments: IDocument[] | null = documentsMap
        ? values(documentsMap)
        : null;

    const targets: ITargetMap | null = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsToLocalState = () =>
        targets
            ? sort(
                  ascend(prop("targetName")),
                  reduce(
                      (acc: ITargetFromInput[], k: string) =>
                          (pipe as any)(
                              assoc("isNameValid", true),
                              assoc("isTypeValid", true),
                              assoc("isOtherwiseValid", true),
                              assoc(
                                  "isDefaultTarget",
                                  defaultTargetName === targets[k].targetName
                              ),
                              assoc("oldTargetName", targets[k].targetName),
                              x => append(x, acc)
                          )(targets[k]),
                      [],
                      keys(targets) as string[]
                  )
              )
            : ([] as ITargetFromInput[]);

    const [storedTargets, setStoredTargets] = useState(targetsToLocalState());

    useEffect(() => {
        setStoredTargets(targetsToLocalState());
        return () => setStoredTargets(targetsToLocalState());
        // eslint-disable-next-line
    }, []);

    const [newTargets, setNewTargets] = useState(storedTargets);

    const labelFromValue = value =>
        ({
            main: "Main Mode",
            playlist: "Playlist Mode",
            render: "Render Mode"
        }[value]);

    const makeOption = (value, disabled: boolean) => ({
        value,
        label: labelFromValue(value),
        disabled
    });

    const mainArea = map((index: number) => {
        const thisTarget = newTargets[index] as ITargetFromInput;

        const {
            targetName,
            oldTargetName,
            targetType,
            isDefaultTarget
        } = thisTarget;
        const maybeMainTargetDocumentUid = thisTarget.targetDocumentUid;
        const validateTargetType = targetType =>
            typeof targetType === "string" ? !isEmpty(targetName) : false;

        const validateTargetDocument = targetDocumentUid =>
            typeof targetDocumentUid === "string"
                ? !isEmpty(targetDocumentUid)
                : false;
        const handleSelect = curry((field: string, e) => {
            setNewTargets(
                (pipe as any)(
                    assocPath([index, field], e.value),
                    when(
                        () => field === "targetType",
                        assocPath(
                            [index, "isTypeValid"],
                            validateTargetType(e.value)
                        )
                    ),
                    when(
                        () => field === "targetDocumentUid",
                        assocPath(
                            [index, "isOtherwiseValid"],
                            validateTargetDocument(e.value)
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

        const validateTargetName = targetName =>
            !isEmpty(targetName) &&
            (oldTargetName !== targetName
                ? !reject(
                      propEq("oldTargetName", oldTargetName),
                      newTargets
                  ).some(propEq("targetName", targetName))
                : true);

        const targetNameIsValid = validateTargetName(targetName);
        const handleTargetNameInput = e => {
            const isNameValid = validateTargetName(e.target.value);
            (pipe as any)(
                assocPath([index, "targetName"], e.target.value),
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
                            variant="round"
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
                        options={[
                            makeOption("main", false),
                            makeOption("playlist", true),
                            makeOption("render", true)
                        ]}
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
                                value={maybeMainTargetDocumentUid || ""}
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
                                    map((doc: any) => ({
                                        label: doc.filename,
                                        value: doc.documentUid
                                    }))
                                )(allDocuments as IDocument[])}
                                isOptionDisabled={prop("disabled")}
                                isSearchable={false}
                                closeMenuOnSelect={true}
                                placeholder={pathOr(
                                    "Select main document",
                                    [
                                        maybeMainTargetDocumentUid || "",
                                        "filename"
                                    ],
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
                                    onChange={e =>
                                        setNewTargets(
                                            map(
                                                (target: ITargetFromInput) =>
                                                    assoc(
                                                        "isDefaultTarget",
                                                        target.targetName ===
                                                            targetName
                                                            ? e.target.checked
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
    const someChangesMade: boolean = !equals(storedTargets, newTargets);
    const shouldDisallowSave: boolean = someErrorPresent || !someChangesMade;

    useEffect(() => {
        dispatch(
            setOnCloseModal(() => {
                shouldDisallowSave && dispatch(closeModal());
            })
        );
        // eslint-disable-next-line
    }, [shouldDisallowSave]);

    const firestoreNewTargets = (newTargets: ITargetFromInput[]) =>
        reduce(
            (
                acc: ITargetMap,
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
                return assoc(targetName, firebaseTarget, acc);
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
                        maybeDefaultTarget
                            ? maybeDefaultTarget.targetName
                            : null,
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
        <PerfectScrollbar css={SS.targetsDialog}>
            {isEmpty(targets) && fallbackText}
            {mainArea}
            <hr css={hrCss} />
            {bottomArea}
        </PerfectScrollbar>
    );
};

export default TargetsConfigDialog;
