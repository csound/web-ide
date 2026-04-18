import { useEffect, useRef, useState } from "react";
import { Audio as AudioSpinner } from "react-loader-spinner";
import { useParams, useNavigate } from "react-router";
import { Theme, useTheme } from "@emotion/react";
// import { IStore } from "@store/types";
import { useSelector, useDispatch } from "react-redux";
import ProjectEditor from "@comp/project-editor/project-editor";
import { IProject } from "@comp/projects/types";
import { cleanupNonCloudFiles } from "@comp/file-tree/actions";
import { Header } from "@comp/header/header";
import {
    activateProject,
    addProjectDocuments,
    downloadProjectOnce,
    closeProject,
    storeProjectLocally
} from "./actions";
import { isEmpty, pathOr } from "ramda";
import { RootState } from "@root/store";
import * as SS from "./styles";
import { e2eMockProject } from "./e2e-mock";

const isE2E = import.meta.env.VITE_E2E === "true";

const ForceBackgroundColor = ({ theme }: { theme: Theme }) => (
    <style>{`body {background-color: ${theme.background}}`}</style>
);

export const ProjectContext = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const routeParams: { id?: string } = useParams();

    const [projectFetchStarted, setProjectFetchStarted] = useState(false);
    const [projectIsReady, setProjectIsReady] = useState(false);
    const [needsLoading, setNeedsLoading] = useState(true);
    // Ref guard: prevents StrictMode double-invocation from running
    // the download effect twice (which would closeTabDock after
    // tabDockInit, leaving the editor tab dock empty).
    const fetchStartedRef = useRef(false);
    const projectUid = routeParams.id ?? "";
    const invalidUrl = !projectUid || isEmpty(projectUid);
    // this is true when /editor path is missing projectUid
    if (invalidUrl) {
        navigate("/404", {
            state: { message: "Project not found" }
        });
    }

    const activeProjectUid: string | undefined = useSelector(
        (store: RootState) =>
            !invalidUrl ? store?.ProjectsReducer?.activeProjectUid : undefined
    );

    const project: IProject | undefined = useSelector((store: RootState) =>
        activeProjectUid && !invalidUrl
            ? store?.ProjectsReducer?.projects?.[activeProjectUid]
            : undefined
    );

    const tabIndex: number = useSelector(
        pathOr(-1, ["ProjectEditorReducer", "tabDock", "tabIndex"])
    );

    // Effect 1: Reset states when projectUid changes
    useEffect(() => {
        setProjectFetchStarted(false);
        setProjectIsReady(false);
        setNeedsLoading(true);
        fetchStartedRef.current = false;
    }, [projectUid]);

    // Effect 2: Handle project download initiation
    useEffect(() => {
        if (!projectFetchStarted && projectUid && !fetchStartedRef.current) {
            fetchStartedRef.current = true;
            setProjectFetchStarted(true);

            const downloadProject = async () => {
                if (isE2E) {
                    // Bypass Firestore: inject the mock project directly
                    const mock = {
                        ...e2eMockProject,
                        projectUid
                    };
                    dispatch(storeProjectLocally([mock]));
                    // activateProject must run before addProjectDocuments
                    // because it calls closeTabDock(), which would wipe
                    // the tab dock that addProjectDocuments initializes.
                    await activateProject(projectUid)(dispatch);
                    dispatch(
                        addProjectDocuments(projectUid, mock.documents) as any
                    );
                    setProjectIsReady(true);
                    return;
                }

                try {
                    const result =
                        await downloadProjectOnce(projectUid)(dispatch);
                    if (!result.exists) {
                        setProjectIsReady(true);
                        navigate("/404", {
                            state: { message: "Project not found" }
                        });
                        return;
                    }
                } catch (error: any) {
                    console.error(
                        `[ProjectContext] Error during project download:`,
                        error
                    );
                    setProjectIsReady(true);
                    navigate("/404", {
                        state: { message: "Project not found" }
                    });
                    return;
                }

                // Cleanup and activate project
                dispatch(
                    cleanupNonCloudFiles({
                        projectUid
                    }) as any
                );
                await activateProject(projectUid)(dispatch);
                setProjectIsReady(true);
            };

            downloadProject();
        }
    }, [projectUid]); // Only depend on projectUid, not on projectFetchStarted or dispatch

    // Effect 3: Handle loading state management
    useEffect(() => {
        if (needsLoading && projectFetchStarted && projectIsReady) {
            setNeedsLoading(false);
        }
    }, [needsLoading, projectFetchStarted, projectIsReady]);

    // Effect 4: Cleanup when component unmounts (user navigates away from project editor)
    useEffect(() => {
        return () => {
            // Clean up tab dock when leaving project editor entirely
            dispatch(closeProject() as any);
        };
    }, [dispatch]);

    return (
        <>
            <ForceBackgroundColor theme={theme} />
            {project && <ProjectEditor activeProject={project} />}
            <Header />
            {needsLoading && (
                <main css={SS.loadMain}>
                    <AudioSpinner
                        color={theme.highlightBackground}
                        height={80}
                        width={80}
                    />
                </main>
            )}
        </>
    );
};
