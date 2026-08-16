import { css, Theme } from "@emotion/react";
import { headerHeight } from "@styles/constants";

export const rootStyle = (theme: Theme) =>
    css({
        position: "relative",
        top: `${headerHeight}px`,
        left: 0,
        right: 0,
        minHeight: "100vh",
        boxSizing: "border-box",
        backgroundColor: theme.background
    });

export const mainStyle = (theme: Theme) =>
    css({
        maxWidth: "1024px",
        padding: 16,
        margin: "0 auto",
        fontSize: 16,
        color: theme.textColor,
        "& h1": {
            margin: "16px 0",
            color: theme.headerTextColor
        },
        "& h2": {
            margin: "40px 0 16px",
            color: theme.headerTextColor
        },
        "& h3": {
            margin: "40px 0 16px",
            color: theme.headerTextColor
        },
        "& a": {
            color: theme.button
        },
        "& img": {
            borderRadius: 6,
            border: `1px solid ${theme.line}`,
            display: "block",
            margin: "16px auto"
        }
    });
