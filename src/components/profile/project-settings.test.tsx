import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
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
import type { IProject } from "../projects/types";
import { editProject } from "./actions";
import { ProjectModal } from "./project-modal";
import theme from "../../styles/_theme-monokai";

const fixture = vi.hoisted(() => ({
    record: { public: true, name: "Study", description: "A sound study" },
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined)
}));
vi.mock("firebase/firestore", async (original) => ({
    ...(await original<typeof import("firebase/firestore")>()),
    updateDoc: fixture.update,
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
    writeBatch: () => ({ commit: fixture.commit })
}));

beforeEach(() => {
    vi.clearAllMocks();
    fixture.update.mockImplementation(async (_reference, changes) => {
        Object.assign(fixture.record, changes);
    });
    store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "owner" } });
});
afterEach(cleanup);

it.each([
    [true, true],
    [false, false],
    [true, false],
    [false, true]
])(
    "saving project settings preserves cloud visibility (opened public=%s, saved public=%s)",
    async (isPublic, savedVisibility) => {
        const project: IProject = {
            projectUid: "study",
            userUid: "owner",
            name: "Study",
            description: "A sound study",
            isPublic,
            documents: {},
            tags: [],
            stars: {}
        };
        const { properties } = editProject(project);
        if (!properties) throw new Error("Project settings did not open");
        render(
            <Provider store={store}>
                <ThemeProvider
                    theme={createTheme({
                        ...theme,
                        font: { regular: "sans-serif" }
                    })}
                >
                    <ProjectModal
                        name={properties.name}
                        description={properties.description}
                        label={properties.label}
                        projectID={properties.projectID}
                        newProject={properties.newProject}
                        tags={properties.tags}
                        iconName={properties.iconName}
                        iconForegroundColor={properties.iconForegroundColor}
                        iconBackgroundColor={properties.iconBackgroundColor}
                    />
                </ThemeProvider>
            </Provider>
        );
        // Another tab may change visibility while this dialog stays open.
        Object.assign(fixture.record, {
            public: savedVisibility,
            name: project.name,
            description: project.description
        });
        fireEvent.change(screen.getByLabelText("Project name"), {
            target: { value: "Updated study" }
        });
        fireEvent.change(screen.getByLabelText("Description"), {
            target: { value: "Updated description" }
        });
        fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
        await waitFor(() => expect(fixture.commit).toHaveBeenCalledOnce());
        expect(fixture.update).toHaveBeenCalledOnce();
        expect(fixture.update.mock.calls[0][0].path).toBe("projects/study");
        expect(fixture.record).toMatchObject({
            public: savedVisibility,
            name: "Updated study",
            description: "Updated description"
        });
        // A metadata save must not overwrite visibility from an older snapshot.
        expect(fixture.update.mock.calls[0][1]).not.toHaveProperty("public");
    }
);
