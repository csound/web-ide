import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { legacy_createStore } from "redux";
import { ThemeProvider } from "@emotion/react";
import { syntaxTree } from "@codemirror/language";
import theme from "../../styles/_theme-dracula";
import { getFileTypeIconDetails } from "../../elements/filetype-icons";
import Editor, { openEditors } from "./editor";
import { MarkdownPreview } from "./markdown-preview";

vi.mock("../../store", async () => {
    const { useSelector, useDispatch } = await import("react-redux");
    return { useSelector, useDispatch };
});
vi.mock("../projects/actions", () => ({
    updateDocumentValue: () => ({ type: "document/changed" })
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
        (state = initialState, action: { type: string; value?: string }) =>
            action.type === "note/replace"
                ? {
                      ProjectsReducer: {
                          projects: {
                              project: {
                                  documents: {
                                      note: {
                                          filename,
                                          currentValue: action.value ?? ""
                                      }
                                  }
                              }
                          }
                      }
                  }
                : state
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>
            <ThemeProvider
                theme={{
                    ...theme,
                    font: { regular: "sans-serif", monospace: "monospace" }
                }}
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
