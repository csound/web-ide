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
import { activateProject, downloadProjectOnce, closeProject } from "./actions";
import { isEmpty } from "ramda";
import { RootState } from "@root/store";
import * as SS from "./styles";

const ForceBackgroundColor = ({ theme }: { theme: Theme }) => (
    <style>{`body {background-color: ${theme.background}}`}</style>
);

export const ProjectContext = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const routeParams: { id?: string } = useParams();

    const [readyProjectUid, setReadyProjectUid] = useState<string>();
    // Reuse the fetch through StrictMode's effect replay, but cancel each consumer.
    const download = useRef<{
        projectUid: string;
        promise: ReturnType<ReturnType<typeof downloadProjectOnce>>;
    }>();
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
        activeProjectUid === projectUid && !invalidUrl
            ? store?.ProjectsReducer?.projects?.[activeProjectUid]
            : undefined
    );

    useEffect(() => {
        if (!projectUid) return;
        let cancelled = false;
        if (download.current?.projectUid !== projectUid) {
            download.current = {
                projectUid,
                promise: downloadProjectOnce(projectUid)(dispatch)
            };
        }
        const pending = download.current.promise;
        const openProject = async () => {
            try {
                const result = await pending;
                if (cancelled) return;
                if (!result.exists) throw new Error("Project not found");
                dispatch(cleanupNonCloudFiles({ projectUid }) as any);
                await activateProject(projectUid)(dispatch);
                if (!cancelled) setReadyProjectUid(projectUid);
            } catch (error) {
                if (cancelled) return;
                console.error(
                    "[ProjectContext] Error during project download:",
                    error
                );
                navigate("/404", { state: { message: "Project not found" } });
            }
        };
        void openProject();
        return () => {
            cancelled = true;
        };
    }, [projectUid, dispatch, navigate]);

    // Close the tab dock when leaving the editor route.
    useEffect(() => {
        return () => {
            // Clean up tab dock when leaving project editor entirely
            dispatch(closeProject() as any);
        };
    }, [dispatch]);

    return (
        <>
            <ForceBackgroundColor theme={theme} />
            <Header />
            <main css={SS.main}>
                {project && <ProjectEditor activeProject={project} />}
            </main>
            {readyProjectUid !== projectUid && (
                <div
                    css={SS.loadMain}
                    aria-live="polite"
                    aria-label="Loading project"
                >
                    <AudioSpinner
                        color={theme.highlightBackground}
                        height={80}
                        width={80}
                    />
                </div>
            )}
        </>
    );
};
