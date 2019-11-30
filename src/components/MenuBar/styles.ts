import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import { css } from "@emotion/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            display: "inline-block",
            position: "relative",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            listStyle: "none",
            padding: 0,
            margin: 0,
            userSelect: "none",
            top: -5,
            marginLeft: 6
        },
        column: {},
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
            fontSize: 12,
            whiteSpace: "nowrap"
        },
        hr: {
            padding: 0,
            backgroundColor: "rgba(200,200,200,0.1)",
            height: "1px",
            border: "none",
            margin: "2px 12px"
        },
        iconButtonRoot: {
            borderRadius: "3px",
            padding: "2px 12px",
            justifySelf: "center"
        }
    })
);

export const dropdownButton = css`
    position: relative;
    padding: 5px 9px;
    color: #f8f8f2;
    display: inline;
    &:hover: {
        pointer: cursor;
        cursor: pointer;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
            0px 4px 5px 0px rgba(0, 0, 0, 0.14),
            0px 1px 10px 0px rgba(0, 0, 0, 0.12);
    }
`;

export const dropdownList = css`
    width: fit-content;
    background-color: #272822;
    position: absolute;
    line-style: none;
    border: none;
    padding: 0;
    animation: fadeIn 0.01s linear;
    outline: 0;
    margin: 0;
    margin-top: 24px;
    left: 0;
    box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
        0px 4px 5px 0px rgba(0, 0, 0, 0.14),
        0px 1px 10px 0px rgba(0, 0, 0, 0.12);
`;

export const buttonGroup = css`
    display: none;
`;

export default useStyles;
