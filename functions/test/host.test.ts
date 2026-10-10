// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import indexHTML from "../../index.html?raw";
import { host } from "../src/host";

const mocks = vi.hoisted(() => ({
    readFile: vi.fn(),
    projectDoc: vi.fn(),
    profileDoc: vi.fn(),
    projectGet: vi.fn(),
    profileGet: vi.fn()
}));

vi.mock("node:fs", () => ({
    default: { readFileSync: mocks.readFile }
}));
vi.mock("firebase-admin/firestore", () => ({
    getFirestore: () => ({
        collection: (name: string) => {
            if (name === "projects") return { doc: mocks.projectDoc };
            if (name === "profiles") return { doc: mocks.profileDoc };
            throw new Error(`Unexpected collection: ${name}`);
        }
    })
}));

const project = {
    public: true,
    userUid: "author-1",
    name: "Public project",
    description: "A short composition"
};
const profile = {
    username: "author",
    displayName: "An author",
    photoUrl: "https://example.test/avatar.png"
};

function projectRecord(data: Record<string, unknown> | undefined) {
    mocks.projectGet.mockResolvedValue({
        exists: data !== undefined,
        data: () => data
    });
}

async function request(path = "/editor/project-1", userAgent = "Googlebot") {
    const response = {
        status: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis()
    };
    await host(
        { path, headers: { "user-agent": userAgent } } as Parameters<
            typeof host
        >[0],
        response as unknown as Parameters<typeof host>[1]
    );
    return response;
}

beforeEach(() => {
    vi.resetAllMocks();
    mocks.readFile.mockReturnValue(Buffer.from(indexHTML));
    mocks.projectDoc.mockReturnValue({ get: mocks.projectGet });
    mocks.profileDoc.mockReturnValue({ get: mocks.profileGet });
    projectRecord(project);
    mocks.profileGet.mockResolvedValue({ exists: true, data: () => profile });
});

describe("host project privacy", () => {
    it.each([false, undefined, null, "true", 1])(
        "withholds metadata when public is %j",
        async (visibility) => {
            projectRecord({ ...project, public: visibility });
            const response = await request();

            expect(response.status).toHaveBeenCalledWith(404);
            expect(response.send).toHaveBeenCalledWith();
            expect(mocks.profileDoc).not.toHaveBeenCalled();
        }
    );

    it("gives missing and private projects the same response", async () => {
        projectRecord(undefined);
        const missing = await request();
        projectRecord({ ...project, public: false });
        const privateProject = await request();

        expect(missing.status).toHaveBeenCalledWith(404);
        expect(privateProject.status.mock.calls).toEqual(
            missing.status.mock.calls
        );
        expect(privateProject.send.mock.calls).toEqual(missing.send.mock.calls);
        expect(mocks.profileDoc).not.toHaveBeenCalled();
    });

    it.each(["/editor", "/editor/"])(
        "rejects a missing project ID at %s without reading Firestore",
        async (path) => {
            const response = await request(path);
            expect(response.status).toHaveBeenCalledWith(404);
            expect(mocks.projectDoc).not.toHaveBeenCalled();
        }
    );

    it("withholds metadata when the author profile is missing", async () => {
        mocks.profileGet.mockResolvedValue({
            exists: false,
            data: () => undefined
        });
        const response = await request();
        expect(response.status).toHaveBeenCalledWith(404);
        expect(response.send).toHaveBeenCalledWith();
    });

    it.each([undefined, "", 1])(
        "rejects invalid author ID %j without reading a profile",
        async (userUid) => {
            projectRecord({ ...project, userUid });
            const response = await request();
            expect(response.status).toHaveBeenCalledWith(404);
            expect(mocks.profileDoc).not.toHaveBeenCalled();
        }
    );

    it("rechecks visibility after a public project becomes private", async () => {
        const publicResponse = await request();
        projectRecord({ ...project, public: false });
        const privateResponse = await request();

        expect(publicResponse.status).toHaveBeenCalledWith(200);
        expect(privateResponse.status).toHaveBeenCalledWith(404);
        expect(privateResponse.send).toHaveBeenCalledWith();
        expect(mocks.projectGet).toHaveBeenCalledTimes(2);
        expect(mocks.profileGet).toHaveBeenCalledTimes(1);
    });

    it.each([true, false])(
        "prevents caching metadata responses for public=%s",
        async (visibility) => {
            projectRecord({ ...project, public: visibility });
            const response = await request();
            expect(response.set).toHaveBeenCalledWith(
                "Cache-Control",
                "private, no-store"
            );
        }
    );

    it("serves the app shell to a normal browser without reading project data", async () => {
        const response = await request(
            "/editor/project-1",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.send.mock.calls[0][0]).not.toContain(
            "functions-insert-dynamic-og"
        );
        expect(mocks.projectDoc).not.toHaveBeenCalled();
    });
});

