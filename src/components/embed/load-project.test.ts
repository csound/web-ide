import { beforeEach, expect, it, vi } from "vitest";
import { getDoc, getDocs } from "firebase/firestore";
import { loadEmbedProject } from "./load-project";

vi.mock("firebase/firestore", async (importOriginal) => ({
    ...(await importOriginal<typeof import("firebase/firestore")>()),
    getDoc: vi.fn(),
    getDocs: vi.fn()
}));

const snapshot = (data: unknown, id = "piece") => ({
    id,
    exists: () => !!data,
    data: () => data
});
const csd = {
    name: "project.csd",
    type: "txt",
    value: "source",
    path: [],
    userUid: "composer"
};

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getDoc)
        .mockResolvedValueOnce(snapshot({ public: true, name: "Etude" }) as any)
        .mockResolvedValueOnce(snapshot(undefined) as any);
    vi.mocked(getDocs).mockResolvedValue({
        docs: [snapshot(csd, "main")]
    } as any);
});

it.each([undefined, { public: false }, { name: "No visibility flag" }])(
    "does not fetch files or targets for unavailable projects (%j)",
    async (data) => {
        vi.mocked(getDoc)
            .mockReset()
            .mockResolvedValue(snapshot(data) as any);
        await expect(loadEmbedProject("piece")).rejects.toThrow(
            "private or no longer exists"
        );
        expect(getDocs).not.toHaveBeenCalled();
        expect(getDoc).toHaveBeenCalledTimes(1);
    }
);

it("loads saved source and uses project.csd without saved targets", async () => {
    const { project, documentUid } = await loadEmbedProject("piece");
    expect(project.name).toBe("Etude");
    expect(project.projectUid).toBe("piece");
    expect(documentUid).toBe("main");
    expect(project.documents.main.currentValue).toBe("source");
});

it.each([
    { targetType: "main", targetDocumentUid: "alternate" },
    { targetType: "playlist", playlistDocumentsUid: ["alternate", "main"] }
])("honors the saved default target (%j)", async (target) => {
    vi.mocked(getDoc)
        .mockReset()
        .mockResolvedValueOnce(snapshot({ public: true }) as any)
        .mockResolvedValueOnce(
            snapshot({
                defaultTarget: "Selected",
                targets: { Selected: target }
            }) as any
        );
    vi.mocked(getDocs).mockResolvedValue({
        docs: [
            snapshot(csd, "main"),
            snapshot({ ...csd, name: "alternate.csd" }, "alternate")
        ]
    } as any);
    expect((await loadEmbedProject("piece")).documentUid).toBe("alternate");
});

it("keeps folders and binary assets for file sync but never selects them as a target", async () => {
    vi.mocked(getDocs).mockResolvedValue({
        docs: [
            snapshot({ ...csd, type: "folder" }, "folder"),
            snapshot({ ...csd, type: "bin", name: "sample.wav" }, "sample"),
            snapshot({ ...csd, name: "PIECE.ORC", path: ["folder"] }, "orc")
        ]
    } as any);
    const result = await loadEmbedProject("piece");
    expect(result.documentUid).toBe("orc");
    expect(Object.keys(result.project.documents)).toHaveLength(3);
    expect(result.project.documents.orc.path).toEqual(["folder"]);
});

it("reports file download errors instead of showing an empty project", async () => {
    vi.mocked(getDocs).mockRejectedValue(new Error("offline"));
    await expect(loadEmbedProject("piece")).rejects.toThrow("offline");
});
