import * as firebase from "firebase/app";
import { ITargetMap } from "@comp/Projects/types";
import { openSimpleModal } from "@comp/Modal/actions";
import { openSnackbar } from "@comp/Snackbar/actions";
import { SnackbarType } from "@comp/Snackbar/types";
import { db, projects } from "@config/firestore";
import TargetsConfigDialog from "./TargetsConfigDialog";
import { SET_SELECTED_TARGET, UPDATE_TARGETS_LOCALLY } from "./types";

export const setSelectedTarget = (selectedTarget: string | null) => {
    return async (dispatch: any) => {
        dispatch({
            type: SET_SELECTED_TARGET,
            selectedTarget
        });
        // setTimeout(() => showTargetsConfigDialog()(dispatch), 1000);
    };
};

export const showTargetsConfigDialog = () => {
    return async (dispatch: any) => {
        dispatch(openSimpleModal(TargetsConfigDialog));
    };
};

const updateTargetsLocally = (dispatch, defaultTarget, projectUid, targets) => {
    dispatch({
        type: UPDATE_TARGETS_LOCALLY,
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
        const projectRef = projects.doc(projectUid);
        try {
            const batch = db.batch();

            batch.set(
                projectRef,
                {
                    targets: firebase.firestore.FieldValue.delete()
                },
                { merge: true }
            );
            batch.set(projectRef, { targets, defaultTarget }, { merge: true });
            await batch.commit();
            await updateTargetsLocally(
                dispatch,
                defaultTarget,
                projectUid,
                targets
            );
            onSuccessCallback && onSuccessCallback();
        } catch (error) {
            dispatch(openSnackbar(error.toString(), SnackbarType.Error));
        }
    };
};
