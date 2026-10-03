import { useCallback, useState, useSyncExternalStore } from "react";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Stop from "@mui/icons-material/Stop";
import AutoStoriesRounded from "@mui/icons-material/AutoStoriesRounded";
import { useDispatch, useSelector } from "@root/store";
import { useSetConsole } from "../console/context";
import CodeEditor from "../editor/editor";
import { tabClose } from "./actions";
import type { IOpenDocument } from "./types";
import { updateTemporaryDocument } from "./temporary-documents";
import {
    playTemporaryDocument,
    stopTemporaryDocument,
    subscribeTemporaryPlayback,
    temporaryPlaybackUid
} from "./temporary-playback";
import * as styles from "./temporary-styles";

export function TemporaryEditor({
    tab,
    projectUid
}: {
    tab: IOpenDocument;
    projectUid: string;
}) {
    const dispatch = useDispatch();
    const setConsole = useSetConsole();
    const status = useSelector((state) => state.csound.status);
    const playingUid = useSyncExternalStore(
        subscribeTemporaryPlayback,
        temporaryPlaybackUid
    );
    const [error, setError] = useState("");
    const onChange = useCallback(
        (value: string) => {
            dispatch(updateTemporaryDocument(tab.uid, value));
        },
        [dispatch, tab.uid]
    );
    const document = tab.temporary!;
    const manual = document.source?.kind === "manual-example";
    const playing = playingUid === tab.uid;
    const busy =
        !!playingUid ||
        ["loading", "playing", "paused", "rendering"].includes(status);

    return (
        <section
            css={styles.editor}
            aria-label={`${document.filename}, temporary file`}
        >
            <header css={styles.toolbar}>
                <div css={styles.description}>
                    {manual && <AutoStoriesRounded aria-hidden="true" />}
                    <div>
                        <strong>{document.filename}</strong>
                        <span>
                            {manual
                                ? "Temporary manual example"
                                : "Temporary file"}{" "}
                            · Not saved to project
                        </span>
                    </div>
                </div>
                <div css={styles.actions}>
                    {manual && (
                        <button
                            type="button"
                            css={styles.playButton}
                            disabled={!playing && busy}
                            onClick={async () => {
                                if (playing) {
                                    stopTemporaryDocument(tab.uid);
                                    return;
                                }
                                setError("");
                                try {
                                    await playTemporaryDocument(
                                        projectUid,
                                        tab.uid,
                                        document,
                                        setConsole
                                    );
                                } catch (error) {
                                    setError(
                                        error instanceof Error
                                            ? error.message
                                            : "Could not play the example."
                                    );
                                }
                            }}
                        >
                            {playing ? <Stop /> : <PlayArrow />}
                            {playing
                                ? "Stop manual example"
                                : "Play manual example"}
                        </button>
                    )}
                    <button
                        type="button"
                        css={styles.discardButton}
                        onClick={() =>
                            dispatch(tabClose(projectUid, tab.uid, false))
                        }
                    >
                        Discard
                    </button>
                </div>
            </header>
            {error && (
                <p role="alert" css={styles.error}>
                    {error}
                </p>
            )}
            <div css={{ flex: "1 1 auto", minHeight: 0 }}>
                <CodeEditor
                    documentUid={tab.uid}
                    projectUid={projectUid}
                    buffer={document}
                    onBufferChange={onChange}
                />
            </div>
        </section>
    );
}
