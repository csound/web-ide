import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProjectDates } from "./project-dates";

afterEach(cleanup);
it("labels both dates and provides the exact saved timestamps", () => {
    const created = Date.UTC(2024, 2, 18, 12);
    const edited = Date.UTC(2026, 9, 4, 10);
    const { container } = render(
        <ProjectDates project={{ created, lastModified: edited }} />
    );
    expect(screen.getByText(/Created/)).toBeDefined();
    expect(screen.getByText(/Last edited/)).toBeDefined();
    expect(
        [...container.querySelectorAll("time")].map((node) => node.dateTime)
    ).toEqual([
        new Date(created).toISOString(),
        new Date(edited).toISOString()
    ]);
});
it("uses the profile's saved edit date and omits unavailable history", () => {
    const { container } = render(
        <ProjectDates project={{ cachedProjectLastModified: 123000 }} />
    );
    expect(screen.queryByText(/Created/)).toBeNull();
    expect(screen.getByText(/Last edited/)).toBeDefined();
    expect(container.querySelector("time")?.dateTime).toBe(
        new Date(123000).toISOString()
    );
});
it("renders no date strip when neither date is known", () => {
    const { container } = render(<ProjectDates project={{}} />);
    expect(container.textContent).toBe("");
    expect(container.querySelector("div")).toBeNull();
});
