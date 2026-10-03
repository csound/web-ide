import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import TagAutosuggest from "./tag-auto-suggest";

const store = configureStore({
    reducer: () => ({
        LoginReducer: { loggedInUid: "artist" },
        ProfileReducer: {
            profiles: { artist: { allTags: ["ambient", "live"] } }
        }
    })
});

function Tags() {
    const [tags, setTags] = useState<string[]>([]);
    return (
        <>
            <TagAutosuggest modifiedTags={tags} setModifiedTags={setTags} />
            <output aria-label="Selected tags">{tags.join(",")}</output>
        </>
    );
}

afterEach(cleanup);

describe("project tags", () => {
    it("lets artists reuse a suggested tag and remove it", () => {
        render(
            <Provider store={store}>
                <Tags />
            </Provider>
        );
        const input = screen.getByRole("combobox", { name: "Tags" });
        fireEvent.change(input, { target: { value: "amb" } });
        fireEvent.click(screen.getByRole("option", { name: "ambient" }));
        expect(screen.getByLabelText("Selected tags").textContent).toBe(
            "ambient"
        );
        fireEvent.keyDown(input, { key: "Backspace" });
        expect(screen.getByLabelText("Selected tags").textContent).toBe("");
    });

    it("trims new tags and avoids empty or duplicate tags", () => {
        render(
            <Provider store={store}>
                <Tags />
            </Provider>
        );
        const input = screen.getByRole("combobox", { name: "Tags" });
        for (const value of ["  drone  ", "drone", "   "]) {
            fireEvent.change(input, { target: { value } });
            fireEvent.keyDown(input, { key: "Enter" });
        }
        expect(screen.getByLabelText("Selected tags").textContent).toBe(
            "drone"
        );
    });
});
