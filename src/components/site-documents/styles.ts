import { css } from "@emotion/react";
import { headerHeight } from "@styles/constants";

export const rootStyle = css({
    backgroundColor: "#e8e8e8",
    bottom: "0px",
    top: `${headerHeight}px`,
    left: 0,
    right: 0,
    position: "relative"
});

export const mainStyle = css({
    maxWidth: "1024px",
    padding: 16,
    margin: "auto",
    fontSize: 16,
    "& h1": {
        margin: "16px 0"
    },
    "& h2": {
        margin: "40px 0 16px"
    },
    "& h3": {
        margin: "40px 0 16px"
    }
});
