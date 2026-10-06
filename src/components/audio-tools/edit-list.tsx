import { useTheme } from "@emotion/react";
import IconButton from "@mui/material/IconButton";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { describeEdit, type SampleEdit } from "./sample-edits";

/** Show ordered parameter snapshots; removing a pending row never changes the current result. */
export function EditList({
    edits,
    pending = false,
    disabled = false,
    onRemove
}: {
    edits: SampleEdit[];
    pending?: boolean;
    disabled?: boolean;
    onRemove?: (edit: SampleEdit) => void;
}) {
    const theme = useTheme();
    return (
        <section
            aria-label={pending ? "Pending edits" : "Applied edits"}
            css={{ borderTop: `1px solid ${theme.line}`, paddingTop: 12 }}
        >
            <strong css={{ fontSize: 12 }}>
                {pending ? "Pending edits" : "Applied edits"}
            </strong>
            <p css={{ color: theme.altTextColor, marginTop: "4px !important" }}>
                {pending
                    ? "Apply starts from Original. Edits run top to bottom."
                    : "These are the edits you hear in this result."}
            </p>
            {!edits.length ? (
                <p css={{ paddingTop: 12, color: theme.altTextColor }}>
                    Select a range or choose an edit to begin.
                </p>
            ) : (
                <ol css={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                    {edits.map((edit, index) => {
                        const { label, detail } = describeEdit(edit);
                        return (
                            <li
                                key={edit.operation}
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
                                {onRemove && (
                                    <IconButton
                                        size="small"
                                        disabled={disabled}
                                        aria-label={`Remove ${label.toLowerCase()}`}
                                        onClick={() => onRemove(edit)}
                                        css={{ color: theme.altTextColor }}
                                    >
                                        <CloseRounded fontSize="small" />
                                    </IconButton>
                                )}
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
