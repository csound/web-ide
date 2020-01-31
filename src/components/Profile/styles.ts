import { Theme } from "@material-ui/core";
import { createStyles, withStyles } from "@material-ui/styles";

const profileStyles = (theme: Theme) =>
    createStyles({
        root: {
            position: "absolute",
            fontFamily: "'Space Mono', monospace",
            width: "100%",
            height: "100%",
            bottom: 0,
            top: 0,
            left: 0
        },
        centerBox: {
            position: "absolute",
            width: "600px",
            height: "50px",
            top: "120px",
            left: "50%",
            marginTop: "-25px",
            marginLeft: "-50px"
        },
        startCodingButton: {
            fontSize: "22px",
            border: "4px solid #518C82",
            borderRadius: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "220px",
            height: "220px",
            textDecoration: "none",
            background: "#00DFCB"
        }
    });

export default (ClassComponent: any) =>
    withStyles(profileStyles)(ClassComponent);
