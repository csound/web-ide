import { Theme } from '@material-ui/core';
import { makeStyles, createStyles } from "@material-ui/styles";

const layoutStyles = (theme: Theme) => createStyles({
    toolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar
    },
    content: {
        // flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: 0,
    },
});

export const layoutStylesHook = makeStyles(layoutStyles);
