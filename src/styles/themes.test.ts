import { describe, expect, it } from "vitest";
import { getContrastRatio } from "@mui/material/styles";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history, undo } from "@codemirror/commands";
import monokai from "./_theme-monokai";
import github from "./_theme-github";
import githubLight from "./_theme-github-light";
import dracula from "./_theme-dracula";
import nord from "./_theme-nord";
import solarized from "./_theme-solarized-dark";
import { makeMuiTheme } from "./material-ui-style";
import { codeMirrorTheme } from "./code-mirror-theme";

const palettes = { monokai, github, githubLight, dracula, nord, solarized };
const font = { regular: "sans-serif", monospace: "monospace" };

for (const [name, palette] of Object.entries(palettes)) {
    describe(name, () => {
        it("keeps text readable on editor and control surfaces", () => {
            for (const background of [
                palette.background,
                palette.headerBackground,
                palette.buttonBackgroundHover
            ]) {
                expect(
                    getContrastRatio(palette.textColor, background)
                ).toBeGreaterThanOrEqual(4.5);
                expect(
                    getContrastRatio(palette.altTextColor, background)
                ).toBeGreaterThanOrEqual(4.5);
            }
            expect(
                getContrastRatio(palette.textColor, palette.selectedTextColor)
            ).toBeGreaterThanOrEqual(4.5);
            expect(
                getContrastRatio(palette.comment, palette.background)
            ).toBeGreaterThanOrEqual(4.5);
        });

        it("switches editor mode without losing edits, selection, or undo", () => {
            const theme = { ...palette, font };
            const compartment = new Compartment();
            let state = EditorState.create({
                doc: "instr 1",
                extensions: [
                    history(),
                    compartment.of(codeMirrorTheme({ ...monokai, font }))
                ]
            });
            state = state.update({
                changes: { from: 7, insert: "\nendin" },
                selection: { anchor: 2, head: 5 }
            }).state;
            state = state.update({
                effects: compartment.reconfigure(codeMirrorTheme(theme))
            }).state;
            expect(state.facet(EditorView.darkTheme)).toBe(
                palette.mode === "dark"
            );
            expect(state.doc.toString()).toBe("instr 1\nendin");
            expect(state.selection.main.anchor).toBe(2);
            expect(state.selection.main.head).toBe(5);
            expect(
                undo({
                    state,
                    dispatch: (transaction) => {
                        state = transaction.state;
                    }
                })
            ).toBe(true);
            expect(state.doc.toString()).toBe("instr 1");
            expect(makeMuiTheme(theme).palette.mode).toBe(palette.mode);
        });
    });
}
