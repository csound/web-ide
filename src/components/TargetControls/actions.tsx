import * as firebase from "firebase/app";
import { openSimpleModal } from "@comp/Modal/actions";
import { openSnackbar } from "@comp/Snackbar/actions";
import { SnackbarType } from "@comp/Snackbar/types";
import { db, targets as targetsCollRef } from "@config/firestore";
import TargetsConfigDialog from "./TargetsConfigDialog";
import {
    ITargetMap,
    SET_SELECTED_TARGET,
    UPDATE_ALL_TARGETS_LOCALLY
} from "./types";

export const setSelectedTarget = (
    projectUid,
    selectedTarget: string | null
) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_SELECTED_TARGET,
            selectedTarget,
            projectUid
        });
    };
};

export const showTargetsConfigDialog = () => {
    return async (dispatch: any) => {
        dispatch(openSimpleModal(TargetsConfigDialog));
    };
};

// const updateTargetLocally = (dispatch, defaultTarget, projectUid, targets) => {
//     dispatch({
//         type: UPDATE_TARGET_LOCALLY,
//         defaultTarget,
//         projectUid,
//         targets
//     });
// };

export const updateAllTargetsLocally = (
    dispatch,
    defaultTarget,
    projectUid,
    targets
) => {
    dispatch({
        type: UPDATE_ALL_TARGETS_LOCALLY,
        defaultTarget,
        projectUid,
        targets
    });
};

export const saveChangesToTarget = (
    projectUid: string,
    targets: ITargetMap,
    defaultTarget: string | null,
    onSuccessCallback: () => void
) => {
    return async (dispatch: any) => {
        const targetsRef = targetsCollRef.doc(projectUid);
        try {
            const batch = db.batch();

            batch.set(
                targetsRef,
                {
                    targets: firebase.firestore.FieldValue.delete()
                },
                { merge: true }
            );
            batch.set(targetsRef, { targets, defaultTarget }, { merge: true });
            await batch.commit();
            // await updateTargetsLocally(
            //     dispatch,
            //     defaultTarget,
            //     projectUid,
            //     targets
            // );
            onSuccessCallback && onSuccessCallback();
        } catch (error) {
            dispatch(openSnackbar(error.toString(), SnackbarType.Error));
        }
    };
};
