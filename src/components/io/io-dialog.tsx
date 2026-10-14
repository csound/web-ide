import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    Stack,
    Typography
} from "@mui/material";
import MicIcon from "@mui/icons-material/MicNone";
import VolumeIcon from "@mui/icons-material/VolumeUpOutlined";
import StopIcon from "@mui/icons-material/Stop";
import { ProfileDialog } from "../profile/profile-dialog";
import { closeModal } from "../modal/actions";
import { useDispatch, useSelector } from "../../store";
import { getLiveCsound } from "../csound/actions";
import { allNotesOff } from "./midi";
import {
    audioDevices,
    canSelectOutput,
    captureInput,
    connectMidiDevices,
    currentMidiAccess,
    deviceError
} from "./devices";
import {
    defaultIoSettings,
    getIoSettings,
    saveIoSettings,
    useIoStatus,
    type IoSettings
} from "./settings";
import { previewInput, previewOutput } from "./preview";

export type IoKind = "input" | "output" | "midi";
const titles = { input: "Audio Input", output: "Audio Output", midi: "MIDI" };
const fields = {
    input: [
        "inputDevice",
        "inputChannel",
        "echoCancellation",
        "noiseSuppression",
        "autoGainControl"
    ],
    output: ["outputDevice", "latency", "sampleRate"],
    midi: ["midiInputs", "midiChannel"]
} as const;

function Choice({
    label,
    value,
    onChange,
    children,
    disabled = false
}: {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    children: ReactNode;
    disabled?: boolean;
}) {
    const id = useId();
    return (
        <Stack spacing={0.75}>
            <Typography
                component="label"
                id={`${id}-label`}
                htmlFor={id}
                variant="body2"
            >
                {label}
            </Typography>
            <Select
                displayEmpty
                id={id}
                labelId={`${id}-label`}
                value={value}
                onChange={(event) => onChange(String(event.target.value))}
                disabled={disabled}
                size="small"
                fullWidth
            >
                {children}
            </Select>
        </Stack>
    );
}

