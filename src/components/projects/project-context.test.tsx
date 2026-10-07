import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route, Link } from "react-router";
import { ThemeProvider } from "@emotion/react";
import { store } from "../../store";
import palette from "../../styles/_theme-monokai";
import { activateProject, downloadProjectOnce } from "./actions";
import { ProjectContext } from "./project-context";

vi.mock("./actions", () => ({
    downloadProjectOnce: vi.fn(),
    activateProject: vi.fn(() => async () => {}),
    closeProject: () => () => {}
}));
vi.mock("../file-tree/actions", () => ({
    cleanupNonCloudFiles: () => () => {}
}));
vi.mock("../header/header", () => ({ Header: () => null }));
vi.mock("../project-editor/project-editor", () => ({ default: () => null }));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

function setup() {
    const pending = new Map<string, (value: { exists: boolean }) => void>();
    vi.mocked(downloadProjectOnce).mockImplementation(
        (uid) => () =>
            new Promise((resolve) => {
                pending.set(uid, resolve);
            })
    );
    render(
        <StrictMode>
            <Provider store={store}>
                <ThemeProvider theme={palette}>
                    <MemoryRouter initialEntries={["/editor/first"]}>
                        <Link to="/profile">Leave editor</Link>
                        <Link to="/editor/second">Second project</Link>
                        <Routes>
                            <Route
                                path="/editor/:id"
                                element={<ProjectContext />}
                            />
                            <Route path="/profile" element={<p>Profile</p>} />
                        </Routes>
                    </MemoryRouter>
                </ThemeProvider>
            </Provider>
        </StrictMode>
    );
    return pending;
}

it("does not activate a project whose download finishes after leaving", async () => {
    const pending = setup();
    fireEvent.click(screen.getByText("Leave editor"));
    await act(async () => pending.get("first")!({ exists: true }));
    expect(activateProject).not.toHaveBeenCalled();
    expect(screen.getByText("Profile")).toBeDefined();
});

it("ignores the old download when switching editor routes", async () => {
    const pending = setup();
    fireEvent.click(screen.getByText("Second project"));
    await act(async () => pending.get("second")!({ exists: true }));
    await act(async () => pending.get("first")!({ exists: true }));
    expect(activateProject).toHaveBeenCalledExactlyOnceWith("second");
});

it("activates once after StrictMode replays the loading effect", async () => {
    const pending = setup();
    await act(async () => pending.get("first")!({ exists: true }));
    expect(downloadProjectOnce).toHaveBeenCalledExactlyOnceWith("first");
    expect(activateProject).toHaveBeenCalledExactlyOnceWith("first");
    expect(screen.queryByLabelText("Loading project")).toBeNull();
});
