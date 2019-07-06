// import { Theme } from '@material-ui/core';
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
    container: {
        width: "100%",
        height: "100%",
        background: "#222",
    },
    // TODO - SYY - This doesn't work, not sure how to get the treeIcon color styled...
    treeIcon: {
        color: "rgb(222,222,222)",
    },
    icon: {
        fontSize: 20,
        color: "rgb(222,222,222)",
    },
    node: {
        display: "flex",
        alignContent: "center",
        color: "rgb(222,222,222)",
    }
});

export default useStyles;
