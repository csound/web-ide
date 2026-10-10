import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ProjectModal } from "./project-modal";
import theme from "../../styles/_theme-monokai";

const fixture = vi.hoisted(() => ({
    dispatch: vi.fn(),
    create: vi.fn(),
    navigate: vi.fn()
}));
vi.mock("../../store/index", () => ({ useDispatch: () => fixture.dispatch }));
vi.mock("../projects/fork-api", () => ({
    createProjectFork: fixture.create
}));
vi.mock("../router/navigate", () => ({ navigateTo: fixture.navigate }));
vi.mock("./actions", () => ({
    addUserProject: vi.fn(),
    editUserProject: vi.fn(),
    PROJECT_STARTER_TEMPLATE_OPTIONS: []
}));
vi.mock("./tag-auto-suggest", () => ({ default: () => null }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function renderDialog() {
    return render(
        <ThemeProvider
            theme={createTheme({ ...theme, font: { regular: "sans-serif" } })}
        >
            <ProjectModal
                name="Study (fork)"
                description="A sound study"
                label="Create fork"
                projectID=""
                newProject={false}
                forkSourceUid="source"
                forkSourceName="Study"
                iconName="default"
                iconForegroundColor="#fff"
                iconBackgroundColor="#112233"
            />
        </ThemeProvider>
    );
}
it("lets the user rename a private fork, blocks duplicate clicks, and opens the completed copy", async () => {
    let complete!: (uid: string) => void;
    fixture.create.mockReturnValueOnce(
        new Promise<string>((resolve) => {
            complete = resolve;
        })
    );
    renderDialog();
    expect(
        screen.getByRole("switch", { name: "Private project" })
    ).toHaveProperty("checked", false);
    expect(screen.queryByText("Starter template")).toBeNull();
    fireEvent.change(screen.getByLabelText("Project name"), {
        target: { value: "  Slow study  " }
    });
    fireEvent.click(screen.getByRole("button", { name: "Create fork" }));
    expect(fixture.create).toHaveBeenCalledWith(
        expect.objectContaining({
            sourceProjectUid: "source",
            name: "Slow study",
            public: false
        })
    );
    fireEvent.click(screen.getByRole("button", { name: "Copying project..." }));
    expect(fixture.create).toHaveBeenCalledOnce();
    await act(async () => complete("fork"));
    expect(fixture.navigate).toHaveBeenCalledWith("/editor/fork");
    expect(fixture.dispatch).toHaveBeenCalledWith({ type: "MODAL_CLOSE" });
});
it("keeps the user's choices and shows an error when the source becomes hidden", async () => {
    fixture.create.mockRejectedValueOnce(
        new Error("This project is hidden or no longer exists.")
    );
    renderDialog();
    fireEvent.click(screen.getByRole("switch", { name: "Private project" }));
    fireEvent.click(screen.getByRole("button", { name: "Create fork" }));
    await waitFor(() =>
        expect(screen.getByRole("alert").textContent).toContain("hidden")
    );
    expect(fixture.create).toHaveBeenCalledWith(
        expect.objectContaining({ public: true })
    );
    expect(screen.getByRole("button", { name: "Create fork" })).toHaveProperty(
        "disabled",
        false
    );
    expect(fixture.navigate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Project name")).toHaveProperty(
        "value",
        "Study (fork)"
    );
});
