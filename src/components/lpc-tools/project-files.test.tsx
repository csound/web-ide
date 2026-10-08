import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, renderHook } from "@testing-library/react";
import type { AudioSource } from "../audio-tools/audio-tool";
import type { IDocument } from "../projects/types";
import { nonCloudFiles } from "../file-tree/actions";
import { useProjectToolFiles } from "../audio-tools/project-files";
import { checkLpcSize, MAX_LPC_BYTES } from "./format";
import {
    SampleEditor,
    AudioAnalysis,
    ImpulseResponse,
    ConvolutionPrep
} from "../audio-tools/project-tools";
import ProjectLpc from "./project-lpc";
const { documents, generated, dispatch, tool } = vi.hoisted(() => ({
    documents: {} as Record<string, IDocument>,
    generated: [] as string[],
    dispatch: vi.fn(),
    tool: vi.fn<React.FC<{ sources: AudioSource[] }>>(() => null)
}));
vi.mock("../audio-tools/audio-tool", () => ({ default: tool }));
vi.mock("../audio-tools/impulse-tool", () => ({ default: tool }));
vi.mock("./lpc-tool", () => ({ default: tool }));
vi.mock("../../store", () => ({
    useDispatch: () => dispatch,
    useSelector: (select: (state: any) => unknown) =>
        select({
            ProjectsReducer: { projects: { project: { documents } } },
            FileTreeReducer: { nonCloudFiles: generated }
        })
}));
vi.mock("../../config/firestore", () => ({
    storageReference: vi.fn(async (path) => path)
}));
vi.mock("firebase/storage", () => ({
    getDownloadURL: vi.fn(async () => "https://example.test/file")
}));
vi.mock("../file-tree/actions", () => ({
    nonCloudFiles: new Map(),
    addNonCloudFile: (file: unknown) => ({ type: "ADD", file })
}));
afterEach(() => {
    cleanup();
    for (const key of Object.keys(documents)) delete documents[key];
    generated.length = 0;
    nonCloudFiles.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});
function document(id: string, type: IDocument["type"], value = "LPC 1") {
    documents[id] = {
        documentUid: id,
        filename: `${id}.lpc`,
        type,
        currentValue: value,
        savedValue: "older text",
        userUid: "owner",
        path: [],
        isModifiedLocally: true,
        created: 0,
        lastModified: 0
    };
}
const mount = () =>
    renderHook(() =>
        useProjectToolFiles("project", (name) => name.endsWith(".lpc"), {
            checkSize: checkLpcSize
        })
    ).result;
it.each([
    ["Sample Editor", SampleEditor],
    ["Audio Analysis", AudioAnalysis],
    ["Impulse Response", ImpulseResponse],
    ["Convolution Prep", ConvolutionPrep]
])(
    "%s lists binary and generated audio but excludes renamed text and folders",
    (_, Tool) => {
        document("audio", "bin");
        document("renamed", "txt");
        document("folder", "folder");
        for (const value of Object.values(documents))
            value.filename = `${value.documentUid}.wav`;
        document("analysis", "bin");
        generated.push("render.wav", "notes.txt");
        render(<Tool projectUid="project" />);
        expect(
            tool.mock.lastCall?.[0].sources.map((source) => source.id)
        ).toEqual(["audio", "generated:render.wav"]);
    }
);
it("the LPC tool lists both text and binary analyses with its own size limit", async () => {
    document("draft", "txt");
    document("analysis", "bin");
    document("folder", "folder");
    generated.push("render.lpc", "audio.wav");
    render(<ProjectLpc projectUid="project" />);
    const sources = tool.mock.lastCall![0].sources;
    expect(sources.map((source) => source.id)).toEqual([
        "draft",
        "analysis",
        "generated:render.lpc"
    ]);
    expect(
        new TextDecoder().decode(
            await sources[0].load(new AbortController().signal)
        )
    ).toBe("LPC 1");
    nonCloudFiles.set("render.lpc", {
        name: "render.lpc",
        createdAt: new Date(),
        buffer: new Uint8Array(MAX_LPC_BYTES + 1)
    });
    await expect(sources[2].load(new AbortController().signal)).rejects.toThrow(
        "16 MB"
    );
});
it("opens the current text draft, excludes folders, and retains results under a fresh name", async () => {
    document("analysis", "txt");
    document("folder", "folder");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const result = mount();
    expect(result.current.sources.map((source) => source.id)).toEqual([
        "analysis"
    ]);
    const bytes = await result.current.sources[0].load(
        new AbortController().signal
    );
    expect(new TextDecoder().decode(bytes)).toBe("LPC 1");
    expect(fetch).not.toHaveBeenCalled();
    const name = result.current.onSave({ name: "analysis.lpc", data: bytes });
    expect(name).not.toBe("analysis.lpc");
    expect(nonCloudFiles.get(name)?.buffer).toEqual(bytes);
    expect(dispatch).toHaveBeenCalledOnce();
});
it("bounds binary project reads at the LPC limit before reading their bodies", async () => {
    document("large", "bin");
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ cancel });
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
            ok: true,
            body: stream,
            headers: new Headers({
                "content-length": String(MAX_LPC_BYTES + 1)
            })
        }))
    );
    const result = mount();
    await expect(
        result.current.sources[0].load(new AbortController().signal)
    ).rejects.toThrow("16 MB");
    expect(cancel).toHaveBeenCalledOnce();
});
it("checks generated files before copying them", async () => {
    generated.push("large.lpc");
    const buffer = new Uint8Array(MAX_LPC_BYTES + 1);
    const copy = vi.spyOn(buffer, "slice");
    nonCloudFiles.set("large.lpc", {
        name: "large.lpc",
        createdAt: new Date(),
        buffer
    });
    await expect(
        mount().current.sources[0].load(new AbortController().signal)
    ).rejects.toThrow("16 MB");
    expect(copy).not.toHaveBeenCalled();
});
