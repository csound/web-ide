import { AppThunk } from "@root/store";
import { selectLoggedInUid } from "@comp/login/selectors";
import { openLoginDialog, setPostAuthFlow } from "@comp/login/actions";
import { openSimpleModal } from "@comp/modal/actions";

export const openForkProject =
    (projectUid: string): AppThunk =>
    (dispatch, getState) => {
        const state = getState();
        if (!selectLoggedInUid(state)) {
            dispatch(setPostAuthFlow({ forkProjectUid: projectUid }));
            dispatch(openLoginDialog());
            return;
        }
        const project = state.ProjectsReducer.projects[projectUid];
        if (!project) return;
        dispatch(
            openSimpleModal("new-project-prompt", {
                name: `${project.name} (fork)`.slice(0, 200),
                description: project.description,
                label: "Create fork",
                newProject: false,
                projectID: "",
                forkSourceUid: projectUid,
                forkSourceName: project.name,
                iconName: project.iconName,
                iconForegroundColor: project.iconForegroundColor,
                iconBackgroundColor: project.iconBackgroundColor,
                tags: project.tags
            })
        );
    };
