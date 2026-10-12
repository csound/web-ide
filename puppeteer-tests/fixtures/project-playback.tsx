import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router";
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
import Home from "../../src/components/home/home";

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
    status: () => store.getState().csound.status,
    live: (projectUid: string) => !!getLiveCsound(projectUid),
    loadTargetsOnNextRun: () => {
        const unsubscribe = store.subscribe(() => {
            if (store.getState().csound.status !== "loading") return;
            unsubscribe();
            // Replay the saved target arriving after the files and Run click.
            queueMicrotask(() =>
                store.dispatch({
                    type: "TARGET_CONTROL.UPDATE_ALL_TARGETS_LOCALLY",
                    projectUid: "First",
                    defaultTarget: "Main",
                    targets: {
                        Main: {
                            targetName: "Main",
                            targetType: "main",
                            targetDocumentUid: "csd",
                            csoundOptions: {}
                        }
                    }
                })
            );
        });
    }
};

const popular = new URLSearchParams(window.location.search).has("popular");
if (popular) {
    store.dispatch({
        type: "HOME.ADD_POPULAR_PROJECTS",
        payload: projects.map((project, index) => ({
            ...project,
            public: true,
            starCount: 12 - index,
            iconBackgroundColor: index ? "#233847" : "#40334c",
            iconForegroundColor: "#fff"
        }))
    });
    store.dispatch({
        type: "HOME.ADD_USER_PROFILES",
        payload: {
            "fixture-author": {
                username: "listener",
                displayName: "A Csound artist"
            }
        }
    });
    for (const type of [
        "HOME.SET_POPULAR_PROJECTS_LOADING",
        "HOME.SET_POPULAR_ARTISTS_LOADING",
        "HOME.SET_RANDOM_PROJECTS_LOADING"
    ])
        store.dispatch({ type, isLoading: false });
}

function Destination() {
    const { pathname } = useLocation();
    return (
        <>
            <output aria-label="Destination">{pathname}</output>
            <Link to="/">Home</Link>
        </>
    );
}

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
                    {popular ? (
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="*" element={<Destination />} />
                        </Routes>
                    ) : (
                        <Fixture />
                    )}
                </ConsoleProvider>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
