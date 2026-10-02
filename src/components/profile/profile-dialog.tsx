import { ReactNode, useId } from "react";
import { Box, DialogActions, DialogContent, DialogTitle } from "@mui/material";

/** Shared sizing and scroll boundaries for dialogs opened from a profile. */
export function ProfileDialog({
    title,
    children,
    actions,
    width = 560
}: {
    title: string;
    children: ReactNode;
    actions: ReactNode;
    width?: number;
}) {
    const titleId = useId();
    return (
        <Box
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            sx={{
                width,
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "calc(100dvh - 32px)",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <DialogTitle
                id={titleId}
                sx={{
                    p: { xs: 2, sm: 3 },
                    pb: { xs: 2, sm: 2 },
                    fontSize: 22,
                    lineHeight: 1.3,
                    overflowWrap: "anywhere"
                }}
            >
                {title}
            </DialogTitle>
            <DialogContent
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2.5,
                    px: { xs: 2, sm: 3 },
                    pb: 3,
                    pt: "8px !important",
                    minHeight: 0
                }}
            >
                {children}
            </DialogContent>
            <DialogActions
                sx={{
                    flexShrink: 0,
                    borderTop: 1,
                    borderColor: "divider",
                    p: 2,
                    gap: 1,
                    flexWrap: "wrap",
                    "& > :not(style) ~ :not(style)": { ml: 0 },
                    "& button": { minHeight: 40 }
                }}
            >
                {actions}
            </DialogActions>
        </Box>
    );
}
