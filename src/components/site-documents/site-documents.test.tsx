import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import light from "../../styles/_theme-github-light";
import { SiteDocuments } from "./site-documents";
import { loadArticle } from "./content";
vi.mock("../header/header", () => ({
    Header: () => <header>Csound Web-IDE</header>
}));
vi.mock("./content", async (original) => {
    const actual = await original<typeof import("./content")>();
    return { ...actual, loadArticle: vi.fn(actual.loadArticle) };
});
const theme = createTheme({
    ...light,
    font: { regular: "Poppins, sans-serif", monospace: "Fira Mono, monospace" }
});
function open(path = "/documentation") {
    return render(
        <ThemeProvider theme={theme}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="documentation/*" element={<SiteDocuments />} />
                </Routes>
            </MemoryRouter>
        </ThemeProvider>
    );
}
beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal("CSS", { escape: (value: string) => value });
});
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

it("opens README from contents, renders its outline, and follows a relative link", async () => {
    open();
    await screen.findByRole("heading", { name: "Hear a project" });
    fireEvent.click(
        within(
            screen.getByRole("navigation", { name: "Guide contents" })
        ).getByRole("link", { name: "README and project notes" })
    );
    await screen.findByRole("heading", { name: "What opens first" });
    const outline = screen.getByRole("complementary", { name: "On this page" });
    expect(
        within(outline)
            .getByRole("link", { name: "What opens first" })
            .getAttribute("href")
    ).toBe("#what-opens-first");
    expect(within(outline).queryByText("Before you play")).toBeNull();
    const article = screen.getByRole("main");
    expect(article).toBe(document.activeElement);
    fireEvent.click(
        within(article).getByRole("link", { name: "Files and saving" })
    );
    await screen.findByRole("heading", {
        name: "Generated files need one more step"
    });
    expect(within(screen.getByRole("main")).getByRole("table")).toBeTruthy();
});

it("filters contents and recovers from an empty search", async () => {
    open();
    const input = screen.getByRole("searchbox", { name: "Find an article" });
    fireEvent.change(input, { target: { value: "no-such-topic" } });
    expect(await screen.findByText(/No articles match/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    fireEvent.change(input, { target: { value: "WebMCP" } });
    expect(
        within(
            screen.getByRole("navigation", { name: "Guide contents" })
        ).getAllByRole("link")
    ).toHaveLength(1);
});

it("keeps the old WebMCP anchor working as a subpage", async () => {
    open("/documentation#webmcp");
    await screen.findByRole("heading", { name: "Connect an agent" });
    expect(document.title).toBe("WebMCP | Csound Web-IDE Guide");
});

it("shows a retry after loading fails", async () => {
    vi.mocked(loadArticle).mockRejectedValueOnce(new Error("offline"));
    open("/documentation/tools/mixer");
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("heading", { name: "Balance the mix" });
});

it("discards a late article response after navigating away", async () => {
    let resolve!: (text: string) => void;
    vi.mocked(loadArticle).mockImplementationOnce(
        () =>
            new Promise((done) => {
                resolve = done;
            })
    );
    open("/documentation/tools/mixer");
    fireEvent.click(
        within(
            screen.getByRole("navigation", { name: "Guide contents" })
        ).getByRole("link", { name: "README and project notes" })
    );
    await screen.findByRole("heading", { name: "What opens first" });
    resolve("# Late mixer response");
    await waitFor(() =>
        expect(screen.queryByText("Late mixer response")).toBeNull()
    );
});

it("offers a way back from an unknown article", () => {
    open("/documentation/no-such-article");
    expect(
        screen.getByRole("heading", { name: "Article not found" })
    ).toBeTruthy();
    expect(
        screen
            .getByRole("link", { name: "start with the guide" })
            .getAttribute("href")
    ).toBe("/documentation");
});

it("copies a code example and reports clipboard failures", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    open("/documentation/projects/readme");
    fireEvent.click(await screen.findByRole("button", { name: "Copy code" }));
    await screen.findByRole("button", { name: "Copied" });
    expect(writeText.mock.calls[0][0]).toContain("# Window study");
    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(screen.getByRole("button", { name: "Copied" }));
    await screen.findByRole("button", {
        name: "Copy failed. Select and copy the code."
    });
});
