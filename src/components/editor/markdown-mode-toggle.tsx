import { useTheme } from "@emotion/react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

export type MarkdownMode = "preview" | "edit";

export function MarkdownModeToggle({
    mode,
    onChange
}: {
    mode: MarkdownMode;
    onChange: (mode: MarkdownMode) => void;
}) {
    const theme = useTheme();
    return (
        <ToggleButtonGroup
            exclusive
            value={mode}
            onChange={(_, next: MarkdownMode | null) => {
                if (next) onChange(next);
            }}
            aria-label="Markdown view"
            css={{
                flexShrink: 0,
                padding: 2,
                gap: 2,
                border: `1px solid ${theme.line}`,
                borderRadius: 6,
                background: theme.background,
                "&& .MuiToggleButton-root": {
                    gap: 5,
                    minHeight: 24,
                    padding: "2px 8px",
                    border: 0,
                    borderRadius: 3,
                    margin: 0,
                    fontFamily: theme.font.regular,
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    color: theme.altTextColor,
                    transition: "background-color 120ms, color 120ms",
                    "&:hover": { background: theme.highlightBackground },
                    "&.Mui-selected": {
                        background: theme.buttonBackgroundHover,
                        color: theme.textColor,
                        boxShadow: `inset 0 0 0 1px ${theme.lineHover}`
                    },
                    "&.Mui-focusVisible": {
                        outline: `2px solid ${theme.textColor}`,
                        outlineOffset: -2
                    },
                    "@media (pointer: coarse)": { minHeight: 36 },
                    "@media (prefers-reduced-motion: reduce)": {
                        transition: "none"
                    }
                },
                "& svg": { fontSize: 14 }
            }}
        >
            <ToggleButton value="preview" aria-label="Preview Markdown">
                <VisibilityOutlinedIcon />
                Preview
            </ToggleButton>
            <ToggleButton value="edit" aria-label="Edit Markdown">
                <EditOutlinedIcon />
                Edit
            </ToggleButton>
        </ToggleButtonGroup>
    );
}
