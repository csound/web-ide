import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { Provider } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { store } from "../../store";
import { SIGNIN_SUCCESS } from "../login/types";
import { ProjectModal } from "./project-modal";
import { PROJECT_STARTER_TEMPLATE_OPTIONS } from "../../csound-templates/starters";
import theme from "../../styles/_theme-monokai";

const fixture = vi.hoisted(() => ({
    set: vi.fn(),
    commit: vi.fn(),
    navigate: vi.fn()
}));
vi.mock("firebase/firestore", async (original) => ({
    ...(await original<typeof import("firebase/firestore")>()),
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
    writeBatch: () => ({ set: fixture.set, commit: fixture.commit })
}));
vi.mock("../router/navigate", () => ({ navigateTo: fixture.navigate }));
vi.mock("./tag-auto-suggest", () => ({ default: () => null }));

beforeEach(() => {
    vi.clearAllMocks();
    fixture.commit.mockResolvedValue(undefined);
    store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "owner" } });
});
afterEach(cleanup);

function renderDialog() {
    return render(
        <Provider store={store}>
            <ThemeProvider
                theme={createTheme({
                    ...theme,
                    font: { regular: "sans-serif" }
                })}
            >
                <ProjectModal
                    name="New project"
                    description=""
                    label="Create project"
                    projectID=""
                    newProject
                    iconName="default"
                    iconForegroundColor="#fff"
                    iconBackgroundColor="#000"
                />
            </ThemeProvider>
        </Provider>
    );
}

it.each(PROJECT_STARTER_TEMPLATE_OPTIONS)(
    "creates $label files and selects the CSD as its run target",
    async (template) => {
        renderDialog();
        fireEvent.change(screen.getByLabelText("Project name"), {
            target: { value: "  Sound study  " }
        });
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        const choice = () =>
            screen.getByRole("radio", {
                name: `${template.label} ${template.description}`
            });
        fireEvent.click(choice());
        expect(screen.getByText(template.guide)).toBeTruthy();
        expect(
            screen.getByText(template.files.map((file) => file.name).join(", "))
        ).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(choice()).toHaveProperty("checked", true);
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("button", { name: "Create project" }));
        await waitFor(() => expect(fixture.navigate).toHaveBeenCalledOnce());
        const project = fixture.set.mock.calls.find(([reference]) =>
            /^projects\/[^/]+$/.test(reference.path)
        );
        expect(project?.[1]).toMatchObject({
            name: "Sound study",
            userUid: "owner"
        });
        const files = fixture.set.mock.calls.filter(([reference]) =>
            reference.path.includes("/files/")
        );
        expect(files.map(([, data]) => data)).toEqual(
            template.files.map((file) => ({
                ...file,
                path: [],
                userUid: "owner"
            }))
        );
        const csd = files.find(([, data]) => data.name === "project.csd");
        const target = fixture.set.mock.calls.find(
            ([reference]) => reference.path === `targets/${project?.[0].id}`
        );
        expect(target?.[1]).toMatchObject({
            defaultTarget: "project.csd",
            targets: {
                "project.csd": {
                    targetDocumentUid: csd?.[0].id,
                    targetType: "main"
                }
            }
        });
        expect(fixture.navigate).toHaveBeenCalledWith(
            `/editor/${project?.[0].id}`
        );
    }
);

it("keeps the chosen template after a failed write and blocks duplicate submissions", async () => {
    let reject!: (error: Error) => void;
    fixture.commit.mockReturnValueOnce(
        new Promise((_, rejectPromise) => {
            reject = rejectPromise;
        })
    );
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
        renderDialog();
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("radio", { name: /MIDI instrument/ }));
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("button", { name: "Create project" }));
        expect(screen.getByRole("button", { name: "Back" })).toHaveProperty(
            "disabled",
            true
        );
        expect(
            screen.getByRole("button", { name: "Starter template" })
        ).toHaveProperty("disabled", true);
        fireEvent.click(screen.getByRole("button", { name: "Creating..." }));
        expect(fixture.commit).toHaveBeenCalledOnce();
        await act(async () => reject(new Error("offline")));
        expect(screen.getByRole("alert").textContent).toContain(
            "Could not create the project"
        );
        expect(fixture.navigate).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(
            screen.getByRole("radio", { name: /MIDI instrument/ })
        ).toHaveProperty("checked", true);
        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        fireEvent.click(screen.getByRole("button", { name: "Create project" }));
        await waitFor(() => expect(fixture.navigate).toHaveBeenCalledOnce());
    } finally {
        log.mockRestore();
    }
});
