import React from "react";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import SaveIcon from "@material-ui/icons/Save";
import * as SS from "./styles";

interface TargetControlsConfigDialogFooterProps {
    handleCreateNewTarget: () => void;
    handleCloseModal: () => void;
    handleSave: () => void;
    hasModifiedTargets: boolean;
}

export const TargetControlsConfigDialogFooter = ({
    handleCreateNewTarget,
    handleCloseModal,
    handleSave,
    hasModifiedTargets
}: TargetControlsConfigDialogFooterProps) => {
    return (
        <div css={SS.targetsDialogFooter}>
            <Fab
                color="primary"
                variant="extended"
                aria-label="Add"
                size="small"
                onClick={() => {
                    handleCreateNewTarget();
                }}
            >
                Add Target
                <AddIcon />
            </Fab>
            <Fab
                color="primary"
                variant="extended"
                aria-label="Save"
                size="small"
                disabled={!hasModifiedTargets}
                onClick={() => handleSave()}
                style={{ marginLeft: 12 }}
            >
                Save changes
                <SaveIcon />
            </Fab>
            <Fab
                color="primary"
                variant="extended"
                aria-label="Close"
                size="small"
                style={{ marginLeft: 12 }}
                onClick={() => handleCloseModal()}
            >
                Close
            </Fab>
        </div>
    );
};
