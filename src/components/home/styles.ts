import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const homeStyles = (theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: "#e8e8e8",
            height: "100%",
            width: "100%",
            fontSize: "1rem",
            margin: 0,
            padding: 0
        },
        main: {
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
        },
        cssOutlinedInput: {
            "&:not(hover):not($disabled):not($cssFocused):not($error) $notchedOutline":
                {
                    borderColor: "#272922",
                    overflow: "hidden"
                }
        },
        cssLabel: {
            color: "green",
            overflow: "hidden"
        },
        notchedOutline: { overflow: "hidden" },
        cssFocused: { overflow: "hidden" },
        error: { overflow: "hidden" },
        disabled: { overflow: "hidden" }
    });

export default (ClassComponent: any) => withStyles(homeStyles)(ClassComponent);
