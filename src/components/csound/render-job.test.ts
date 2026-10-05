import { beforeEach, describe, expect, it, vi } from "vitest";
import { store } from "../../store";
import { nonCloudFiles } from "../file-tree/actions";
import type { IDocument } from "../projects/types";
import { runPerformance, runPerformanceBatch } from "./actions";
import { renderJob, type RenderJob } from "./render-job";
import { rawToWave, readWave } from "./wave-files";

vi.mock("./actions", () => ({
    runPerformance: vi.fn(),
    runPerformanceBatch: vi.fn(),
    documentPath: (doc: IDocument) => doc.filename
}));
const audio = (channels = 2, frames = 4) =>
    rawToWave(
        new Uint8Array(channels * frames * 8),
        48000,
        channels,
        "double",
        1
    );
let job: RenderJob;
beforeEach(() => {
    vi.clearAllMocks();
    nonCloudFiles.clear();
    const documents = ["first", "second"].map((name) => ({
        documentUid: name,
        filename: `${name}.csd`,
        type: "txt",
        path: [],
        currentValue: "csd"
    })) as IDocument[];
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "export",
                documents: Object.fromEntries(
                    documents.map((doc) => [doc.documentUid, doc])
                )
            }
        ]
    });
    store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid: "export" });
    vi.mocked(runPerformanceBatch).mockImplementation((task, signal) =>
        task(runPerformance, signal)
    );
    vi.mocked(runPerformance).mockResolvedValue({
        status: "completed",
        files: [],
        audio: audio()
    });
    job = {
        projectUid: "export",
        documents,
        settings: {
            filename: "album",
            format: "wav",
            bitDepth: "24",
            quality: 0.6
        },
        combine: false,
        splitChannels: false,
        signal: new AbortController().signal,
        setConsole: vi.fn(),
        onProgress: vi.fn()
    };
});

describe("render job", () => {
    it("exports selected tracks in order and publishes only after all succeed", async () => {
        vi.mocked(runPerformance).mockImplementation(async () => {
            expect(nonCloudFiles.size).toBe(0);
            return { status: "completed", files: [], audio: audio() };
        });
        expect(await renderJob(job)).toEqual([
            "album-01-first.wav",
            "album-02-second.wav"
        ]);
        expect(
            vi
                .mocked(runPerformance)
                .mock.calls.map(([options]) => options.csdPath)
        ).toEqual(["first.csd", "second.csd"]);
        expect(nonCloudFiles.size).toBe(2);
    });
    it("joins PCM before encoding and applies dither only in the final pass", async () => {
        await renderJob({
            ...job,
            combine: true,
            settings: { ...job.settings, bitDepth: "16", dither: true }
        });
        const calls = vi
            .mocked(runPerformance)
            .mock.calls.map(([options]) => options);
        expect(calls).toHaveLength(3);
        expect(calls[0].renderSettings).toMatchObject({
            bitDepth: "double",
            dither: false
        });
        expect(readWave(calls[2].inputFiles![0].data).frames).toBe(8);
        expect(calls[2].renderSettings).toMatchObject({
            bitDepth: "16",
            dither: true,
            orchestraMacros: undefined,
            scoreMacros: undefined
        });
        expect([...nonCloudFiles.keys()]).toEqual(["album.wav"]);
    });
    it("splits a multichannel render into numbered mono files before MP3 encoding", async () => {
        vi.mocked(runPerformance).mockResolvedValueOnce({
            status: "completed",
            files: [],
            audio: audio(4)
        });
        const files = await renderJob({
            ...job,
            documents: [job.documents[0]],
            splitChannels: true,
            settings: { ...job.settings, format: "mp3", channels: 4 }
        });
        expect(files).toEqual([
            "album-ch01.mp3",
            "album-ch02.mp3",
            "album-ch03.mp3",
            "album-ch04.mp3"
        ]);
        for (const [options] of vi.mocked(runPerformance).mock.calls.slice(1)) {
            expect(readWave(options.inputFiles![0].data).channels).toBe(1);
            expect(options.renderSettings).toMatchObject({
                format: "mp3",
                channels: 1
            });
        }
    });
    it("discards staged files when a later track fails", async () => {
        vi.mocked(runPerformance)
            .mockResolvedValueOnce({
                status: "completed",
                files: [],
                audio: audio()
            })
            .mockRejectedValueOnce(new Error("Compile failed"));
        await expect(renderJob(job)).rejects.toThrow("Compile failed");
        expect(nonCloudFiles.size).toBe(0);
    });
    it("cancels between tracks without publishing partial results", async () => {
        const controller = new AbortController();
        vi.mocked(runPerformance).mockImplementationOnce(async () => {
            controller.abort();
            return { status: "completed", files: [], audio: audio() };
        });
        await expect(
            renderJob({ ...job, signal: controller.signal })
        ).rejects.toThrow();
        expect(runPerformance).toHaveBeenCalledOnce();
        expect(nonCloudFiles.size).toBe(0);
    });
    it("does not publish audio into a different project", async () => {
        vi.mocked(runPerformance).mockImplementation(async () => {
            store.dispatch({
                type: "PROJECTS.ACTIVATE_PROJECT",
                projectUid: "other"
            });
            return { status: "completed", files: [], audio: audio() };
        });
        await expect(renderJob(job)).rejects.toThrow("project changed");
        expect(nonCloudFiles.size).toBe(0);
    });
});
