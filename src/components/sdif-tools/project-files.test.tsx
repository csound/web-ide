import { afterEach, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import type { IDocument } from "../projects/types";
import { nonCloudFiles } from "../file-tree/actions";
import { useProjectToolFiles } from "../audio-tools/project-files";
import { checkSdifSize, MAX_SDIF_BYTES } from "./format";
const { documents, generated, dispatch } = vi.hoisted(() => ({
    documents: {} as Record<string, IDocument>,
    generated: [] as string[],
    dispatch: vi.fn()
}));
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
function document(id: string, type: IDocument["type"], value = "SDIF 1") {
    documents[id] = {
        documentUid: id,
        filename: `${id}.sdif`,
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
        useProjectToolFiles(
            "project",
            (name) => name.endsWith(".sdif"),
            checkSdifSize
        )
    ).result;
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
    expect(new TextDecoder().decode(bytes)).toBe("SDIF 1");
    expect(fetch).not.toHaveBeenCalled();
    const name = result.current.onSave({ name: "analysis.sdif", data: bytes });
    expect(name).not.toBe("analysis.sdif");
    expect(nonCloudFiles.get(name)?.buffer).toEqual(bytes);
    expect(dispatch).toHaveBeenCalledOnce();
});
it("bounds binary project reads at the SDIF limit before reading their bodies", async () => {
    document("large", "bin");
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ cancel });
    vi.stubGlobal(
        "fetch",
        vi.fn(async () => ({
            ok: true,
            body: stream,
            headers: new Headers({
                "content-length": String(MAX_SDIF_BYTES + 1)
            })
        }))
    );
    const result = mount();
    await expect(
        result.current.sources[0].load(new AbortController().signal)
    ).rejects.toThrow("32 MB");
    expect(cancel).toHaveBeenCalledOnce();
});
it("checks generated files before copying them", async () => {
    generated.push("large.sdif");
    const buffer = new Uint8Array(MAX_SDIF_BYTES + 1);
    const copy = vi.spyOn(buffer, "slice");
    nonCloudFiles.set("large.sdif", {
        name: "large.sdif",
        createdAt: new Date(),
        buffer
    });
    await expect(
        mount().current.sources[0].load(new AbortController().signal)
    ).rejects.toThrow("32 MB");
    expect(copy).not.toHaveBeenCalled();
});
