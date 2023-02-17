import React, { useCallback } from "react";
import Button from "@mui/material/Button";
import { useDispatch } from "@root/store";
import { closeModal } from "@comp/modal/actions";
import { resetDocumentValue } from "@comp/projects/actions";
import { TAB_CLOSE } from "./types";

export function CloseUnsavedFilePrompt({
    projectUid,
    documentUid
}: {
    projectUid: string;
    documentUid: string;
}) {
    const dispatch = useDispatch();
    const cancelCallback = useCallback(
        () => dispatch(closeModal()),
        [dispatch]
    );
    const closeWithoutSavingCallback = useCallback(() => {
        dispatch(closeModal());
        dispatch({
            type: TAB_CLOSE,
            documentUid
        });
        dispatch(resetDocumentValue(projectUid, documentUid));
    }, [dispatch, documentUid, projectUid]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <Button
                variant="outlined"
                color="primary"
                onClick={() => cancelCallback()}
                style={{ marginTop: 12 }}
            >
                Cancel
            </Button>
            <Button
                variant="outlined"
                color="primary"
                onClick={() => closeWithoutSavingCallback()}
                style={{ marginTop: 12 }}
            >
                Close without saveing
            </Button>
        </div>
    );
}
