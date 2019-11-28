import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const siteDocsStyles = (theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: "#e8e8e8",
            fontFamily: "'Space Mono', monospace",
            width: "100%",
            height: "auto",
            bottom: "0px",
            top: "0px",
            left: 0,
            position: "absolute"
        },
        main: {
            maxWidth: "1024px",
            margin: "auto",
        },
    });

export default (ClassComponent: any) => withStyles(siteDocsStyles)(ClassComponent);