describe("host metadata HTML", () => {
    it("adds public metadata to the real app template", async () => {
        const response = await request();
        const document = new JSDOM(response.send.mock.calls[0][0]).window
            .document;

        expect(response.status).toHaveBeenCalledWith(200);
        expect(mocks.projectDoc).toHaveBeenCalledWith("project-1");
        expect(mocks.profileDoc).toHaveBeenCalledWith("author-1");
        expect(
            document
                .querySelector('meta[property="og:title"]')
                ?.getAttribute("content")
        ).toBe("An author - Public project");
        expect(
            document
                .querySelector('meta[property="og:url"]')
                ?.getAttribute("content")
        ).toBe("https://ide.csound.com/editor/project-1");
        expect(
            document.querySelector('meta[name="functions-insert-dynamic-og"]')
        ).toBeNull();
    });

    it.each([
        '<meta name="functions-insert-dynamic-og"/>',
        '<meta name="functions-insert-dynamic-og">'
    ])("also replaces the compact marker %s", async (marker) => {
        mocks.readFile.mockReturnValue(
            Buffer.from(`<html><head>${marker}</head><body></body></html>`)
        );
        const response = await request();
        expect(response.send.mock.calls[0][0]).toContain('property="og:title"');
        expect(response.send.mock.calls[0][0]).not.toContain(
            "functions-insert-dynamic-og"
        );
    });

    it("preserves quotes, ampersands, angle brackets and replacement symbols as plain text", async () => {
        const name = 'A "quoted" & <named> composition';
        const description = "An author's $& score with $` and $' symbols";
        const displayName = 'An "author" & <composer>';
        const photoUrl =
            'https://example.test/photo?label="portrait"&name=author';
        projectRecord({ ...project, name, description });
        mocks.profileGet.mockResolvedValue({
            exists: true,
            data: () => ({ ...profile, displayName, photoUrl })
        });
        // Keep this fixture independent of whitespace in the app template.
        mocks.readFile.mockReturnValue(
            Buffer.from(
                '<html><head><meta name="functions-insert-dynamic-og"/></head><body></body></html>'
            )
        );
        const response = await request();
        const html = response.send.mock.calls[0][0];
        const document = new JSDOM(html).window.document;
        const metadata = (property: string) =>
            document
                .querySelector(`meta[property="${property}"]`)
                ?.getAttribute("content");

        expect(metadata("og:title")).toBe(`${displayName} - ${name}`);
        expect(metadata("og:description")).toBe(description);
        expect(metadata("og:image")).toBe(photoUrl);
        expect(document.head.children).toHaveLength(6);
        for (const meta of document.head.children) {
            expect(meta.tagName).toBe("META");
            expect(meta.getAttributeNames().sort()).toEqual([
                "content",
                "property"
            ]);
        }
        expect(html).toContain("&quot;");
        expect(html).toContain("&amp;");
        expect(html).toContain("&lt;");
        expect(html).toContain("&gt;");
        expect(html).toContain("&#39;");
        expect(document.body.children).toHaveLength(0);
    });
});
