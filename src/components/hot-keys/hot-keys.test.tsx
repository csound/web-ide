import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import HotKeys from "./hot-keys";
import HotKeysReducer from "./reducer";
import { keyboardCallbacks } from "./index";

// iPadOS desktop mode and macOS use the Apple key bindings.
vi.hoisted(() => {
    Object.defineProperty(navigator, "platform", {
        configurable: true,
        value: "MacIntel"
    });
});

afterEach(() => {
    cleanup();
    keyboardCallbacks.clear();
});

describe.each(["Control", "Meta"])(
    "%s shortcuts on Apple devices",
    (modifier) => {
        it.each([
            ["s", false, "save_document"],
            ["s", true, "save_all_documents"],
            ["r", false, "run_project"],
            ["p", false, "pause_playback"]
        ] as const)(
            "handles %s (shift: %s) inside an editor",
            (key, shiftKey, command) => {
                const callback = vi.fn((event: KeyboardEvent) =>
                    event.preventDefault()
                );
                keyboardCallbacks.set(command, callback);
                const store = configureStore({ reducer: { HotKeysReducer } });
                render(
                    <Provider store={store}>
                        <HotKeys>
                            <textarea aria-label="Editor" />
                        </HotKeys>
                    </Provider>
                );
                const editor = screen.getByRole("textbox");
                editor.focus();
                const modifiers = {
                    ctrlKey: modifier === "Control",
                    metaKey: modifier === "Meta"
                };
                fireEvent.keyDown(editor, {
                    key: modifier,
                    code: `${modifier}Left`,
                    ...modifiers
                });
                if (shiftKey)
                    fireEvent.keyDown(editor, {
                        key: "Shift",
                        code: "ShiftLeft",
                        ...modifiers,
                        shiftKey
                    });
                const prevented = !fireEvent.keyDown(editor, {
                    key: shiftKey ? key.toUpperCase() : key,
                    code: `Key${key.toUpperCase()}`,
                    ...modifiers,
                    shiftKey
                });
                fireEvent.keyUp(editor, {
                    key: shiftKey ? key.toUpperCase() : key,
                    ...modifiers,
                    shiftKey
                });
                if (shiftKey)
                    fireEvent.keyUp(editor, { key: "Shift", ...modifiers });
                fireEvent.keyUp(editor, { key: modifier });
                expect(callback).toHaveBeenCalledOnce();
                expect(prevented).toBe(true);
            }
        );
    }
);
