import { always } from "ramda";
import { deleteField, doc, getDoc, writeBatch } from "firebase/firestore";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import { openSimpleModal } from "@comp/modal/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { database, targets as targetsCollReference } from "@config/firestore";
import { TargetControlsConfigDialog } from "./config-dialog";
import {
    ITargetMap,
    SET_SELECTED_TARGET,
    UPDATE_ALL_TARGETS_LOCALLY
} from "./types";

export const setSelectedTarget = (
    projectUid: string,
    selectedTarget: string | null
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_SELECTED_TARGET,
            selectedTarget,
            projectUid
        });
    };
};

export const showTargetsConfigDialog = (): ((
    dispatch: any
) => Promise<void>) => {
    return async (dispatch: any) => {
        dispatch(
            openSimpleModal(TargetControlsConfigDialog, { onClose: always })
        );
    };
};

export const updateAllTargetsLocally = (
    dispatch: (any) => void,
    defaultTarget: string,
    projectUid: string,
    targets: ITargetMap
): void =>
    dispatch({
        type: UPDATE_ALL_TARGETS_LOCALLY,
        defaultTarget,
        projectUid,
        targets
    });

export const downloadTargetsOnce = (
    projectUid: string
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        const projTargetsReference = await getDoc(
            doc(targetsCollReference, projectUid)
        );
        if (projTargetsReference.exists()) {
            const data = projTargetsReference.data();
            data &&
                (await updateAllTargetsLocally(
                    dispatch,
                    data.defaultTarget,
                    projectUid,
                    data.targets
                ));
        }
    };
};

export const saveChangesToTarget = (
    projectUid: string,
    targets: ITargetMap,
    defaultTarget: string | null,
    onSuccessCallback: () => void
): ((dispatch: any) => Promise<void>) => {
    return async (dispatch: any) => {
        const targetsReference = doc(targetsCollReference, projectUid);
        const batch = writeBatch(database);

        try {
            batch.set(
                targetsReference,
                {
                    targets: deleteField()
                },
                { merge: true }
            );
            batch.set(
                targetsReference,
                { targets, defaultTarget },
                { merge: true }
            );
            await batch.commit();
            updateProjectLastModified(projectUid);
            onSuccessCallback && onSuccessCallback();
        } catch (error: any) {
            dispatch(openSnackbar(error.toString(), SnackbarType.Error));
        }
    };
};
