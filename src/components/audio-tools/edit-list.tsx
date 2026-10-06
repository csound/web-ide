import { useTheme } from "@emotion/react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseRounded from "@mui/icons-material/CloseRounded";

/** Show the settings used by the automatic preview, with controls to remove them. */
export function EditList({
    rows,
    status,
    onClear
}: {
    rows: { id: string; label: string; detail: string; remove: () => void }[];
    status?: string;
    onClear: () => void;
}) {
    const theme = useTheme();
    return (
        <section
            aria-label="Changes"
            css={{ borderTop: `1px solid ${theme.line}`, paddingTop: 12 }}
        >
            <div
                css={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8
                }}
            >
                <strong css={{ fontSize: 12 }}>Changes</strong>
                <Button onClick={onClear} disabled={!rows.length}>
                    Clear all changes
                </Button>
            </div>
            <p role="status" css={{ color: theme.altTextColor }}>
                {status ||
                    (rows.length
                        ? "Preview uses these settings."
                        : "No changes. Playing the loaded file.")}
            </p>
            {!rows.length ? (
                <p css={{ paddingTop: 12, color: theme.altTextColor }}>
                    Choose an edit to update the preview automatically.
                </p>
            ) : (
                <ol css={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                    {rows.map(({ id, label, detail, remove }, index) => {
                        return (
                            <li
                                key={id}
                                css={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    borderBottom: `1px solid ${theme.line}`,
                                    padding: "8px 0",
                                    fontSize: 12
                                }}
                            >
                                <span
                                    css={{
                                        color: theme.altTextColor,
                                        fontFamily: theme.font.monospace
                                    }}
                                >
                                    {index + 1}
                                </span>
                                <span css={{ flex: 1, minWidth: 0 }}>
                                    <strong>{label}</strong>
                                    <span
                                        css={{
                                            display: "block",
                                            color: theme.altTextColor,
                                            marginTop: 3,
                                            overflowWrap: "anywhere"
                                        }}
                                    >
                                        {detail}
                                    </span>
                                </span>
                                <Button
                                    aria-label={`Reset ${label.toLowerCase()} to default`}
                                    onClick={remove}
                                >
                                    Reset to default
                                </Button>
                                <IconButton
                                    size="small"
                                    aria-label={`Remove ${label.toLowerCase()}`}
                                    onClick={remove}
                                    css={{ color: theme.altTextColor }}
                                >
                                    <CloseRounded fontSize="small" />
                                </IconButton>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
