import { expect, it } from "vitest";
import { getContrastRatio } from "@mui/material/styles";
import monokai from "./_theme-monokai";
import github from "./_theme-github";
import githubLight from "./_theme-github-light";
import dracula from "./_theme-dracula";
import nord from "./_theme-nord";
import solarized from "./_theme-solarized-dark";
import { manualColors } from "./manual-theme";

for (const [name, palette] of Object.entries({
    monokai,
    github,
    githubLight,
    dracula,
    nord,
    solarized
})) {
    it(`keeps ${name} manual text readable on both surfaces`, () => {
        const colors = manualColors(palette);
        for (const key of [
            "text",
            "muted",
            "accent",
            "code-keyword",
            "code-string",
            "code-comment",
            "code-opcode",
            "code-control",
            "code-a-rate",
            "code-i-rate",
            "code-k-rate",
            "code-f-rate",
            "code-number",
            "code-p-field",
            "code-macro"
        ] as const) {
            for (const background of [colors.background, colors.surface]) {
                expect(
                    getContrastRatio(colors[key], background)
                ).toBeGreaterThanOrEqual(4.5);
            }
        }
        expect(colors.background).toBe(palette.background);
    });
}
