import type { AppThunk, RootState } from "@root/store";
import { selectCurrentTab } from "@comp/project-editor/selectors";
import { openSimpleModal } from "@comp/modal/actions";

export interface SaveAsSource {
    projectUid: string;
    filename: string;
    value: string;
    path: string[];
}

export function selectSaveAsSource(state: RootState): SaveAsSource | undefined {
    const tab = selectCurrentTab(state);
    const projectUid = state.ProjectsReducer.activeProjectUid;
    if (!tab || !projectUid) return;
    const temporary = tab.temporary;
    if (temporary)
        return {
            projectUid,
            filename: temporary.filename,
            value: temporary.value,
            path: []
        };
    const file = state.ProjectsReducer.projects[projectUid]?.documents[tab.uid];
    if (file?.type === "txt")
        return {
            projectUid,
            filename: file.filename,
            value: file.currentValue,
            path: file.path || []
        };
}

export const openSaveAs = (): AppThunk => (dispatch, getState) => {
    const state = getState();
    const source = selectSaveAsSource(state);
    if (source && state.LoginReducer.loggedInUid)
        dispatch(openSimpleModal("save-as", { source }));
};
