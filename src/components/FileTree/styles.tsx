// import { Theme } from '@material-ui/core';
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
    container: {
        width: "100%",
        height: "100%",
        background: "#272822",
        padding: "0!important",
        color: "#f8f8f2",
        overflow: "hidden",
    },
    treeIcon: {
        color: "red",
    },
    deleteIcon: {
        fontSize: 24,
        // marginRight: 6,
        color: "white",
    },
    editIcon: {
        fontSize: 18,
        marginRight: 32,
        color: "white",
    },
    fileIcon: {
        fontSize: 18,
        marginRight: 6,
        color: "white",
    },
    node: {
        display: "flex",
        alignContent: "center",
        color: "rgb(222,222,222)",
        textOverflow: "ellipsis",
        overflow: "hidden",
    },
    active: {
        fontWeight: "bold",
    },
    inactive: {
        fontWeight: "normal",
    },
    closed: {
        fontWeight: "normal",
    },
});

export default useStyles;
