import { afterEach, expect, it, vi } from "vitest";
import { useState } from "react";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { Provider } from "react-redux";
import { legacy_createStore } from "redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { syntaxTree } from "@codemirror/language";
import { isolateHistory, redo, undo, undoDepth } from "@codemirror/commands";
import theme from "../../styles/_theme-dracula";
import { getFileTypeIconDetails } from "../../elements/filetype-icons";
import Editor, { openEditors } from "./editor";
import { MarkdownPreview } from "./markdown-preview";
import TextEditor from "./text-editor";
import { MarkdownModeToggle, type MarkdownMode } from "./markdown-mode-toggle";
import MobileNavigation from "../project-editor/mobile-navigation";

vi.mock("../../webmcp/provider", () => ({ WebMcpLink: () => null }));

vi.mock("../../store", async () => {
    const { useSelector, useDispatch } = await import("react-redux");
    return { useSelector, useDispatch };
});
vi.mock("../projects/actions", () => ({
    updateDocumentValue: (value: string) => ({ type: "note/replace", value })
}));

afterEach(cleanup);

function fixture(filename: string, currentValue: string) {
    const initialState = {
        ProjectsReducer: {
            projects: {
                project: {
                    documents: { note: { filename, currentValue } }
                }
            }
        }
    };
    const store = legacy_createStore(
        (state = initialState, action: { type: string; value?: string }) => {
            if (!["note/replace", "note/rename"].includes(action.type)) {
                return state;
            }
            const document =
                state.ProjectsReducer.projects.project.documents.note;
            return {
                ProjectsReducer: {
                    projects: {
                        project: {
                            documents: {
                                note: {
                                    ...document,
                                    ...(action.type === "note/rename"
                                        ? { filename: action.value ?? "" }
                                        : { currentValue: action.value ?? "" })
                                }
                            }
                        }
                    }
                }
            };
        }
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
            <ThemeProvider
                theme={createTheme({
                    ...theme,
                    font: { regular: "sans-serif", monospace: "monospace" }
                })}
            >
                {children}
            </ThemeProvider>
        </Provider>
    );
    return { store, wrapper };
}

it.each(["README.md", "notes.markdown", "NOTES.MARKDOWN"])(
    "uses Markdown highlighting and the MD badge for %s",
    (filename) => {
        const { wrapper } = fixture(filename, "# Project notes\n\n**Loud**");
        render(<Editor documentUid="note" projectUid="project" />, { wrapper });
        const view = openEditors.get("note");
        expect(view).toBeDefined();
        expect(syntaxTree(view!.state).toString()).toContain("ATXHeading1");
        expect(getFileTypeIconDetails(filename)).toMatchObject({
            category: "md",
            label: "MD"
        });
    }
);

it("keeps Csound files using the current Csound language", () => {
    const { wrapper } = fixture("main.orc", "instr 1\nendin");
    render(<Editor documentUid="note" projectUid="project" />, { wrapper });
    expect(syntaxTree(openEditors.get("note")!.state).topNode.name).toBe(
        "OrchestraFile"
    );
});

it.each(["voice.mal", "voice.clj", "voice.cljs", "voice.cljc"])(
    "uses Clojure mode and rainbow parentheses for %s, then switches on rename",
    (filename) => {
        const { wrapper, store } = fixture(filename, "(def notes [60 64 67])");
        render(<Editor documentUid="note" projectUid="project" />, { wrapper });
        const view = openEditors.get("note")!;
        expect(syntaxTree(view.state).topNode.name).toBe("Program");
        expect(view.dom.querySelectorAll(".cm-rainbow-0")).toHaveLength(2);
        expect(view.dom.querySelectorAll(".cm-rainbow-1")).toHaveLength(2);
        act(() => store.dispatch({ type: "note/rename", value: "voice.orc" }));
        expect(openEditors.get("note")).toBe(view);
        expect(syntaxTree(view.state).topNode.name).toBe("OrchestraFile");
        expect(view.dom.querySelector('[class*="cm-rainbow-"]')).toBeNull();
    }
);

it("updates the language when an open file is renamed", () => {
    const { wrapper, store } = fixture("main.orc", "# Project notes");
    render(<Editor documentUid="note" projectUid="project" />, { wrapper });
    const view = openEditors.get("note")!;
    expect(syntaxTree(view.state).topNode.name).toBe("OrchestraFile");

    act(() => store.dispatch({ type: "note/rename", value: "NOTES.MARKDOWN" }));
    expect(openEditors.get("note")).toBe(view);
    expect(syntaxTree(view.state).toString()).toContain("ATXHeading1");

    act(() => store.dispatch({ type: "note/rename", value: "main.sco" }));
    expect(openEditors.get("note")).toBe(view);
    expect(syntaxTree(view.state).topNode.name).toBe("ScoreFile");

    act(() => store.dispatch({ type: "note/rename", value: "main.orc" }));
    expect(syntaxTree(view.state).topNode.name).toBe("OrchestraFile");
});

