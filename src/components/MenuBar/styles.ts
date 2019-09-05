import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: "flex",
            position: "relative",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            listStyle: "none",
            padding: 0,
            margin: 0
        },
        column: {
            padding: "5px 9px",
            color: "#f8f8f2",
            "&:hover": {
                pointer: "cursor",
                cursor: "pointer",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                boxShadow:
                    "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"
            }
        },
        row: {
            backgroundColor: "#272822",
            position: "absolute",
            listStyle: "none",
            border: "none",
            padding: 0,
            animation: "fadeIn 0.01s linear",
            outline: 0,
            margin: 0,
            marginTop: 6,
            marginLeft: -8,
            boxShadow:
                "0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)"
        },
        listItem: {
            padding: "6px 12px",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)"
            }
        },
        label: {
            margin: 0,
            fontSize: 12
        },
        hr: {
            padding: 0,
            backgroundColor: "rgba(200,200,200,0.1)",
            height: "1px",
            border: "none",
            margin: "2px 12px"
        }
    })
);

export default useStyles;
