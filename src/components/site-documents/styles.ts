import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const siteDocumentsStyles = (theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: "#e8e8e8",
            bottom: "0px",
            top: "37px",
            left: 0,
            right: 0,
            position: "absolute",
            overflowY: "scroll"
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
        }
    });

export default (ClassComponent: any) =>
    withStyles(siteDocumentsStyles)(ClassComponent);
