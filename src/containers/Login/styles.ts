import { Theme } from '@material-ui/core';
import {
    // makeStyles,
    createStyles,
    withStyles
} from "@material-ui/styles";


const loginStyles = (theme: Theme) => createStyles({
    errorBox: {
        color: theme.palette.error.main,
        padding: 45,
    },
});

// export const loginStylesHook = makeStyles(mainStyles);
export const loginStylesHOC = (ClassComponent: any) => withStyles(loginStyles)(ClassComponent);
