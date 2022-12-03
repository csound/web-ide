import React from "react";
import { isEmpty } from "ramda";
// import CloseIcon from "@material-ui/icons/Close";
import { hr as hrCss } from "@styles/_common";
import { TargetControlsConfigDialogFooter } from "./footer";
import { TargetControlsConfigDialogSingleTarget } from "./single-target";
import { useTargetControlsDialog } from "./use-target-controls-dialog";
import * as SS from "./styles";

export const TargetControlsConfigDialog = () => {
    const {
        allDocuments,
        handleCloseModal,
        handleCreateNewTarget,
        handleTargetDelete,
        handleTargetNameChange,
        handleSelectTargetDocument,
        handleMarkAsDefaultTarget,
        handleEnableCsound7,
        handleSave,
        hasModifiedTargets,
        newTargets,
        targets,
        theme
    } = useTargetControlsDialog();

    return (
        <div css={SS.targetsDialog}>
            <h2>Project configuration</h2>
            {(!targets || isEmpty(targets)) && (
                <p
                    style={{
                        color: theme.altTextColor,
                        userSelect: "none"
                    }}
                >
                    {'No targets found, press "ADD TARGET" to get started. '}
                </p>
            )}
            {(newTargets || []).map((props, index) => (
                <TargetControlsConfigDialogSingleTarget
                    key={props.targetName + index}
                    targetIndex={index}
                    allDocuments={allDocuments}
                    handleTargetDelete={handleTargetDelete}
                    handleTargetNameChange={handleTargetNameChange}
                    handleSelectTargetDocument={handleSelectTargetDocument}
                    handleMarkAsDefaultTarget={handleMarkAsDefaultTarget}
                    handleEnableCsound7={handleEnableCsound7}
                    newTargets={newTargets}
                    {...props}
                />
            ))}
            <hr css={hrCss} />
            <TargetControlsConfigDialogFooter
                handleCloseModal={handleCloseModal}
                handleCreateNewTarget={handleCreateNewTarget}
                handleSave={handleSave}
                hasModifiedTargets={hasModifiedTargets}
            />
        </div>
    );
};
