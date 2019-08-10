// import { Theme } from '@material-ui/core';
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
    container: {
        width: "100%",
        height: "100%",
        background: "#222",
        padding: "0!important",
    },
    treeIcon: {
        color: "red",
    },
    icon: {
        fontSize: 24,
        marginRight: 6,
        color: "white",
    },
    node: {
        display: "flex",
        alignContent: "center",
        color: "rgb(222,222,222)",
    }
});

export default useStyles;
