import { useEffect, useRef, useState } from "react";
import { css, type Theme } from "@emotion/react";
import {
    Alert,
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    InputAdornment,
    LinearProgress,
    Link,
    TextField
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useDispatch, useSelector } from "@root/store";
import { closeModal } from "@comp/modal/actions";
import { nonCloudFiles } from "@comp/file-tree/actions";
import { outputNameFromCsd } from "./actions";
import { FieldLabel } from "./render-field";
import { RenderMacros } from "./render-macros";
import { renderJob } from "./render-job";
import {
    selectPlaybackMode,
    selectPlaybackDocuments
} from "@comp/target-controls/selectors";
import {
    RenderSettings,
    renderFilename,
    projectSettingHint,
    validateRenderSettings
} from "./render-settings";
import { prepareCompletionBell } from "./completion-bell";

export type RenderDialogProps = {
    projectUid: string;
    documentUid: string;
    setConsole: React.Dispatch<React.SetStateAction<string[]>>;
    onSubmittingChange?: (busy: boolean) => void;
};

const layout = (theme: Theme) => css`
    width: 580px;
    && {
        max-height: calc(100dvh - 32px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    form {
        display: flex;
        flex-direction: column;
        min-height: 0;
    }
    .form-body {
        overflow-y: auto;
        min-height: 0;
        padding: 0 8px 0 2px;
        margin-right: -8px;
        scrollbar-width: thin;
    }
    header,
    footer {
        flex-shrink: 0;
    }
    max-width: calc(100vw - 32px);
    h2 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.4px;
    }
    p {
        color: ${theme.altTextColor};
        font-size: 13px;
        line-height: 1.6;
    }
    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 18px;
    }
    .sample-rate-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
    }
    .sample-rate-presets button {
        min-width: 0;
        padding: 3px 6px;
        font-size: 11px;
        text-transform: none;
    }
    .fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px 16px;
    }
    .full {
        grid-column: 1 / -1;
    }
    .field-label {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 7px;
        font-size: 13px;
        font-weight: 600;
    }
    .field-label button {
        padding: 3px;
        color: ${theme.altTextColor};
    }
    .field-label svg {
        font-size: 16px;
    }
    .field-label label {
        cursor: pointer;
    }
    input::placeholder {
        color: ${theme.altTextColor};
        opacity: 1;
    }
    .track-section {
        margin-bottom: 22px;
    }
    .track-list {
        display: flex;
        flex-direction: column;
        max-height: 150px;
        overflow: auto;
        margin-bottom: 12px;
    }
    .track-list .MuiFormControlLabel-label {
        font-size: 13px;
        overflow-wrap: anywhere;
    }
    .timing-option {
        display: flex;
        align-items: center;
        margin-left: -11px;
    }
    .timing-option .field-label {
        margin-bottom: 0;
        font-weight: 400;
    }
    .channel-fields {
        margin-top: 18px;
    }
    .channel-checkbox .MuiFormControlLabel-label {
        font-size: 13px;
    }
    .channel-checkbox {
        margin-top: 12px;
    }
    details {
        border-top: 1px solid ${theme.line};
        margin: 0 0 18px;
        padding-top: 14px;
    }
    summary {
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
    }
    .advanced-body {
        padding-top: 18px;
    }
    .settings {
        padding: 20px 0;
        margin-top: 22px;
        border-top: 1px solid ${theme.line};
    }
    .note {
        margin: 14px 0 0;
    }
    .bell {
        margin: 0 0 16px -9px;
    }
    .bell .MuiFormControlLabel-label {
        font-size: 13px;
    }
    footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding-top: 16px;
        border-top: 1px solid ${theme.line};
    }
    footer button {
        text-transform: none;
    }
    .status {
        padding: 28px 0;
    }
    .status h3 {
        font-size: 17px;
        font-weight: 600;
        margin: 12px 0 6px;
    }
    .status p {
        overflow-wrap: anywhere;
    }
    .status svg {
        color: ${theme.textColor};
    }
    @media (max-width: 440px) {
        .fields {
            grid-template-columns: 1fr;
            gap: 14px;
        }
    }
`;

