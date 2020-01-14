import { ITargetMap } from "@comp/Projects/types";
import { openSimpleModal } from "../Modal/actions";
import { projects } from "@config/firestore";
import TargetsConfigDialog from "./TargetsConfigDialog";
import { SET_SELECTED_TARGET, UPDATE_TARGETS_LOCALLY } from "./types";

export const setSelectedTarget = (selectedTarget: string) => {
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
    defaultTarget: string | null
) => {
    return async (dispatch: any) => {
        const projectRef = projects.doc(projectUid);
        await projectRef.set(
            {
                defaultTarget,
                targets
            },
            { merge: true }
        );
        updateTargetsLocally(dispatch, defaultTarget, projectUid, targets);
    };
};
