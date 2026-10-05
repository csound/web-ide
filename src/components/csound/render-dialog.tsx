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
    TextField,
    Tooltip
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { saveAs } from "file-saver";
import { useDispatch, useSelector } from "@root/store";
import { closeModal } from "@comp/modal/actions";
import { nonCloudFiles } from "@comp/file-tree/actions";
import { documentPath, outputNameFromCsd, runPerformance } from "./actions";
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
    width: 540px;
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
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
    }
    header p {
        margin: 6px 0 24px;
        overflow-wrap: anywhere;
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

function FieldLabel({
    id,
    label,
    help
}: {
    id: string;
    label: string;
    help: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="field-label">
            <label htmlFor={id}>{label}</label>
            <Tooltip
                id={`${id}-help`}
                title={help}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                describeChild
            >
                <IconButton
                    size="small"
                    aria-label={`About ${label}`}
                    onClick={() => setOpen(!open)}
                    onBlur={() => setOpen(false)}
                >
                    <InfoOutlined />
                </IconButton>
            </Tooltip>
        </div>
    );
}

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
        const invalid = validateRenderSettings(settings);
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
            const result = await runPerformance({
                projectUid,
                csdPath: /\.csd$/i.test(document.filename)
                    ? documentPath(document, project.documents)
                    : undefined,
                orc: document.currentValue,
                mode: "render",
                renderSettings: settings,
                signal: controller.signal,
                setConsole
            });
            controller.signal.throwIfAborted();
            // The render output is first; other generated files stay in the tree.
            setFiles(result.files.slice(0, 1));
            setPhase("completed");
            notification.current?.ring();
            notification.current = undefined;
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
    return (
        <div
            css={layout}
            role="dialog"
            aria-modal="true"
            aria-labelledby="render-title"
        >
            <header>
                <div>
                    <h2 id="render-title">Render to disk</h2>
                    <p>
                        {document?.filename ?? "No target selected"} · Audio
                        export
                    </p>
                </div>
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
                                help="WAV keeps uncompressed audio for editing. Ogg Vorbis and MP3 make smaller files by discarding some audio detail. MP3 has broad player support."
                            />
                            <TextField
                                id="render-format"
                                select
                                fullWidth
                                size="small"
                                value={settings.format}
                                onChange={(event) =>
                                    update(
                                        "format",
                                        event.target
                                            .value as RenderSettings["format"]
                                    )
                                }
                                slotProps={{ select: { native: true } }}
                            >
                                <option value="wav">WAV</option>
                                <option value="ogg">Ogg Vorbis</option>
                                <option value="mp3">MP3</option>
                            </TextField>
                        </div>
                        <div>
                            {settings.format === "wav" ? (
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
                                        slotProps={{ select: { native: true } }}
                                    >
                                        <option value="16">16-bit PCM</option>
                                        <option value="24">24-bit PCM</option>
                                        <option value="float">
                                            32-bit float
                                        </option>
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
                                        slotProps={{ select: { native: true } }}
                                    >
                                        <option value={0.3}>Compact</option>
                                        <option value={0.6}>Balanced</option>
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
                                        htmlInput: { min: 8000, max: 192000 },
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    Hz
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
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
                        <p className="note">
                            These settings apply to this render. Your source
                            stays unchanged.
                        </p>
                    </div>
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
                                    {renderFilename(settings)}
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
                                    onClick={() => {
                                        for (const name of files) {
                                            const file =
                                                nonCloudFiles.get(name);
                                            if (file)
                                                saveAs(
                                                    new Blob([
                                                        new Uint8Array(
                                                            file.buffer
                                                        )
                                                    ]),
                                                    name
                                                );
                                        }
                                    }}
                                >
                                    Download audio
                                </Button>
                            </>
                        )}
                    </footer>
                </>
            )}
        </div>
    );
}
