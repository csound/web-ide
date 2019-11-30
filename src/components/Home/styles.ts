import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const homeStyles = (theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: "#e8e8e8",
            // fontFamily: "'Space Mono', monospace",
            bottom: "0px",
            top: "37px",
            left: 0,
            right: 0,
            position: "absolute",
            overflowY: "auto",
        },
        main: {
            maxWidth: "1024px",
            padding: 16,
            margin: "auto",
        },
    });

export default (ClassComponent: any) => withStyles(homeStyles)(ClassComponent);
