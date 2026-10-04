import { expect, it, vi } from "vitest";
import { Timestamp, type QueryDocumentSnapshot } from "firebase/firestore";
import {
    convertProjectSnapToProject,
    firestoreProjectToIProject
} from "./utils";

const fixtures = vi.hoisted(() => ({ getDoc: vi.fn() }));
vi.mock("firebase/firestore", async (original) => ({
    ...(await original<typeof import("firebase/firestore")>()),
    getDoc: fixtures.getDoc,
    doc: (_collection: unknown, id: string) => ({ id })
}));
vi.mock("@config/firestore", () => ({
    projectLastModified: {},
    storageReference: {}
}));

const data = {
    created: Timestamp.fromMillis(1700000000000),
    name: "Project",
    description: "",
    public: true,
    userUid: "owner",
    iconName: "",
    iconBackgroundColor: "",
    iconForegroundColor: ""
};
it("loads the edit timestamp field used by saved project edits", async () => {
    fixtures.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ timestamp: Timestamp.fromMillis(1800000000000) })
    });
    const snapshot = {
        id: "project",
        data: () => data
    } as QueryDocumentSnapshot;
    const project = await convertProjectSnapToProject(snapshot);
    expect(project.created).toBe(1700000000000);
    expect(project.cachedProjectLastModified).toBe(1800000000000);
});
it("keeps both dates when converting a callable search result", () => {
    const project = firestoreProjectToIProject({
        ...data,
        lastModified: 1800000000000
    });
    expect(project.created).toBe(1700000000000);
    expect(project.cachedProjectLastModified).toBe(1800000000000);
});

it("keeps fork ancestry and converts its date without copying the source name", () => {
    const project = firestoreProjectToIProject({
        ...data,
        forkedFrom: "source",
        forkedAt: Timestamp.fromMillis(1800000000000)
    });
    expect(project.forkedFrom).toBe("source");
    expect(project.forkedAt).toBe(1800000000000);
});
