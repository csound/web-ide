import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { ForkAttribution } from "./fork-attribution";

const fixture = vi.hoisted(() => ({
    listeners: [] as {
        next: (snapshot: unknown) => void;
        error: (error: unknown) => void;
        stop: ReturnType<typeof vi.fn>;
    }[]
}));
vi.mock("../../config/firestore", () => ({ projects: {} }));
vi.mock("firebase/firestore", () => ({
    doc: (_collection: unknown, id: string) => ({ id }),
    onSnapshot: (
        _ref: unknown,
        _options: unknown,
        next: (snapshot: unknown) => void,
        error: (error: unknown) => void
    ) => {
        const stop = vi.fn();
        fixture.listeners.push({ next, error, stop });
        return stop;
    }
}));
beforeEach(() => {
    fixture.listeners.length = 0;
});
afterEach(cleanup);
const view = (id = "source") => (
    <MemoryRouter>
        <ForkAttribution forkedFrom={id} forkedAt={1700000000000} />
    </MemoryRouter>
);
const emit = (data: unknown, fromCache = false, hasPendingWrites = false) =>
    act(() =>
        fixture.listeners.at(-1)!.next({
            data: () => data,
            metadata: { fromCache, hasPendingWrites }
        })
    );

it("shows a link only after the server confirms the source is public", () => {
    render(view());
    emit({ name: "Old name", public: true }, true);
    expect(screen.queryByText("Old name")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    emit({ name: "Granular study", public: true });
    expect(
        screen
            .getByRole("link", { name: "Granular study" })
            .getAttribute("href")
    ).toBe("/editor/source");
    expect(screen.getByTitle(/Forked from Granular study on/)).toBeTruthy();
});
it.each([false, undefined])(
    "replaces the name and link when visibility becomes %s",
    (visibility) => {
        const { container } = render(view());
        emit({ name: "Granular study", public: true });
        emit(
            visibility === undefined
                ? undefined
                : { name: "Secret name", public: false }
        );
        expect(container.textContent).toBe("Forked from 'hidden project'");
        expect(container.innerHTML).not.toContain("Secret name");
        expect(container.innerHTML).not.toContain("Granular study");
        expect(screen.queryByRole("link")).toBeNull();
    }
);
it("removes the old name if Firestore revokes access", () => {
    render(view());
    emit({ name: "Granular study", public: true });
    act(() => fixture.listeners[0].error({ code: "permission-denied" }));
    expect(screen.getByText("Forked from 'hidden project'")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
});
it("does not expose a pending local change to public visibility", () => {
    render(view());
    emit({ name: "Private draft", public: true }, false, true);
    expect(screen.queryByText("Private draft")).toBeNull();
});
it("drops old ancestry on navigation and cleans up subscriptions", () => {
    const { rerender, unmount } = render(view());
    emit({ name: "Granular study", public: true });
    rerender(view("second"));
    expect(fixture.listeners[0].stop).toHaveBeenCalledOnce();
    expect(screen.queryByRole("link")).toBeNull();
    act(() => fixture.listeners[1].error({ code: "unavailable" }));
    expect(screen.getByText("Forked from an unavailable project")).toBeTruthy();
    unmount();
    expect(fixture.listeners[1].stop).toHaveBeenCalledOnce();
});
it("adds no label or reads for a project without fork history", () => {
    const { container } = render(<ForkAttribution />);
    expect(container.textContent).toBe("");
    expect(fixture.listeners).toHaveLength(0);
});
it("checks visibility again when returning to an earlier source", () => {
    const { rerender } = render(view());
    emit({ name: "Old public name", public: true });
    rerender(view("second"));
    rerender(view());
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("Old public name")).toBeNull();
});
