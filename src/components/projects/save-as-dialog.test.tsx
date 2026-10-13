import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../../store";
import { SaveAsDialog } from "./save-as-dialog";
import { openSaveAs, selectSaveAsSource } from "./save-as-source";
import { openTemporaryDocument } from "../project-editor/temporary-documents";
import { tabOpenByDocumentUid } from "../project-editor/actions";
import { SIGNIN_SUCCESS } from "../login/types";
import { STORE_PROJECT_LOCALLY, ADD_PROJECT_DOCUMENTS } from "./types";
import { type SaveAsEntry, type SaveAsProject } from "./save-as";

const mock = vi.hoisted(() => ({
    list: vi.fn(),
    load: vi.fn(),
    save: vi.fn()
}));
vi.mock("./save-as", async (original) => ({
    ...(await original<typeof import("./save-as")>()),
    listSaveAsProjects: mock.list,
    loadSaveAsDestination: mock.load,
    saveTextAs: mock.save
}));
const source = {
    projectUid: "source",
    filename: "study.csd",
    value: "edited source",
    path: ["voices"]
};
const entries: SaveAsEntry[] = [
    { id: "voices", name: "Voices", type: "folder", path: [] },
    { id: "original", name: "study.csd", type: "txt", path: ["voices"] }
];
const projects: SaveAsProject[] = [
    { id: "source", name: "Sketches", isPublic: false },
    { id: "other", name: "Performance", isPublic: true }
];
beforeEach(() => {
    vi.clearAllMocks();
    mock.list.mockResolvedValue(projects);
    mock.load.mockImplementation(async (_uid, id) => ({
        project: projects.find((p) => p.id === id),
        entries: id === "source" ? entries : []
    }));
    mock.save.mockImplementation(async (_uid, request) => ({
        project: projects.find((project) => project.id === request.projectUid),
        documentUid: "new",
        documents: [
            {
                documentUid: "new",
                filename: request.filename,
                currentValue: request.value,
                savedValue: request.value,
                type: "txt",
                path: request.path,
                userUid: "owner",
                isModifiedLocally: false
            }
        ]
    }));
    store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "owner" } });
    store.dispatch({
        type: STORE_PROJECT_LOCALLY,
        projects: [
            {
                projectUid: "source",
                userUid: "someone-else",
                name: "Sketches",
                documents: {},
                tags: [],
                stars: {}
            }
        ]
    });
    store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid: "source" });
    store.dispatch({
        type: ADD_PROJECT_DOCUMENTS,
        projectUid: "source",
        documents: {
            original: {
                documentUid: "original",
                filename: "study.csd",
                currentValue: "edited source",
                savedValue: "saved source",
                type: "txt",
                path: ["voices"],
                isModifiedLocally: true
            }
        }
    });
});
afterEach(cleanup);
async function setup() {
    const onSubmittingChange = vi.fn();
    render(
        <Provider store={store}>
            <SaveAsDialog
                source={source}
                onSubmittingChange={onSubmittingChange}
            />
        </Provider>
    );
    await waitFor(() =>
        expect(
            (screen.getByLabelText("File name") as HTMLInputElement).value
        ).toBe("study-copy.csd")
    );
    return { onSubmittingChange };
}
async function chooseProject(name: string) {
    const input = screen.getByRole("combobox", { name: "Project" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: name } });
    fireEvent.click(await screen.findByRole("option", { name }));
}
it("opens Save As with unsaved text from a read-only project", async () => {
    await store.dispatch(tabOpenByDocumentUid("original", "source"));
    store.dispatch(openSaveAs());
    expect(store.getState().ModalReducer.properties?.source).toEqual(source);
    expect(
        store.getState().ProjectsReducer.projects.source.documents.original
            .savedValue
    ).toBe("saved source");
});
it("supports temporary examples and excludes non-text tabs", async () => {
    store.dispatch(
        openTemporaryDocument({
            filename: "example.csd",
            value: "temporary text"
        })
    );
    expect(selectSaveAsSource(store.getState())).toEqual({
        projectUid: "source",
        filename: "example.csd",
        value: "temporary text",
        path: []
    });
    store.dispatch({
        type: ADD_PROJECT_DOCUMENTS,
        projectUid: "source",
        documents: {
            audio: { documentUid: "audio", filename: "sample.wav", type: "bin" }
        }
    });
    await store.dispatch(tabOpenByDocumentUid("audio", "source"));
    expect(selectSaveAsSource(store.getState())).toBeUndefined();
});
it("creates nested folders locally, then saves the edited text into them", async () => {
    await setup();
    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    fireEvent.change(screen.getByLabelText("Folder name"), {
        target: { value: "Bass" }
    });
    fireEvent.keyDown(screen.getByLabelText("Folder name"), { key: "Enter" });
    expect(mock.save).not.toHaveBeenCalled();
    expect(
        screen.getByText("New folders are created when you save.")
    ).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save copy" }));
    await waitFor(() => expect(mock.save).toHaveBeenCalledOnce());
    const request = mock.save.mock.calls[0][1];
    expect(request).toMatchObject({
        projectUid: "source",
        filename: "study-copy.csd",
        value: "edited source"
    });
    expect(request.path).toEqual(["voices", request.folders[0].id]);
    expect(request.folders[0]).toMatchObject({
        name: "Bass",
        pending: true,
        path: ["voices"]
    });
    await waitFor(() =>
        expect(selectSaveAsSource(store.getState())?.filename).toBe(
            "study-copy.csd"
        )
    );
    expect(
        store.getState().ProjectsReducer.projects.source.documents.new
            .currentValue
    ).toBe("edited source");
    expect(
        store.getState().ProjectsReducer.projects.source.documents.original
            .savedValue
    ).toBe("saved source");
    expect(
        store.getState().ProjectsReducer.projects.source.documents.original
            .isModifiedLocally
    ).toBe(true);
});
it("blocks name clashes only in the chosen folder and allows navigation to root", async () => {
    await setup();
    fireEvent.change(screen.getByLabelText("File name"), {
        target: { value: "study.csd" }
    });
    expect(
        (screen.getByRole("button", { name: "Save copy" }) as HTMLButtonElement)
            .disabled
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Project root" }));
    expect(
        (screen.getByRole("button", { name: "Save copy" }) as HTMLButtonElement)
            .disabled
    ).toBe(false);
    fireEvent.click(
        within(screen.getByLabelText("Destination contents")).getByRole(
            "button",
            { name: "Voices" }
        )
    );
    expect(screen.getByText(/That name already exists/)).toBeDefined();
});
it("keeps the current project open when saving in another, and warns about public copies", async () => {
    await setup();
    await chooseProject("Performance");
    await screen.findByText(
        "This project is public. Your copy will be public too."
    );
    fireEvent.click(screen.getByRole("button", { name: "Save copy" }));
    const link = await screen.findByRole("link", { name: "Open project" });
    expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Done" })
    );
    expect(link.getAttribute("href")).toBe("/editor/other");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(store.getState().ProjectsReducer.activeProjectUid).toBe("source");
    expect(mock.save).toHaveBeenCalledWith(
        "owner",
        expect.objectContaining({ projectUid: "other", path: [] })
    );
});
it("lets Cancel discard planned folders without making any writes", async () => {
    await setup();
    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    fireEvent.change(screen.getByLabelText("Folder name"), {
        target: { value: "Unused" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(
        screen.getByRole("button", { name: "Cancel", exact: true })
    );
    expect(mock.save).not.toHaveBeenCalled();
    expect(store.getState().ModalReducer.isOpen).toBe(false);
});
it("holds the dialog open during a save, blocks duplicate submits and keeps fields on failure", async () => {
    let reject!: (error: Error) => void;
    mock.save.mockReturnValue(
        new Promise((_, fail) => {
            reject = fail;
        })
    );
    const { onSubmittingChange } = await setup();
    fireEvent.click(screen.getByRole("button", { name: "Save copy" }));
    expect(onSubmittingChange).toHaveBeenLastCalledWith(true);
    expect(
        (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
            .disabled
    ).toBe(true);
    fireEvent.submit(screen.getByLabelText("File name").closest("form")!);
    expect(mock.save).toHaveBeenCalledOnce();
    await act(async () => reject(new Error("Offline. Try again.")));
    expect(screen.getByRole("alert").textContent).toContain(
        "Offline. Try again."
    );
    expect((screen.getByLabelText("File name") as HTMLInputElement).value).toBe(
        "study-copy.csd"
    );
    expect(onSubmittingChange).toHaveBeenLastCalledWith(false);
});
it("ignores stale destination requests when the user switches projects", async () => {
    let resolve!: (value: unknown) => void;
    await setup();
    mock.load.mockImplementation((_uid, id) =>
        id === "other"
            ? new Promise((done) => {
                  resolve = done;
              })
            : Promise.resolve({ project: projects[0], entries })
    );
    await chooseProject("Performance");
    await chooseProject("Sketches");
    await screen.findByText("Only projects you can write to appear here.");
    await act(async () => resolve({ project: projects[1], entries: [] }));
    expect(
        screen.queryByText(
            "This project is public. Your copy will be public too."
        )
    ).toBeNull();
    expect(
        screen.getByRole("combobox", { name: "Project" }).getAttribute("value")
    ).toBe("Sketches");
});
