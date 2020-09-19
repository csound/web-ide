import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const audioEditorStyles = (theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
            height: "100%"
        }
    });

export default (ClassComponent: any) =>
    withStyles(audioEditorStyles)(ClassComponent);
