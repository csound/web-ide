import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const audioEditorStyles = (theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
            height: "100%",
            "& audio": {
                borderRightWidth: 30,
                margin: 30
            }
        }
    });

const withStyles_ = (ClassComponent: any) =>
    withStyles(audioEditorStyles)(ClassComponent);

export default withStyles_;
