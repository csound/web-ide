import type { SelectHTMLAttributes } from "react";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";

/** Keep the native select's keyboard behavior with a centred, theme-aware arrow. */
export function AudioSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <span css={{ position: "relative", display: "block", minWidth: 0 }}>
            <select
                {...props}
                css={{
                    appearance: "none",
                    backgroundImage: "none !important",
                    paddingRight: "34px !important",
                    textOverflow: "ellipsis"
                }}
            />
            <ExpandMoreRounded
                aria-hidden
                css={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    fontSize: 18,
                    opacity: props.disabled ? 0.4 : 0.8
                }}
            />
        </span>
    );
}
