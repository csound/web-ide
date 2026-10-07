import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store, useSelector } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import { ConsoleProvider } from "../../src/components/console/context";
import ProjectEditor from "../../src/components/project-editor/project-editor";
import { TargetControls } from "../../src/components/target-controls";
import { ListPlayButton } from "../../src/components/profile/list-play-button";
import {
    activateProject,
    closeProject
} from "../../src/components/projects/actions";
import { tabDockInit } from "../../src/components/project-editor/actions";
import {
    runPerformance,
    isCsoundBusy,
    getLiveCsound,
    stopCsound
} from "../../src/components/csound/actions";
import type { IProject } from "../../src/components/projects/types";

const source = `<CsoundSynthesizer>
<CsOptions>
-odac
</CsOptions>
<CsInstruments>
sr = 48000
ksmps = 64
nchnls = 2
0dbfs = 1
instr 1
a1 oscili 0.001, 220
outs a1, a1
endin
</CsInstruments>
<CsScore>
i1 0 3600
</CsScore>
</CsoundSynthesizer>`;
const projects: IProject[] = ["First", "Second"].map((name) => ({
    projectUid: name,
    name,
    userUid: "fixture-author",
    isPublic: true,
    description: "",
    tags: [],
    stars: {},
    cachedProjectLastModified: 1,
    documents: {
        csd: {
            documentUid: "csd",
            filename: "project.csd",
            path: [],
            type: "txt",
            currentValue: source,
            savedValue: source,
            isModifiedLocally: false,
            userUid: "fixture-author",
            created: undefined,
            lastModified: undefined
        }
    }
}));
store.dispatch({ type: "PROJECTS.STORE_PROJECT_LOCALLY", projects });
for (const project of projects)
    store.dispatch({
        type: "PROJECT_LAST_MODIFIED.UPDATE_PROJECT_LAST_MODIFIED_LOCALLY",
        projectUid: project.projectUid,
        timestamp: 1
    });
(window as any).playbackFixture = {
    busy: isCsoundBusy,
    live: (projectUid: string) => !!getLiveCsound(projectUid)
};

function ProfilePlayback({ children }: { children: ReactNode }) {
    // Match Profile's page cleanup; filtering cards must not stop playback.
    useEffect(
        () => () => {
            void store.dispatch(stopCsound());
        },
        []
    );
    return <>{children}</>;
}

function Fixture() {
    const [editor, setEditor] = useState(false);
    const [hideFirst, setHideFirst] = useState(false);
    const status = useSelector((state) => state.csound.status);
    return (
        <div
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
            <output aria-label="Engine status">{status}</output>
            {editor ? (
                <>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flexShrink: 0
                        }}
                    >
                        <button
                            onClick={() => {
                                setEditor(false);
                                void store.dispatch(closeProject());
                            }}
                        >
                            Leave editor
                        </button>
                        <button
                            onClick={() =>
                                void runPerformance({
                                    projectUid: "First",
                                    csdText: source,
                                    mode: "play",
                                    setConsole: () => {}
                                })
                            }
                        >
                            Play direct engine
                        </button>
                        <TargetControls activeProjectUid="First" />
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ProjectEditor activeProject={projects[0]} />
                    </div>
                </>
            ) : (
                <ProfilePlayback>
                    <button onClick={() => setHideFirst(!hideFirst)}>
                        {hideFirst ? "Show First" : "Hide First"}
                    </button>
                    {projects
                        .filter(
                            (project) =>
                                !hideFirst || project.projectUid !== "First"
                        )
                        .map((project) => (
                            <ListPlayButton
                                key={project.projectUid}
                                projectUid={project.projectUid}
                                projectName={project.name}
                            />
                        ))}
                    <button
                        onClick={async () => {
                            await store.dispatch(activateProject("First"));
                            await store.dispatch(
                                tabDockInit(
                                    "First",
                                    Object.values(projects[0].documents),
                                    undefined
                                )
                            );
                            setEditor(true);
                        }}
                    >
                        Open First editor
                    </button>
                </ProfilePlayback>
            )}
        </div>
    );
}
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <ConsoleProvider>
                    <Fixture />
                </ConsoleProvider>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
