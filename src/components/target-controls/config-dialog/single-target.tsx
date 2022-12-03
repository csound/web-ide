import React from "react";
import Select from "react-select";
import { ascend, either, filter, equals, map, pipe, prop, sort } from "ramda";
import { useTheme } from "@emotion/react";
import DeleteIcon from "@material-ui/icons/DeleteTwoTone";
import Radio from "@material-ui/core/Radio";
import Checkbox from "@material-ui/core/Checkbox";
import Fab from "@material-ui/core/Fab";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import { IDocument } from "@comp/projects/types";
import { filenameToCsoundType } from "@comp/csound/utils";
import { ITargetFromInput } from "../types";
import { validateTargetName } from "./utils";
import { reactSelectDropdownStyle } from "../styles";
import * as SS from "./styles";

interface TargetControlsConfigDialogSingleTargetProperties {
    allDocuments: IDocument[];
    targetIndex: number;
    targetName: string;
    oldTargetName: string;
    targetDocumentUid: string;
    isDefaultTarget: boolean;
    useCsound7: boolean;
    handleTargetDelete: (targetName: string) => void;
    handleTargetNameChange: (props: {
        nextValue: string;
        oldTargetName: string;
        targetIndex: number;
    }) => void;
    handleSelectTargetDocument: (props: {
        nextTargetDocumentUid: string;
        targetIndex: number;
    }) => void;
    handleMarkAsDefaultTarget: (nextTarget: string) => void;
    handleEnableCsound7: (props: {
        enableCsound7: boolean;
        targetIndex: number;
    }) => void;
    newTargets: ITargetFromInput[];
}

export const TargetControlsConfigDialogSingleTarget = ({
    targetIndex,
    targetName,
    oldTargetName,
    targetDocumentUid,
    isDefaultTarget,
    useCsound7,
    handleSelectTargetDocument,
    handleTargetNameChange,
    handleTargetDelete,
    handleMarkAsDefaultTarget,
    handleEnableCsound7,
    newTargets,
    allDocuments
}: TargetControlsConfigDialogSingleTargetProperties) => {
    const theme = useTheme();
    const targetNameIsValid = validateTargetName({
        targetName,
        oldTargetName,
        newTargets
    });

    const targetDocument = allDocuments.find(
        (doc: IDocument) => doc.documentUid === targetDocumentUid
    );

    return (
        <div
            css={SS.targetsDialogMain}
            style={{
                borderColor: targetNameIsValid ? "inherit" : theme.errorText
            }}
        >
            <FormGroup style={{ marginBottom: "24px" }} row>
                <Tooltip
                    title={
                        "Default target is what will be picked when a guest plays your project"
                    }
                    placement="right-end"
                >
                    <FormControlLabel
                        control={
                            <Radio
                                color="primary"
                                checked={isDefaultTarget}
                                onChange={(event) =>
                                    !isDefaultTarget &&
                                    handleMarkAsDefaultTarget(targetName)
                                }
                            />
                        }
                        label="Mark as default target"
                    />
                </Tooltip>
                <Tooltip title={"delete target"} placement="right-end">
                    <span>
                        <Fab
                            onClick={() => handleTargetDelete(targetName)}
                            css={SS.closeIcon}
                            color="secondary"
                            variant="circular"
                            size="small"
                            disabled={newTargets.length === 1}
                        >
                            <DeleteIcon
                                style={
                                    newTargets.length > 1
                                        ? { fill: "white" }
                                        : {}
                                }
                            />
                        </Fab>
                    </span>
                </Tooltip>
            </FormGroup>

            <FormGroup row>
                <TextField
                    label="target name"
                    value={targetName}
                    error={!targetNameIsValid}
                    onChange={(event: any) =>
                        handleTargetNameChange({
                            oldTargetName,
                            nextValue: event.target.value,
                            targetIndex
                        })
                    }
                />
            </FormGroup>
            <FormGroup style={{ marginTop: 24 }} row>
                <div>
                    <p css={SS.targetLabel}>
                        {"selected csound document to play"}
                    </p>
                    <Select
                        value={targetDocumentUid || ""}
                        onChange={({ value }: any) =>
                            typeof value === "string" &&
                            handleSelectTargetDocument({
                                targetIndex,
                                nextTargetDocumentUid: value
                            })
                        }
                        options={pipe(
                            filter<any, any>(
                                either(
                                    ({ filename }) =>
                                        equals(
                                            "csd",
                                            filenameToCsoundType(filename)
                                        ),
                                    ({ filename }) =>
                                        equals(
                                            "orc",
                                            filenameToCsoundType(filename)
                                        )
                                )
                            ),
                            sort(ascend(prop("filename"))),
                            map((document_: any) => ({
                                label: document_.filename,
                                value: document_.documentUid
                            }))
                        )(allDocuments as IDocument[])}
                        isSearchable={false}
                        closeMenuOnSelect={true}
                        placeholder={
                            targetDocument
                                ? targetDocument.filename
                                : "Select main document"
                        }
                        styles={reactSelectDropdownStyle(theme) as any}
                    />
                </div>
            </FormGroup>

            <FormGroup row>
                <FormControlLabel
                    control={
                        <Checkbox
                            color="primary"
                            checked={useCsound7 || false}
                            onChange={(event) =>
                                handleEnableCsound7({
                                    targetIndex,
                                    enableCsound7: event.target.checked
                                })
                            }
                        />
                    }
                    label="Run with csound7-alpha"
                />
            </FormGroup>
        </div>
    );
};