export function IoDialog({ kind }: { kind: IoKind }) {
    const dispatch = useDispatch();
    const [draft, setDraft] = useState(getIoSettings);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [inputs, setInputs] = useState<MIDIInput[]>([]);
    const [access, setAccess] = useState(currentMidiAccess);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [testing, setTesting] = useState(false);
    const pending = useRef<AbortController>();
    const mounted = useRef(true);
    const meter = useRef<HTMLDivElement>(null);
    const status = useIoStatus();
    const projectUid = useSelector(
        (state) => state.ProjectsReducer.activeProjectUid
    );
    const playing = useSelector((state) => state.csound.status === "playing");
    const supportedOutput = canSelectOutput();
    const constraints =
        navigator.mediaDevices?.getSupportedConstraints?.() || {};
    const midiSupported = !!navigator.requestMIDIAccess;
    const refresh = async () => {
        setDevices(await audioDevices());
    };

    useEffect(() => {
        mounted.current = true;
        let active = true;
        const update = () => {
            void audioDevices()
                .then((list) => {
                    if (active) setDevices(list);
                })
                .catch(() => {});
        };
        update();
        navigator.mediaDevices?.addEventListener("devicechange", update);
        return () => {
            mounted.current = false;
            active = false;
            navigator.mediaDevices?.removeEventListener("devicechange", update);
            pending.current?.abort();
        };
    }, []);
    useEffect(() => {
        const update = () =>
            setInputs(
                access
                    ? [...access.inputs.values()].filter(
                          (input) => input.state === "connected"
                      )
                    : []
            );
        update();
        access?.addEventListener("statechange", update);
        return () => access?.removeEventListener("statechange", update);
    }, [access]);

    const stopTest = () => {
        pending.current?.abort();
        setTesting(false);
        setBusy(false);
    };
    const change = (patch: Partial<IoSettings>) => {
        stopTest();
        setError("");
        setDraft((current) => ({ ...current, ...patch }));
    };
    const run = async (action: (signal: AbortSignal) => Promise<void>) => {
        pending.current?.abort();
        const controller = new AbortController();
        pending.current = controller;
        setError("");
        setBusy(true);
        try {
            await action(controller.signal);
        } catch (cause) {
            if (!controller.signal.aborted) {
                setError(deviceError(cause));
                setTesting(false);
                controller.abort();
            }
        } finally {
            if (mounted.current && pending.current === controller)
                setBusy(false);
        }
    };
    const test = () => {
        if (testing) {
            stopTest();
            return;
        }
        setTesting(true);
        void run(async (signal) => {
            if (kind === "input") {
                await previewInput(draft, signal, (level) => {
                    if (meter.current)
                        meter.current.style.transform = `scaleX(${level})`;
                });
                if (!signal.aborted) await refresh();
            } else {
                await previewOutput(draft, signal);
                if (!signal.aborted) setTesting(false);
            }
        });
    };
    const chooseOutput = () =>
        void run(async (signal) => {
            const media = navigator.mediaDevices as MediaDevices & {
                selectAudioOutput?: (options: {
                    deviceId: string;
                }) => Promise<MediaDeviceInfo>;
            };
            if (media?.selectAudioOutput) {
                const chosen = await media.selectAudioOutput({
                    deviceId: draft.outputDevice
                });
                if (signal.aborted) return;
                setDraft((current) => ({
                    ...current,
                    outputDevice: chosen.deviceId
                }));
            } else {
                // Chromium reveals output labels after an explicit microphone grant.
                const stream = await captureInput(
                    { ...defaultIoSettings },
                    signal
                );
                stream.getTracks().forEach((track) => track.stop());
            }
            if (!signal.aborted) await refresh();
        });
    const save = () => {
        // Merge this dialog's fields only; another tab may have changed other settings.
        const next = { ...getIoSettings() };
        for (const key of fields[kind])
            Object.assign(next, { [key]: draft[key] });
        saveIoSettings(next);
        dispatch(closeModal());
    };
    const deviceKind = kind === "input" ? "audioinput" : "audiooutput";
    const visibleDevices = devices.filter(
        (device) =>
            device.kind === deviceKind &&
            device.deviceId &&
            device.deviceId !== "default"
    );
    const selectedDevice =
        kind === "input" ? draft.inputDevice : draft.outputDevice;
    const missing =
        selectedDevice &&
        !visibleDevices.some((device) => device.deviceId === selectedDevice);

    return (
        <ProfileDialog
            title={titles[kind]}
            actions={
                <>
                    <Button
                        onClick={() =>
                            change(
                                Object.fromEntries(
                                    fields[kind].map((key) => [
                                        key,
                                        defaultIoSettings[key]
                                    ])
                                )
                            )
                        }
                        sx={{ mr: "auto" }}
                    >
                        Reset
                    </Button>
                    <Button onClick={() => dispatch(closeModal())}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={save}>
                        Save
                    </Button>
                </>
            }
        >
            <Typography variant="body2" color="text.secondary">
                {kind === "input"
                    ? "Choose what your Csound piece hears."
                    : kind === "output"
                      ? "Choose where your music plays."
                      : "Choose the controllers your Csound piece receives."}{" "}
                Changes apply next time you play.
            </Typography>
            {error && (
                <Alert severity="error" role="alert">
                    {error}
                </Alert>
            )}
            {kind !== "midi" && (
                <>
                    <Choice
                        label={
                            kind === "input" ? "Input device" : "Output device"
                        }
                        value={selectedDevice}
                        disabled={kind === "output" && !supportedOutput}
                        onChange={(value) =>
                            change(
                                kind === "input"
                                    ? { inputDevice: value }
                                    : { outputDevice: value }
                            )
                        }
                    >
                        <MenuItem value="">System default</MenuItem>
                        {visibleDevices.map((device, index) => (
                            <MenuItem
                                key={device.deviceId}
                                value={device.deviceId}
                            >
                                {device.label ||
                                    `${kind === "input" ? "Input" : "Output"} ${index + 1}`}
                            </MenuItem>
                        ))}
                        {missing && (
                            <MenuItem value={selectedDevice}>
                                Saved device (not available)
                            </MenuItem>
                        )}
                    </Choice>
                    {kind === "input" ? (
                        <>
                            <Choice
                                label="Input channels"
                                value={draft.inputChannel}
                                onChange={(value) =>
                                    change({ inputChannel: Number(value) })
                                }
                            >
                                <MenuItem value={0}>
                                    All available channels
                                </MenuItem>
                                {Array.from({ length: 32 }, (_, index) => (
                                    <MenuItem key={index + 1} value={index + 1}>
                                        Channel {index + 1} (mono)
                                    </MenuItem>
                                ))}
                            </Choice>
                            <Box>
                                <Stack
                                    direction="row"
                                    sx={{ alignItems: "center", gap: 2 }}
                                >
                                    <Button
                                        variant="outlined"
                                        startIcon={
                                            testing ? <StopIcon /> : <MicIcon />
                                        }
                                        onClick={test}
                                        disabled={busy && !testing}
                                    >
                                        {testing ? "Stop test" : "Test input"}
                                    </Button>
                                    <Box
                                        role="img"
                                        aria-label={
                                            testing
                                                ? "Input level meter, listening"
                                                : "Input level meter, off"
                                        }
                                        sx={{
                                            flex: 1,
                                            height: 8,
                                            overflow: "hidden",
                                            borderRadius: 1,
                                            bgcolor: "action.selected"
                                        }}
                                    >
                                        <Box
                                            ref={meter}
                                            sx={{
                                                height: "100%",
                                                bgcolor: "primary.main",
                                                transformOrigin: "left",
                                                transform: "scaleX(0)"
                                            }}
                                        />
                                    </Box>
                                </Stack>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Testing asks for microphone access and
                                    reveals device names. You won’t hear the
                                    input.
                                </Typography>
                            </Box>
                            <Box
                                component="details"
                                sx={{
                                    "& summary": { cursor: "pointer", py: 1 }
                                }}
                            >
                                <Typography component="summary" variant="body2">
                                    Microphone processing
                                </Typography>
                                <Stack>
                                    {(
                                        [
                                            [
                                                "echoCancellation",
                                                "Echo cancellation"
                                            ],
                                            [
                                                "noiseSuppression",
                                                "Noise suppression"
                                            ],
                                            [
                                                "autoGainControl",
                                                "Automatic gain"
                                            ]
                                        ] as const
                                    ).map(([key, label]) => (
                                        <FormControlLabel
                                            key={key}
                                            control={
                                                <Checkbox
                                                    checked={draft[key]}
                                                    disabled={!constraints[key]}
                                                    onChange={(event) =>
                                                        change({
                                                            [key]: event.target
                                                                .checked
                                                        })
                                                    }
                                                />
                                            }
                                            label={label}
                                        />
                                    ))}
                                </Stack>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Off by default for music. Browsers may not
                                    support every setting.
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <>
                            {supportedOutput ? (
                                <Box>
                                    <Stack
                                        direction="row"
                                        sx={{ gap: 1, flexWrap: "wrap" }}
                                    >
                                        <Button
                                            variant="outlined"
                                            onClick={chooseOutput}
                                            disabled={busy}
                                        >
                                            Choose output
                                        </Button>
                                        <Button
                                            startIcon={
                                                testing ? (
                                                    <StopIcon />
                                                ) : (
                                                    <VolumeIcon />
                                                )
                                            }
                                            onClick={test}
                                            disabled={busy && !testing}
                                        >
                                            {testing
                                                ? "Stop test"
                                                : "Test sound"}
                                        </Button>
                                    </Stack>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        {"selectAudioOutput" in
                                        (navigator.mediaDevices || {})
                                            ? "Your browser will ask which output to allow."
                                            : "To list outputs, this browser asks for microphone access. We stop the microphone right away."}
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        This browser uses your system output.
                                        Change speakers or headphones in your
                                        device’s sound settings.
                                    </Typography>
                                    <Button
                                        sx={{ alignSelf: "flex-start" }}
                                        startIcon={
                                            testing ? (
                                                <StopIcon />
                                            ) : (
                                                <VolumeIcon />
                                            )
                                        }
                                        onClick={test}
                                    >
                                        {testing ? "Stop test" : "Test sound"}
                                    </Button>
                                </>
                            )}
                            <Box
                                component="details"
                                sx={{
                                    "& summary": { cursor: "pointer", py: 1 }
                                }}
                            >
                                <Typography component="summary" variant="body2">
                                    Advanced
                                </Typography>
                                <Stack spacing={2} sx={{ mt: 1 }}>
                                    <Choice
                                        label="Latency preference"
                                        value={draft.latency}
                                        onChange={(value) =>
                                            change({
                                                latency:
                                                    value as IoSettings["latency"]
                                            })
                                        }
                                    >
                                        <MenuItem value="interactive">
                                            Low latency · live playing
                                        </MenuItem>
                                        <MenuItem value="balanced">
                                            Balanced
                                        </MenuItem>
                                        <MenuItem value="playback">
                                            Playback · less CPU use
                                        </MenuItem>
                                    </Choice>
                                    <Choice
                                        label="Sample rate"
                                        value={draft.sampleRate}
                                        onChange={(value) =>
                                            change({
                                                sampleRate: Number(value)
                                            })
                                        }
                                    >
                                        <MenuItem value={0}>Automatic</MenuItem>
                                        {[44100, 48000, 96000].map((rate) => (
                                            <MenuItem key={rate} value={rate}>
                                                {rate.toLocaleString()} Hz
                                            </MenuItem>
                                        ))}
                                    </Choice>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        The browser decides the buffer size.
                                        These preferences affect live playback,
                                        not file rendering.
                                    </Typography>
                                </Stack>
                            </Box>
                            {status.sampleRate && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Last playback:{" "}
                                    {status.sampleRate.toLocaleString()} Hz
                                    {status.latency
                                        ? ` · ${(status.latency * 1000).toFixed(1)} ms base latency`
                                        : ""}{" "}
                                    · {status.engine}
                                </Typography>
                            )}
                        </>
                    )}
                </>
            )}
            {kind === "midi" && (
                <>
                    {!midiSupported ? (
                        <Typography variant="body2" color="text.secondary">
                            This browser does not support MIDI controllers. The
                            virtual keyboard still works.
                        </Typography>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                sx={{ alignSelf: "flex-start" }}
                                disabled={busy}
                                onClick={() =>
                                    void run(async (signal) => {
                                        const connected =
                                            await connectMidiDevices();
                                        if (!signal.aborted)
                                            setAccess(connected);
                                    })
                                }
                            >
                                {busy ? "Connecting…" : "Connect MIDI"}
                            </Button>
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={draft.midiInputs === "all"}
                                            onChange={(event) =>
                                                change({
                                                    midiInputs: event.target
                                                        .checked
                                                        ? "all"
                                                        : inputs.map(
                                                              (input) =>
                                                                  input.id
                                                          )
                                                })
                                            }
                                        />
                                    }
                                    label="Use all controllers"
                                />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Includes controllers connected during
                                    playback. Uncheck to choose individual
                                    inputs.
                                </Typography>
                            </Box>
                            {inputs.length ? (
                                <Stack>
                                    {inputs.map((input) => (
                                        <FormControlLabel
                                            key={input.id}
                                            control={
                                                <Checkbox
                                                    disabled={
                                                        draft.midiInputs ===
                                                        "all"
                                                    }
                                                    checked={
                                                        draft.midiInputs ===
                                                            "all" ||
                                                        draft.midiInputs.includes(
                                                            input.id
                                                        )
                                                    }
                                                    onChange={(event) =>
                                                        change({
                                                            midiInputs: event
                                                                .target.checked
                                                                ? [
                                                                      ...(draft.midiInputs ===
                                                                      "all"
                                                                          ? []
                                                                          : draft.midiInputs),
                                                                      input.id
                                                                  ]
                                                                : (draft.midiInputs ===
                                                                  "all"
                                                                      ? []
                                                                      : draft.midiInputs
                                                                  ).filter(
                                                                      (id) =>
                                                                          id !==
                                                                          input.id
                                                                  )
                                                        })
                                                    }
                                                />
                                            }
                                            label={
                                                input.name ||
                                                "Unnamed controller"
                                            }
                                        />
                                    ))}
                                </Stack>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {access
                                        ? "No controllers connected. Plug one in to see it here."
                                        : "Connect to let the browser list your controllers."}
                                </Typography>
                            )}
                            {draft.midiInputs !== "all" &&
                                draft.midiInputs.some(
                                    (id) =>
                                        !inputs.some((input) => input.id === id)
                                ) && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Some saved controllers are disconnected.
                                        They stay selected for when you
                                        reconnect them.
                                    </Typography>
                                )}
                            <Choice
                                label="Receive on channel"
                                value={draft.midiChannel}
                                onChange={(value) =>
                                    change({ midiChannel: Number(value) })
                                }
                            >
                                <MenuItem value={0}>All channels</MenuItem>
                                {Array.from({ length: 16 }, (_, index) => (
                                    <MenuItem key={index + 1} value={index + 1}>
                                        Channel {index + 1}
                                    </MenuItem>
                                ))}
                            </Choice>
                        </>
                    )}
                    <Box>
                        <Button
                            variant="outlined"
                            disabled={!playing || busy}
                            onClick={() =>
                                void run(async () => {
                                    const engine = getLiveCsound(
                                        projectUid || ""
                                    );
                                    if (engine) await allNotesOff(engine);
                                })
                            }
                        >
                            All notes off
                        </Button>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                        >
                            Release stuck notes in the running piece. The
                            channel filter applies to controllers, not the
                            virtual keyboard.
                        </Typography>
                    </Box>
                </>
            )}
        </ProfileDialog>
    );
}