function EditorWithHeaderControl() {
    const [mode, setMode] = useState<MarkdownMode>("preview");
    return (
        <>
            <header>
                <MarkdownModeToggle mode={mode} onChange={setMode} />
            </header>
            <TextEditor
                documentUid="note"
                projectUid="project"
                filename="README.md"
                mode={mode}
            />
        </>
    );
}

it.each(["README.md", "notes.markdown"])(
    "opens %s in preview without adding a toolbar to the document",
    (filename) => {
        const { wrapper } = fixture(filename, "# Project notes");
        const { container } = render(
            <TextEditor
                documentUid="note"
                projectUid="project"
                filename={filename}
            />,
            { wrapper }
        );
        expect(
            screen.getByRole("heading", { name: "Project notes" })
        ).toBeTruthy();
        expect(screen.queryByRole("textbox")).toBeNull();
        expect(container.querySelector("button")).toBeNull();
    }
);

it("fits the Markdown control into the existing mobile navigation row", () => {
    const { wrapper } = fixture("README.md", "# Project notes");
    render(
        <MobileNavigation
            mobileTabIndex={0}
            setMobileTabIndex={vi.fn()}
            editorControl={
                <MarkdownModeToggle mode="preview" onChange={vi.fn()} />
            }
        />,
        { wrapper }
    );
    const control = screen.getByRole("group", { name: "Markdown view" });
    expect(control.closest("footer")?.getAttribute("aria-label")).toBe(
        "Editor footer"
    );
    expect(screen.getByRole("button", { name: "Files" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manual" })).toBeTruthy();
});

it("keeps selection and undo/redo history while toggling preview", () => {
    const original = "# Project notes";
    const { wrapper } = fixture("README.md", original);
    const { container } = render(<EditorWithHeaderControl />, { wrapper });
    const preview = screen.getByRole("button", { name: "Preview Markdown" });
    expect(preview.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(preview);
    expect(preview.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Edit Markdown" }));
    expect(
        screen
            .getByRole("button", { name: "Edit Markdown" })
            .getAttribute("aria-pressed")
    ).toBe("true");
    const view = openEditors.get("note")!;
    act(() =>
        view.dispatch({
            changes: { from: original.length, insert: "\n\nHello!" },
            selection: {
                anchor: original.length + 2,
                head: original.length + 7
            },
            annotations: isolateHistory.of("full")
        })
    );
    const selection = view.state.selection.toJSON();
    const historyDepth = undoDepth(view.state);

    fireEvent.click(screen.getByRole("button", { name: "Preview Markdown" }));
    expect(screen.getByRole("heading", { name: "Project notes" })).toBeTruthy();
    expect(screen.getByText("Hello!", { selector: "p" })).toBeTruthy();
    expect(
        container.querySelector(".cm-editor")?.closest("[hidden]")
    ).toBeTruthy();
    expect(openEditors.get("note")).toBe(view);

    fireEvent.click(screen.getByRole("button", { name: "Edit Markdown" }));
    expect(
        container.querySelector(".cm-editor")?.closest("[hidden]")
    ).toBeNull();
    expect(openEditors.get("note")).toBe(view);
    expect(view.state.selection.toJSON()).toEqual(selection);
    expect(undoDepth(view.state)).toBe(historyDepth);
    act(() => {
        expect(undo(view)).toBe(true);
    });
    expect(view.state.doc.toString()).toBe(original);
    act(() => {
        expect(redo(view)).toBe(true);
    });
    expect(view.state.doc.toString()).toBe(original + "\n\nHello!");
});

it("returns to editing when a previewed file is renamed away from Markdown", () => {
    const { wrapper, store } = fixture("README.md", "# Project notes");
    const { container, rerender } = render(
        <TextEditor
            documentUid="note"
            projectUid="project"
            filename="README.md"
        />,
        { wrapper }
    );
    const view = openEditors.get("note");
    expect(screen.getByRole("heading", { name: "Project notes" })).toBeTruthy();
    act(() => store.dispatch({ type: "note/rename", value: "main.orc" }));
    rerender(
        <TextEditor
            documentUid="note"
            projectUid="project"
            filename="main.orc"
        />
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Project notes" })).toBeNull();
    expect(
        container.querySelector(".cm-editor")?.closest("[hidden]")
    ).toBeNull();
    expect(openEditors.get("note")).toBe(view);
});

it("previews the current document and follows edits", () => {
    const { wrapper, store } = fixture("README.md", "# Project notes");
    render(<MarkdownPreview documentUid="note" projectUid="project" />, {
        wrapper
    });
    expect(screen.getByRole("heading", { name: "Project notes" })).toBeTruthy();
    act(() =>
        store.dispatch({ type: "note/replace", value: "# Updated notes" })
    );
    expect(screen.getByRole("heading", { name: "Updated notes" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Project notes" })).toBeNull();
});

it("does not render raw HTML or JavaScript links from project notes", () => {
    const { wrapper } = fixture(
        "README.md",
        '<script>alert("hello")</script>\n\n[unsafe](javascript:alert%281%29)'
    );
    const { container } = render(
        <MarkdownPreview documentUid="note" projectUid="project" />,
        { wrapper }
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("");
});
