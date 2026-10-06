import { decodeAudio, durationOf, encodeAudioAsync } from "./audio";
import type { LoadedAudio } from "./preview";
import type { ToolRequest } from "./types";
import { runTool } from "./runner";

export const sweepDefaults = { seconds: 1, rate: 48000 };
export type SweepSettings = typeof sweepDefaults;
export type ImpulseRequest =
    | { kind: "sweep"; settings: SweepSettings }
    | {
          kind: "extract";
          sweep: LoadedAudio;
          recording: LoadedAudio;
          channel: number;
      }
    | {
          kind: "convolution";
          source: LoadedAudio;
          range: [number, number];
          channel: number;
      };
export type ImpulsePreview = LoadedAudio & { playback: Uint8Array };

/** Limit FFT work before a worker downloads a binary or allocates its buffers. */
function checkLength(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0.01 || seconds > 10)
        throw new Error(
            "Use between 0.01 and 10 seconds of audio. Trim longer files in Sample Editor."
        );
}

/** Generate the reference sweep at the exact rate used for the recording. */
export function sweepRequest(settings: SweepSettings): ToolRequest {
    checkLength(settings.seconds);
    if (
        ![8000, 16000, 22050, 32000, 44100, 48000, 88200, 96000].includes(
            settings.rate
        )
    )
        throw new Error("Choose a supported sample rate.");
    return {
        tool: "mkir",
        args: [
            "-g",
            `-t${settings.seconds}`,
            `-r${settings.rate}`,
            "sweep.wav"
        ],
        files: [],
        output: "sweep.wav"
    };
}

/** Use mono inputs: the shipped mkir command cannot safely process multichannel recordings. */
export async function impulseRequest(
    request: Exclude<ImpulseRequest, { kind: "sweep" }>,
    signal: AbortSignal
): Promise<ToolRequest> {
    if (request.kind === "extract") {
        const { sweep, recording, channel } = request;
        checkLength(durationOf(sweep.audio));
        if (sweep.audio.channels.length !== 1)
            throw new Error("Choose a mono reference sweep.");
        if (sweep.audio.sampleRate !== recording.audio.sampleRate)
            throw new Error(
                "The sweep and recording must have the same sample rate. Resample the recording in Sample Editor first."
            );
        const duration = durationOf(recording.audio);
        if (
            duration < durationOf(sweep.audio) ||
            duration > 2 * durationOf(sweep.audio)
        )
            throw new Error(
                "The recording must be between one and two sweep lengths. Align its start with the sweep and trim it in Sample Editor."
            );
        return {
            tool: "mkir",
            args: ["sweep.wav", "-irecording.wav", "-oimpulse.wav"],
            files: [
                { name: "sweep.wav", data: sweep.data },
                {
                    name: "recording.wav",
                    data: await encodeAudioAsync(
                        recording.audio,
                        signal,
                        [0, duration],
                        channel
                    )
                }
            ],
            output: "impulse.wav"
        };
    }
    const { source, range, channel } = request;
    checkLength(range[1] - range[0]);
    return {
        tool: "cvanal",
        // The text format is portable between Csound builds. Encode the selected
        // channel ourselves to support all channels accepted by the audio loader.
        args: ["-X", "input.wav", "response.cv"],
        files: [
            {
                name: "input.wav",
                data: await encodeAudioAsync(
                    source.audio,
                    signal,
                    range,
                    channel
                )
            }
        ],
        output: "response.cv"
    };
}

/** Rebuild from the source files, then publish one playable preview and its export. */
export async function buildImpulse(
    request: ImpulseRequest,
    signal: AbortSignal,
    status: (text: string) => void
): Promise<ImpulsePreview> {
    const command =
        request.kind === "sweep"
            ? sweepRequest(request.settings)
            : await impulseRequest(request, signal);
    const result = await runTool(command, signal, status);
    signal.throwIfAborted();
    const playback =
        request.kind === "convolution" ? command.files[0].data : result.data;
    const audio = await decodeAudio(playback, signal);
    const name =
        request.kind === "sweep"
            ? `sweep-${request.settings.seconds}s-${request.settings.rate}Hz.wav`
            : request.kind === "extract"
              ? `${request.recording.name.replace(/\.[^.]+$/, "")}-impulse.wav`
              : `${request.source.name.replace(/\.[^.]+$/, "")}-convolve.cv`;
    return { name, data: result.data, audio, playback };
}
