import { useState } from "react";
import { Tooltip, IconButton } from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
export function FieldLabel({
    id,
    label,
    help
}: {
    id: string;
    label: string;
    help: string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="field-label">
            <label htmlFor={id}>{label}</label>
            <Tooltip
                id={`${id}-help`}
                title={help}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                describeChild
            >
                <IconButton
                    size="small"
                    aria-label={`About ${label}`}
                    onClick={() => setOpen(!open)}
                    onBlur={() => setOpen(false)}
                >
                    <InfoOutlined />
                </IconButton>
            </Tooltip>
        </div>
    );
}
