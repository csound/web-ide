import { css } from "@emotion/react";

export const rootStyle = css({
    width: "100%",
    height: "100%",
    display: "flex",
    "& audio": {
        borderRightWidth: 30,
        margin: "auto"
    }
});
