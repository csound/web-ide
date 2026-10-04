import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen
} from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import palette from "../../styles/_theme-monokai";
import HomeReducer from "./reducer";
import Search from "./search";
import { searchUsers, type UserSearchResponse } from "./user-search-api";

vi.mock("./user-search-api", () => ({ searchUsers: vi.fn() }));
vi.mock("./actions", () => ({
    searchProjects: vi.fn(() => ({ type: "test/search-projects" }))
}));

const response: UserSearchResponse = {
    data: [
        {
            userUid: "ines-id",
            username: "ines",
            displayName: "Inés Valdés",
            bio: "Field recordings and granular synthesis.",
            links: ["https://ines.example/music"],
            photoUrl: ""
        }
    ],
    nextOffset: null
};
beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(searchUsers).mockReset().mockResolvedValue(response);
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
function setup(
    store = configureStore({ reducer: { HomeReducer } }),
    selectUsers = true
) {
    render(
        <Provider store={store}>
            <MemoryRouter>
                <ThemeProvider
                    theme={createTheme({
                        ...palette,
                        font: { regular: "sans-serif", monospace: "monospace" }
                    })}
                >
                    <Search />
                </ThemeProvider>
            </MemoryRouter>
        </Provider>
    );
    if (selectUsers)
        fireEvent.click(
            screen.getByRole("button", { name: "Users", exact: true })
        );
    return screen.getByRole("searchbox", { name: "Search users" });
}
const settle = () =>
    act(async () => {
        await vi.advanceTimersByTimeAsync(300);
    });

it("debounces typing, ignores short queries, and links directly to matching profiles", async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: "i" } });
    await settle();
    expect(searchUsers).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "in" } });
    fireEvent.change(input, { target: { value: "ines" } });
    expect(screen.getByText("Searching users…")).toBeDefined();
    await settle();
    expect(searchUsers).toHaveBeenCalledExactlyOnceWith("ines", 0);
    expect(
        screen
            .getByRole("link", { name: /Inés Valdés @ines/ })
            .getAttribute("href")
    ).toBe("/profile/ines");
    expect(screen.getByText(response.data[0].bio)).toBeDefined();
    expect(screen.getByText("ines.example")).toBeDefined();
});

it("does not show a delayed response after the query changes or clears", async () => {
    let finishOld!: (result: UserSearchResponse) => void;
    vi.mocked(searchUsers).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finishOld = resolve;
            })
    );
    const input = setup();
    fireEvent.change(input, { target: { value: "old" } });
    await settle();
    fireEvent.change(input, { target: { value: "missing" } });
    vi.mocked(searchUsers).mockResolvedValueOnce({
        data: [],
        nextOffset: null
    });
    await settle();
    await act(async () => finishOld(response));
    expect(screen.getByText("No users found")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
    fireEvent.change(input, { target: { value: "" } });
    await settle();
    expect(searchUsers).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("No users found")).toBeNull();
});

it("shows errors with a retry and handles an empty result", async () => {
    vi.mocked(searchUsers).mockRejectedValueOnce({
        code: "functions/resource-exhausted"
    });
    const input = setup();
    fireEvent.change(input, { target: { value: "ines" } });
    await settle();
    expect(screen.getByRole("alert").textContent).toContain("Search is busy");
    vi.mocked(searchUsers).mockResolvedValueOnce({
        data: [],
        nextOffset: null
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await settle();
    expect(screen.getByText("No users found")).toBeDefined();
    expect(
        screen
            .getByRole("button", { name: "Next users" })
            .hasAttribute("disabled")
    ).toBe(true);
});

it("uses server continuation offsets, goes back, and resets paging for a new query", async () => {
    vi.mocked(searchUsers).mockResolvedValue({ ...response, nextOffset: 12 });
    const input = setup();
    fireEvent.change(input, { target: { value: "granular" } });
    await settle();
    fireEvent.click(screen.getByRole("button", { name: "Next users" }));
    await settle();
    expect(searchUsers).toHaveBeenLastCalledWith("granular", 12);
    fireEvent.click(screen.getByRole("button", { name: "Previous users" }));
    await settle();
    expect(searchUsers).toHaveBeenLastCalledWith("granular", 0);
    fireEvent.change(input, { target: { value: "ines" } });
    await settle();
    expect(searchUsers).toHaveBeenLastCalledWith("ines", 0);
});

it("keeps the query while switching modes and cancels pending user searches", async () => {
    const input = setup();
    fireEvent.change(input, { target: { value: "ines" } });
    fireEvent.click(
        screen.getByRole("button", { name: "Projects", exact: true })
    );
    await settle();
    expect(searchUsers).not.toHaveBeenCalled();
    expect(
        (
            screen.getByRole("searchbox", {
                name: "Search projects"
            }) as HTMLInputElement
        ).value
    ).toBe("ines");
    fireEvent.click(screen.getByRole("button", { name: "Users", exact: true }));
    await settle();
    expect(searchUsers).toHaveBeenCalledExactlyOnceWith("ines", 0);
});

it("keeps the user search when returning from a profile", async () => {
    const store = configureStore({ reducer: { HomeReducer } });
    const input = setup(store);
    fireEvent.change(input, { target: { value: "granular" } });
    await settle();
    cleanup();
    const restored = setup(store, false) as HTMLInputElement;
    expect(restored.value).toBe("granular");
    await settle();
    expect(searchUsers).toHaveBeenLastCalledWith("granular", 0);
});
