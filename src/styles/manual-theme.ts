import type { Theme } from "@emotion/react";
import { darken, getContrastRatio, lighten } from "@mui/material/styles";

type ManualPalette = Pick<
    Theme,
    | "mode"
    | "background"
    | "highlightBackgroundAlt"
    | "textColor"
    | "altTextColor"
    | "line"
    | "keyword"
    | "string"
    | "comment"
    | "opcode"
    | "controlFlow"
    | "aRateVar"
    | "iRateVar"
    | "kRateVar"
    | "fRateVar"
    | "number"
    | "pField"
    | "macro"
>;

/** Keep the IDE's hues readable on the manual's code and navigation surfaces. */
export function manualColors(theme: ManualPalette) {
    const surface = theme.highlightBackgroundAlt;
    /** Adjust a hue only as far as needed to read it on both surfaces. */
    const readable = (color: string) => {
        const adjust = theme.mode === "dark" ? lighten : darken;
        for (let step = 0; step <= 20; step++) {
            const candidate = step ? adjust(color, step / 20) : color;
            if (
                [theme.background, surface].every(
                    (background) =>
                        getContrastRatio(candidate, background) >= 4.6
                )
            )
                return candidate;
        }
        return theme.textColor;
    };
    return {
        background: theme.background,
        surface,
        text: theme.textColor,
        muted: readable(theme.altTextColor),
        line: theme.line,
        accent: theme.textColor,
        "code-keyword": readable(theme.keyword),
        "code-string": readable(theme.string),
        "code-comment": readable(theme.comment),
        "code-opcode": readable(theme.opcode),
        "code-control": readable(theme.controlFlow),
        "code-a-rate": readable(theme.aRateVar),
        "code-i-rate": readable(theme.iRateVar),
        "code-k-rate": readable(theme.kRateVar),
        "code-f-rate": readable(theme.fRateVar),
        "code-number": readable(theme.number),
        "code-p-field": readable(theme.pField),
        "code-macro": readable(theme.macro)
    };
}
