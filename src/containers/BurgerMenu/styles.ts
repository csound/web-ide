import { Theme } from '@material-ui/core';
import { createStyles, withStyles } from "@material-ui/styles";

const burgerMenuStyles = (theme: Theme) => {
    return createStyles({
        root: {
            backgroundColor: theme.palette.primary.light,
        },
        menu: {
            overflow: "hidden!important",
        },
        nested: {
            paddingLeft: theme.spacing(4),
        },
        doubleNested: {
            paddingLeft: theme.spacing(8),
        },

    })};

export const burgerMenuStylesHOC = (ClassComponent: any) =>
    withStyles(burgerMenuStyles)(ClassComponent);
