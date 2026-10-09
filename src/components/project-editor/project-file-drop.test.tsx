import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { ProjectFileDrop } from "./project-file-drop";

const upload = vi.hoisted(() => vi.fn(() => async () => {}));
vi.mock("../projects/upload-files", () => ({
    uploadProjectFiles: upload,
    PROJECT_FILE_SIZE_LABEL: "2 MB"
}));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
function setup(isOwner = true) {
    const store = configureStore({ reducer: () => ({}) });
    return render(
        <Provider store={store}>
            <ProjectFileDrop
                projectUid="project"
                projectName="Sound study"
                isOwner={isOwner}
            />
            <div data-testid="editor">
                <span data-testid="child">Code</span>
            </div>
            <iframe title="Manual" />
        </Provider>
    );
}
function drag(
    target: EventTarget,
    type: string,
    files: File[] = [],
    types = ["Files"]
) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
        value: { types, files, items: [], dropEffect: "none" }
    });
    Object.defineProperty(event, "relatedTarget", { value: document.body });
    act(() => {
        target.dispatchEvent(event);
    });
    return event;
}
it("keeps a fixed overlay across nested elements, then uploads all files once", async () => {
    setup();
    const editor = screen.getByTestId("editor"),
        child = screen.getByTestId("child");
    const childDrop = vi.fn();
    child.addEventListener("drop", childDrop);
    drag(editor, "dragenter");
    drag(child, "dragenter");
    drag(editor, "dragleave");
    expect(screen.getByText("Drop files to upload")).toBeDefined();
    const files = [
        new File(["instr 1"], "study.csd"),
        new File(["sample"], "sample.wav")
    ];
    const event = drag(child, "drop", files);
    expect(event.defaultPrevented).toBe(true);
    expect(childDrop).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith("project", files, expect.any(Function));
    await waitFor(() =>
        expect(screen.queryByText("Drop files to upload")).toBeNull()
    );
});
it("does not consume text or internal tree drags", () => {
    setup();
    expect(drag(window, "dragenter", [], ["text/plain"]).defaultPrevented).toBe(
        false
    );
    expect(drag(window, "drop", [], ["text/plain"]).defaultPrevented).toBe(
        false
    );
    expect(screen.queryByRole("status")).toBeNull();
    expect(upload).not.toHaveBeenCalled();
});
it.each([true, false])(
    "lets local audio tools receive files without uploading (owner: %s)",
    (isOwner) => {
        setup(isOwner);
        const editor = screen.getByTestId("editor");
        editor.setAttribute("data-local-file-drop", "");
        const child = screen.getByTestId("child");
        const receive = vi.fn();
        child.addEventListener("drop", receive);
        drag(window, "dragenter");
        drag(child, "dragover");
        expect(screen.queryByRole("status")).toBeNull();
        drag(child, "drop", [new File(["sample"], "sample.wav")]);
        expect(receive).toHaveBeenCalledOnce();
        expect(upload).not.toHaveBeenCalled();
    }
);
it("blocks visitor drops without letting the browser open files", () => {
    setup(false);
    drag(window, "dragenter");
    expect(screen.getByText("This project is read-only")).toBeDefined();
    expect(
        drag(window, "drop", [new File(["x"], "x.csd")]).defaultPrevented
    ).toBe(true);
    expect(upload).not.toHaveBeenCalled();
});
it("clears on leave, Escape, blur, and unmount", () => {
    const view = setup();
    drag(window, "dragenter");
    drag(window, "dragleave", [], []);
    expect(screen.queryByRole("status")).toBeNull();
    drag(window, "dragenter");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("status")).toBeNull();
    drag(window, "dragenter");
    fireEvent.blur(window);
    expect(screen.queryByRole("status")).toBeNull();
    drag(window, "dragenter");
    view.unmount();
    expect(
        drag(window, "drop", [new File(["x"], "x.csd")]).defaultPrevented
    ).toBe(false);
});
it("handles drops inside the manual iframe, including after navigation", async () => {
    setup();
    const frame = screen.getByTitle("Manual") as HTMLIFrameElement;
    fireEvent.load(frame);
    drag(frame.contentWindow!, "dragenter");
    expect(screen.getByText("Drop files to upload")).toBeDefined();
    drag(frame.contentWindow!, "drop", [new File(["x"], "manual.csd")]);
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
});
