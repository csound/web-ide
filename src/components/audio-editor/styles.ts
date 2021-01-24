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

export default withStyles(audioEditorStyles);