export function RenderDialog({
    projectUid,
    documentUid,
    setConsole,
    onSubmittingChange
}: RenderDialogProps) {
    const dispatch = useDispatch();
    const project = useSelector(
        (state) => state.ProjectsReducer.projects[projectUid]
    );
    const document = project?.documents[documentUid];
    const playlistMode =
        useSelector((state) => selectPlaybackMode(state, projectUid)) ===
        "playlist";
    const playlist = useSelector((state) =>
        selectPlaybackDocuments(state, projectUid)
    );
    const tracks = playlistMode ? playlist : document ? [document] : [];
    const [selected, setSelected] = useState(
        () =>
            new Set(
                playlistMode
                    ? playlist.map((doc) => doc.documentUid)
                    : [documentUid]
            )
    );
    const [combine, setCombine] = useState(false);
    const [splitChannels, setSplitChannels] = useState(false);
    const [progress, setProgress] = useState("");
    const chosen = tracks.filter((doc) => selected.has(doc.documentUid));
    const [settings, setSettings] = useState<RenderSettings>(() => ({
        filename: (
            outputNameFromCsd(document?.currentValue ?? "")
                ?.split(/[/\\]/)
                .pop() ??
            document?.filename ??
            "render"
        ).replace(/\.[^.]+$/, ""),
        format: "wav",
        bitDepth: "24",
        quality: 0.6
    }));
    const [bell, setBell] = useState(false);
    const [phase, setPhase] = useState<"settings" | "rendering" | "completed">(
        "settings"
    );
    const [error, setError] = useState("");
    const [files, setFiles] = useState<string[]>([]);
    const [downloading, setDownloading] = useState(false);
    const run = useRef<AbortController>();
    const notification = useRef<ReturnType<typeof prepareCompletionBell>>();
    const busy = phase === "rendering";
    useEffect(() => {
        onSubmittingChange?.(busy);
        return () => onSubmittingChange?.(false);
    }, [busy, onSubmittingChange]);
    useEffect(
        () => () => {
            run.current?.abort();
            notification.current?.close();
        },
        []
    );

    const update = <K extends keyof RenderSettings>(
        key: K,
        value: RenderSettings[K]
    ) => setSettings((previous) => ({ ...previous, [key]: value }));
    const start = async () => {
        const invalid = validateRenderSettings(settings, splitChannels);
        if (invalid) {
            setError(invalid);
            return;
        }
        if (!project || !document) {
            setError("This target is no longer available.");
            return;
        }
        const controller = new AbortController();
        run.current = controller;
        setError("");
        setPhase("rendering");
        if (bell) {
            try {
                notification.current = prepareCompletionBell();
            } catch {
                /* Sound is optional. */
            }
        }
        try {
            const result = await renderJob({
                projectUid,
                documents: chosen,
                settings,
                combine,
                splitChannels,
                signal: controller.signal,
                setConsole,
                onProgress: setProgress
            });
            controller.signal.throwIfAborted();
            setFiles(result);
            setPhase("completed");
            const completionBell = notification.current;
            notification.current = undefined;
            try {
                completionBell?.ring();
            } catch {
                // A failed notification must not hide completed exports.
                try {
                    completionBell?.close();
                } catch {
                    /* Audio cleanup is optional too. */
                }
            }
        } catch (cause) {
            setError(
                controller.signal.aborted
                    ? "Render cancelled. No partial file was added."
                    : cause instanceof Error
                      ? cause.message
                      : "Render failed. Read the console for details."
            );
            setPhase("settings");
            notification.current?.close();
            notification.current = undefined;
        } finally {
            run.current = undefined;
        }
    };
    const download = async () => {
        setDownloading(true);
        setError("");
        try {
            if (files.length === 1) {
                const file = nonCloudFiles.get(files[0]);
                if (!file)
                    throw new Error(
                        "The rendered file is no longer available."
                    );
                saveAs(new Blob([new Uint8Array(file.buffer)]), files[0]);
            } else {
                const zip = new JSZip();
                for (const name of files) {
                    const file = nonCloudFiles.get(name);
                    if (!file)
                        throw new Error(
                            "A rendered file is no longer available."
                        );
                    zip.file(name, file.buffer);
                }
                saveAs(
                    await zip.generateAsync({ type: "blob" }),
                    `${settings.filename.replace(/\.(wav|flac|ogg|mp3)$/i, "")}.zip`
                );
            }
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Could not prepare the download. Try again."
            );
        } finally {
            setDownloading(false);
        }
    };
    return (
        <div
            css={layout}
            role="dialog"
            aria-modal="true"
            aria-labelledby="render-title"
        >
            <header>
                <h2 id="render-title">Render to disk</h2>
                <IconButton
                    aria-label="Close render dialog"
                    disabled={busy}
                    onClick={() => dispatch(closeModal())}
                >
                    <CloseRounded />
                </IconButton>
            </header>
            {phase === "settings" ? (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void start();
                    }}
                >
                    <div className="form-body">
                        {playlistMode && (
                            <section
                                className="track-section"
                                aria-label="Tracks to render"
                            >
                                <div className="track-list">
                                    {tracks.map((track, index) => (
                                        <FormControlLabel
                                            key={track.documentUid}
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={selected.has(
                                                        track.documentUid
                                                    )}
                                                    onChange={(event) =>
                                                        setSelected(
                                                            (previous) => {
                                                                const next =
                                                                    new Set(
                                                                        previous
                                                                    );
                                                                if (
                                                                    event.target
                                                                        .checked
                                                                )
                                                                    next.add(
                                                                        track.documentUid
                                                                    );
                                                                else
                                                                    next.delete(
                                                                        track.documentUid
                                                                    );
                                                                return next;
                                                            }
                                                        )
                                                    }
                                                />
                                            }
                                            label={`${index + 1}. ${track.filename}`}
                                        />
                                    ))}
                                </div>
                                <FieldLabel
                                    id="render-layout"
                                    label="Track files"
                                    help="Combined tracks play one after another in playlist order, including their tails. Separate files export each selected track on its own. Combined tracks need matching sample rates and channel counts."
                                />
                                <TextField
                                    id="render-layout"
                                    select
                                    fullWidth
                                    size="small"
                                    value={combine ? "combined" : "separate"}
                                    onChange={(event) =>
                                        setCombine(
                                            event.target.value === "combined"
                                        )
                                    }
                                    slotProps={{ select: { native: true } }}
                                >
                                    <option value="separate">
                                        One file per track
                                    </option>
                                    <option value="combined">
                                        One continuous file
                                    </option>
                                </TextField>
                            </section>
                        )}
                        <div className="fields">
                            <div className="full">
                                <FieldLabel
                                    id="render-filename"
                                    label="Filename"
                                    help="The extension follows your format. The rendered file appears in the project tree as an unsaved file, ready to download."
                                />
                                <TextField
                                    id="render-filename"
                                    fullWidth
                                    size="small"
                                    value={settings.filename}
                                    onChange={(event) =>
                                        update("filename", event.target.value)
                                    }
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    .{settings.format}
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <FieldLabel
                                    id="render-format"
                                    label="Format"
                                    help="WAV keeps uncompressed audio for editing. FLAC compresses integer PCM without losing audio detail. Ogg Vorbis and MP3 make smaller files by discarding some audio detail. MP3 has broad player support."
                                />
                                <TextField
                                    id="render-format"
                                    select
                                    fullWidth
                                    size="small"
                                    value={settings.format}
                                    onChange={(event) => {
                                        const format = event.target
                                            .value as RenderSettings["format"];
                                        setSettings((previous) => ({
                                            ...previous,
                                            format,
                                            bitDepth:
                                                format === "flac" &&
                                                !["16", "24"].includes(
                                                    previous.bitDepth
                                                )
                                                    ? "24"
                                                    : previous.bitDepth
                                        }));
                                    }}
                                    slotProps={{ select: { native: true } }}
                                >
                                    <option value="wav">WAV</option>
                                    <option value="flac">
                                        FLAC (lossless)
                                    </option>
                                    <option value="ogg">Ogg Vorbis</option>
                                    <option value="mp3">MP3</option>
                                </TextField>
                            </div>
                            <div>
                                {["wav", "flac"].includes(settings.format) ? (
                                    <>
                                        <FieldLabel
                                            id="render-depth"
                                            label="Bit depth"
                                            help="More bits store finer amplitude detail and make larger files. 24-bit suits editing; 16-bit suits delivery. 32-bit float preserves levels above 0 dBFS for later adjustment."
                                        />
                                        <TextField
                                            id="render-depth"
                                            select
                                            fullWidth
                                            size="small"
                                            value={settings.bitDepth}
                                            onChange={(event) =>
                                                update(
                                                    "bitDepth",
                                                    event.target
                                                        .value as RenderSettings["bitDepth"]
                                                )
                                            }
                                            slotProps={{
                                                select: { native: true }
                                            }}
                                        >
                                            {settings.format === "wav" && (
                                                <option value="8">
                                                    8-bit PCM
                                                </option>
                                            )}
                                            <option value="16">
                                                16-bit PCM
                                            </option>
                                            <option value="24">
                                                24-bit PCM
                                            </option>
                                            {settings.format === "wav" && (
                                                <>
                                                    <option value="32">
                                                        32-bit PCM
                                                    </option>
                                                    <option value="float">
                                                        32-bit float
                                                    </option>
                                                    <option value="double">
                                                        64-bit float
                                                    </option>
                                                </>
                                            )}
                                        </TextField>
                                    </>
                                ) : (
                                    <>
                                        <FieldLabel
                                            id="render-quality"
                                            label="Encoding quality"
                                            help="Higher quality uses a higher average bitrate: more data per second, larger files, and less detail lost. Variable bitrate adapts to the music, so the final bitrate and size vary."
                                        />
                                        <TextField
                                            id="render-quality"
                                            select
                                            fullWidth
                                            size="small"
                                            value={settings.quality}
                                            onChange={(event) =>
                                                update(
                                                    "quality",
                                                    Number(event.target.value)
                                                )
                                            }
                                            slotProps={{
                                                select: { native: true }
                                            }}
                                        >
                                            <option value={0.3}>Compact</option>
                                            <option value={0.6}>
                                                Balanced
                                            </option>
                                            <option value={0.9}>
                                                High quality
                                            </option>
                                        </TextField>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="settings">
                            <div className="fields">
                                <div>
                                    <FieldLabel
                                        id="render-sr"
                                        label="Sample rate (sr)"
                                        help="Samples per second. Higher rates can capture higher frequencies, but use more CPU and space. Leave blank to keep the project rate; changing it can alter instruments that depend on sr."
                                    />
                                    <TextField
                                        id="render-sr"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        placeholder={projectSettingHint(
                                            document?.currentValue ?? "",
                                            "sr"
                                        )}
                                        value={settings.sampleRate ?? ""}
                                        onChange={(event) =>
                                            update(
                                                "sampleRate",
                                                event.target.value === ""
                                                    ? undefined
                                                    : Number(event.target.value)
                                            )
                                        }
                                        slotProps={{
                                            htmlInput: {
                                                min: 8000,
                                                max: 192000
                                            },
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        Hz
                                                    </InputAdornment>
                                                )
                                            }
                                        }}
                                    />
                                    <div
                                        className="sample-rate-presets"
                                        role="group"
                                        aria-label="Common sample rates"
                                    >
                                        {[44100, 48000, 96000, 192000].map(
                                            (rate) => (
                                                <Button
                                                    key={rate}
                                                    type="button"
                                                    size="small"
                                                    variant="text"
                                                    aria-pressed={
                                                        settings.sampleRate ===
                                                        rate
                                                    }
                                                    onClick={() =>
                                                        update(
                                                            "sampleRate",
                                                            rate
                                                        )
                                                    }
                                                >
                                                    {rate / 1000} kHz
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <FieldLabel
                                        id="render-ksmps"
                                        label="Control block (ksmps)"
                                        help="Audio samples per control update. Lower values give finer timing for envelopes and modulation, but can render much more slowly. They do not always improve sound. Leave blank to keep the project setting; local setksmps remains in effect."
                                    />
                                    <TextField
                                        id="render-ksmps"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        placeholder={projectSettingHint(
                                            document?.currentValue ?? "",
                                            "ksmps"
                                        )}
                                        value={settings.ksmps ?? ""}
                                        onChange={(event) =>
                                            update(
                                                "ksmps",
                                                event.target.value === ""
                                                    ? undefined
                                                    : Number(event.target.value)
                                            )
                                        }
                                        slotProps={{
                                            htmlInput: { min: 1, max: 8192 }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="fields channel-fields">
                                <div>
                                    <FieldLabel
                                        id="render-channels"
                                        label="Output channels"
                                        help="Overrides nchnls for every selected track. This changes the orchestra's output count; it does not downmix or duplicate channels. Leave blank to use each project's value. MP3 allows two channels per file; FLAC allows eight."
                                    />
                                    <TextField
                                        id="render-channels"
                                        type="number"
                                        fullWidth
                                        size="small"
                                        placeholder={projectSettingHint(
                                            document?.currentValue ?? "",
                                            "nchnls"
                                        )}
                                        value={settings.channels ?? ""}
                                        onChange={(event) =>
                                            update(
                                                "channels",
                                                event.target.value === ""
                                                    ? undefined
                                                    : Number(event.target.value)
                                            )
                                        }
                                        slotProps={{
                                            htmlInput: { min: 1, max: 64 }
                                        }}
                                    />
                                </div>
                                <div>
                                    <FieldLabel
                                        id="render-dither"
                                        label="Dither"
                                        help="Adds very quiet noise to reduce distortion when converting to integer PCM. Available for 16-bit WAV and FLAC. It changes the samples before encoding; keep it off to preserve existing 16-bit samples."
                                    />
                                    <TextField
                                        id="render-dither"
                                        select
                                        fullWidth
                                        size="small"
                                        disabled={
                                            !["wav", "flac"].includes(
                                                settings.format
                                            ) || settings.bitDepth !== "16"
                                        }
                                        value={
                                            settings.dither &&
                                            ["wav", "flac"].includes(
                                                settings.format
                                            ) &&
                                            settings.bitDepth === "16"
                                                ? "on"
                                                : "off"
                                        }
                                        onChange={(event) =>
                                            update(
                                                "dither",
                                                event.target.value === "on"
                                            )
                                        }
                                        slotProps={{ select: { native: true } }}
                                    >
                                        <option value="off">Off</option>
                                        <option value="on">Triangular</option>
                                    </TextField>
                                </div>
                            </div>
                            <FormControlLabel
                                className="channel-checkbox"
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={splitChannels}
                                        onChange={(event) =>
                                            setSplitChannels(
                                                event.target.checked
                                            )
                                        }
                                    />
                                }
                                label="Separate mono file for each channel"
                            />
                            <div className="timing-option">
                                <Checkbox
                                    id="render-sample-accurate"
                                    size="small"
                                    checked={settings.sampleAccurate ?? false}
                                    onChange={(event) =>
                                        update(
                                            "sampleAccurate",
                                            event.target.checked
                                        )
                                    }
                                />
                                <FieldLabel
                                    id="render-sample-accurate"
                                    label="Sample-accurate score timing"
                                    help="Enables --sample-accurate so score events can start between control blocks. Control updates still follow ksmps, and tied notes are not supported. Leave unchecked to keep the project's timing setting."
                                />
                            </div>
                            <p className="note">
                                These settings apply to this render. Your source
                                stays unchanged.
                            </p>
                        </div>
                        {settings.format === "mp3" && (
                            <details>
                                <summary>Metadata</summary>
                                <div className="advanced-body">
                                    <Alert severity="warning" role="note">
                                        MP3 metadata editing is unsupported here
                                        until libsndfile{" "}
                                        <Link
                                            href="https://github.com/libsndfile/libsndfile/pull/1028"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            color="inherit"
                                        >
                                            PR #1028
                                        </Link>{" "}
                                        is merged and released in the version
                                        Csound uses. It adds missing copyright
                                        tags. Non-ASCII text also has a separate
                                        encoding issue, tracked in{" "}
                                        <Link
                                            href="https://github.com/libsndfile/libsndfile/issues/915"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            color="inherit"
                                        >
                                            issue #915
                                        </Link>
                                        .
                                    </Alert>
                                </div>
                            </details>
                        )}
                        <RenderMacros
                            settings={settings}
                            onSettings={setSettings}
                        />
                        <FormControlLabel
                            className="bell"
                            control={
                                <Checkbox
                                    checked={bell}
                                    onChange={(event) =>
                                        setBell(event.target.checked)
                                    }
                                    size="small"
                                />
                            }
                            label="Play a bell when rendering finishes"
                        />
                    </div>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <footer>
                        <Button onClick={() => dispatch(closeModal())}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!chosen.length}
                            variant="contained"
                            disableElevation
                        >
                            Render audio
                        </Button>
                    </footer>
                </form>
            ) : (
                <>
                    <div className="status" role="status" aria-live="polite">
                        {busy ? (
                            <>
                                <LinearProgress aria-label="Rendering audio" />
                                <h3>Rendering audio…</h3>
                                <p>
                                    {progress || renderFilename(settings)}
                                    <br />
                                    Keep this tab open. Long scores and small
                                    ksmps values can take time.
                                </p>
                            </>
                        ) : (
                            <>
                                <CheckCircleOutlineRounded fontSize="large" />
                                <h3>Render complete</h3>
                                <p>
                                    {files.join(", ")}
                                    <br />
                                    Your audio is ready to download and appears
                                    in the project tree.
                                </p>
                            </>
                        )}
                    </div>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <footer>
                        {busy ? (
                            <Button onClick={() => run.current?.abort()}>
                                Cancel render
                            </Button>
                        ) : (
                            <>
                                <Button onClick={() => dispatch(closeModal())}>
                                    Done
                                </Button>
                                <Button
                                    variant="contained"
                                    disableElevation
                                    startIcon={<DownloadRounded />}
                                    disabled={downloading}
                                    onClick={() => void download()}
                                >
                                    {files.length > 1
                                        ? "Download ZIP"
                                        : "Download audio"}
                                </Button>
                            </>
                        )}
                    </footer>
                </>
            )}
        </div>
    );
}
