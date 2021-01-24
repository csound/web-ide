import firebase from "firebase/app";
import "firebase/firestore";
import { updateProjectLastModified } from "@comp/project-last-modified/actions";
import { openSimpleModal } from "@comp/modal/actions";
import { openSnackbar } from "@comp/snackbar/actions";
import { SnackbarType } from "@comp/snackbar/types";
import { database, targets as targetsCollReference } from "@config/firestore";
import TargetsConfigDialog from "./targets-config-dialog";
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
        dispatch(openSimpleModal(TargetsConfigDialog));
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
        const projTargetsReference = await targetsCollReference
            .doc(projectUid)
            .get();
        if (projTargetsReference.exists) {
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
        const targetsReference = targetsCollReference.doc(projectUid);
        try {
            const batch = database.batch();

            batch.set(
                targetsReference,
                {
                    targets: firebase.firestore.FieldValue.delete()
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
        } catch (error) {
            dispatch(openSnackbar(error.toString(), SnackbarType.Error));
        }
    };
};
