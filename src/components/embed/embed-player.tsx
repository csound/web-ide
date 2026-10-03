import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
import Stop from "@mui/icons-material/Stop";
import Skeleton from "@mui/material/Skeleton";
import ProjectAvatar from "@root/elements/project-avatar";
import {
    documentPath,
    outputNameFromCsd,
    pauseCsound,
    resumePausedCsound,
    runPerformance,
    stopPerformance
} from "@comp/csound/actions";
import { nonCloudFiles, cleanupNonCloudFiles } from "@comp/file-tree/actions";
import { IProject } from "@comp/projects/types";
import { useDispatch, useSelector } from "@root/store";
import { isPlayable, loadEmbedProject } from "./load-project";
import * as styles from "./styles";

type AudioFile = { name: string; url: string };

export const EmbedPlayer = ({ projectUid }: { projectUid: string }) => {
    const dispatch = useDispatch();
    const status = useSelector((state) => state.csound.status);
    const [project, setProject] = useState<IProject>();
    const [documentUid, setDocumentUid] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lines, setLines] = useState<string[]>([]);
    const [files, setFiles] = useState<AudioFile[]>([]);
    const lifecycle = useRef<AbortController>();
    const audioUrls = useRef<string[]>([]);
    const clearAudio = () => {
        audioUrls.current.forEach((url) => URL.revokeObjectURL(url));
        audioUrls.current = [];
        setFiles([]);
    };

    useEffect(() => {
        const controller = new AbortController();
        lifecycle.current = controller;
        const load = async () => {
            try {
                if (!projectUid) throw new Error("No project was specified.");
                const loaded = await loadEmbedProject(projectUid);
                if (controller.signal.aborted) return;
                dispatch({
                    type: "PROJECTS.STORE_PROJECT_LOCALLY",
                    projects: [loaded.project]
                });
                dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid });
                setProject(loaded.project);
                setDocumentUid(loaded.documentUid);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(
                        error instanceof Error &&
                            error.message ===
                                "This project is private or no longer exists."
                            ? error.message
                            : "Could not load this project. It may be private, missing, or offline."
                    );
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        void load();
        const stopOnPageHide = () => {
            void stopPerformance().catch(console.error);
        };
        window.addEventListener("pagehide", stopOnPageHide);
        return () => {
            controller.abort();
            window.removeEventListener("pagehide", stopOnPageHide);
            audioUrls.current.forEach((url) => URL.revokeObjectURL(url));
            audioUrls.current = [];
            dispatch({ type: "PROJECTS.CLOSE_PROJECT" });
            dispatch({ type: "PROJECTS.UNSET_PROJECT", projectUid });
            dispatch({ ...cleanupNonCloudFiles({ projectUid }) });
        };
    }, [dispatch, projectUid]);

    const selected = documentUid && project?.documents[documentUid];
    const busy = ["loading", "playing", "paused", "rendering"].includes(status);
    const fileOutput = selected && outputNameFromCsd(selected.currentValue);
    const run = async (mode: "auto" | "render") => {
        if (!project || !selected || !lifecycle.current) return;
        const signal = lifecycle.current.signal;
        clearAudio();
        dispatch({ ...cleanupNonCloudFiles({ projectUid }) });
        setError("");
        try {
            const result = await runPerformance({
                projectUid,
                csdPath: /\.csd$/i.test(selected.filename)
                    ? documentPath(selected, project.documents)
                    : undefined,
                orc: selected.currentValue,
                mode,
                useSAB: false,
                signal,
                setConsole: (update) => {
                    if (!signal.aborted) {
                        setLines((previous) =>
                            (typeof update === "function"
                                ? update(previous)
                                : update
                            ).slice(-200)
                        );
                    }
                }
            });
            if (signal.aborted) return;
            setFiles(
                result.files.flatMap((name) => {
                    const file = nonCloudFiles.get(name);
                    if (!file) return [];
                    const url = URL.createObjectURL(
                        new Blob([new Uint8Array(file.buffer)])
                    );
                    audioUrls.current.push(url);
                    return [{ name, url }];
                })
            );
        } catch (error) {
            if (
                !signal.aborted &&
                !(error instanceof Error && error.name === "AbortError")
            ) {
                setError(
                    error instanceof Error ? error.message : "Playback failed."
                );
            }
        }
    };

    const stop = async () => {
        try {
            await stopPerformance();
        } catch {
            setError(
                "Could not stop playback. Reload the player to try again."
            );
        }
    };

    return (
        <main css={styles.player} aria-label="Csound project player">
            <header>
                <span className="brand">
                    <img
                        src="/favicon-32x32.png"
                        width="20"
                        height="20"
                        alt=""
                    />
                    Csound
                </span>
                {projectUid && (
                    <a
                        href={`/editor/${encodeURIComponent(projectUid)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open in IDE
                    </a>
                )}
            </header>
            {loading ? (
                <div role="status">
                    <Skeleton
                        variant="rounded"
                        width="75%"
                        height={28}
                        animation={false}
                        sx={{ mt: 3 }}
                    />
                    <Skeleton
                        variant="rounded"
                        width="100%"
                        height={40}
                        animation={false}
                        sx={{ my: 2 }}
                    />
                    <p>Loading project…</p>
                </div>
            ) : (
                <>
                    {project && (
                        <>
                            <div className="project-heading">
                                <div className="artwork" aria-hidden="true">
                                    <ProjectAvatar
                                        iconName={project.iconName}
                                        iconBackgroundColor={
                                            project.iconBackgroundColor
                                        }
                                        iconForegroundColor={
                                            project.iconForegroundColor
                                        }
                                    />
                                </div>
                                <h1>{project.name || "Untitled project"}</h1>
                            </div>
                            {project.description && (
                                <p className="description">
                                    {project.description}
                                </p>
                            )}
                            {selected ? (
                                <>
                                    <label>
                                        File
                                        <select
                                            value={documentUid}
                                            disabled={busy}
                                            onChange={(event) => {
                                                setDocumentUid(
                                                    event.target.value
                                                );
                                                clearAudio();
                                                setError("");
                                            }}
                                        >
                                            {Object.values(project.documents)
                                                .filter(isPlayable)
                                                .map((document) => (
                                                    <option
                                                        key={
                                                            document.documentUid
                                                        }
                                                        value={
                                                            document.documentUid
                                                        }
                                                    >
                                                        {documentPath(
                                                            document,
                                                            project.documents
                                                        )}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                    <nav aria-label="Playback controls">
                                        <Button
                                            variant="contained"
                                            disabled={
                                                status === "loading" ||
                                                status === "rendering"
                                            }
                                            startIcon={
                                                status === "playing" ? (
                                                    <Pause />
                                                ) : (
                                                    <PlayArrow />
                                                )
                                            }
                                            onClick={() => {
                                                if (status === "playing")
                                                    dispatch(pauseCsound());
                                                else if (status === "paused")
                                                    dispatch(
                                                        resumePausedCsound()
                                                    );
                                                else void run("auto");
                                            }}
                                        >
                                            {status === "playing"
                                                ? "Pause"
                                                : status === "paused"
                                                  ? "Resume"
                                                  : fileOutput
                                                    ? "Render audio"
                                                    : "Play"}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            disabled={!busy}
                                            startIcon={<Stop />}
                                            onClick={() => void stop()}
                                        >
                                            Stop
                                        </Button>
                                        {!fileOutput && (
                                            <Button
                                                disabled={busy}
                                                onClick={() =>
                                                    void run("render")
                                                }
                                            >
                                                Render audio
                                            </Button>
                                        )}
                                    </nav>
                                    <p role="status">
                                        {status === "loading"
                                            ? "Preparing audio…"
                                            : status === "rendering"
                                              ? "Rendering audio…"
                                              : status === "playing"
                                                ? "Playing"
                                                : status === "paused"
                                                  ? "Paused"
                                                  : status === "error"
                                                    ? "Playback failed. Check the console below."
                                                    : "Ready"}
                                    </p>
                                </>
                            ) : (
                                <p>
                                    This project has no CSD or ORC files to
                                    play.
                                </p>
                            )}
                        </>
                    )}
                    {error && <p role="alert">{error}</p>}
                    {!project && error && (
                        <Button onClick={() => window.location.reload()}>
                            Reload player
                        </Button>
                    )}
                    {files.map((file) => (
                        <div key={file.url}>
                            <audio
                                controls
                                src={file.url}
                                aria-label={`Rendered audio: ${file.name}`}
                            />
                            <a href={file.url} download={file.name}>
                                Download {file.name}
                            </a>
                        </div>
                    ))}
                    {lines.length > 0 && (
                        <details>
                            <summary>Csound console</summary>
                            <pre>{lines.join("")}</pre>
                        </details>
                    )}
                </>
            )}
        </main>
    );
};
