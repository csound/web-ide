import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor
} from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../../store";
import ThemeProvider from "../../styles/theme-provider";
import ShareDialog from "./index";
import { projectShareLinks } from "./embed-code";

vi.mock("firebase/firestore", async (importOriginal) => ({
    ...(await importOriginal<typeof import("firebase/firestore")>()),
    getDoc: vi.fn(async () => {
        throw new Error("profile unavailable");
    })
}));

const show = (isPublic = true) => {
    store.dispatch({
        type: "PROJECTS.STORE_PROJECT_LOCALLY",
        projects: [
            {
                projectUid: "share-test",
                name: 'A "quoted" <study> & more',
                isPublic,
                userUid: "composer",
                documents: {}
            }
        ]
    });
    store.dispatch({
        type: "PROJECTS.ACTIVATE_PROJECT",
        projectUid: "share-test"
    });
    return render(
        <Provider store={store}>
            <ThemeProvider>
                <ShareDialog />
            </ThemeProvider>
        </Provider>
    );
};
beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: vi.fn(async () => undefined) }
    });
});
afterEach(() => {
    cleanup();
    store.dispatch({
        type: "PROJECTS.UNSET_PROJECT",
        projectUid: "share-test"
    });
});

it("escapes project titles and preserves the current host in the iframe HTML", () => {
    const result = projectShareLinks("https://preview.example", {
        projectUid: "a&b",
        name: '"><img src=x onerror=alert(1)>'
    });
    const element = document.createElement("div");
    element.innerHTML = result.embedCode;
    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild?.tagName).toBe("IFRAME");
    expect(element.firstElementChild?.getAttribute("title")).toBe(
        '"><img src=x onerror=alert(1)>'
    );
    expect(result.embedUrl).toBe("https://preview.example/embed/a%26b");
    expect(element.querySelector("iframe")?.getAttribute("allow")).toBe(
        "autoplay"
    );
});

it("copies the embed code even if the author profile cannot load", async () => {
    show();
    const code = (
        screen.getByLabelText("HTML embed code") as HTMLTextAreaElement
    ).value;
    fireEvent.click(screen.getByRole("button", { name: "Copy embed code" }));
    await waitFor(() =>
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code)
    );
    expect((await screen.findByRole("status")).textContent).toBe(
        "Copied to clipboard."
    );
});

it("keeps code selectable when clipboard access fails", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
        new Error("denied")
    );
    show();
    fireEvent.click(screen.getByRole("button", { name: "Copy embed code" }));
    await waitFor(() =>
        expect(screen.getByRole("status").textContent).toContain(
            "Select the text"
        )
    );
    const code = screen.getByLabelText(
        "HTML embed code"
    ) as HTMLTextAreaElement;
    fireEvent.focus(code);
    expect(code.selectionEnd).toBe(code.value.length);
});

it("does not offer an embed for a private project", () => {
    show(false);
    expect(screen.queryByLabelText("HTML embed code")).toBeNull();
    expect(screen.getByText(/Make this project public/)).toBeTruthy();
});
