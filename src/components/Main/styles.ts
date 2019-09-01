import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const mainStyles = (theme: Theme) =>
    createStyles({
        root: {
            textAlign: "center"
        },
        logo: {
            animation: "App-logo-spin infinite 20s linear"
        },
        "@keyframes App-logo-spin": {
            from: {
                transform: "rotate(0deg)"
            },
            to: {
                transform: "rotate(360deg)"
            }
        }
    });

export const mainStylesHOC = (ClassComponent: any) =>
    withStyles(mainStyles)(ClassComponent);
