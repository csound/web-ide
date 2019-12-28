import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import * as color from "@styles/_colors";
import { css } from "@emotion/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {},
        column: {},
        listItem: {},
        label: {},
        hr: {},
        iconButtonRoot: {}
    })
);

export const root = css`
    color: ${color.white};
    display: inline-block;
    position: relative;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    list-style: none;
    padding: 0;
    margin: 0;
    user-select: none;
    margin-left: 6px;
`;

export const hr = css`
    padding: 0;
    background-color: rgba(200, 200, 200, 0.1);
    height: 1px;
    border: none;
    margin: 2px 12px;
`;

export const paraLabel = css`
    margin: 0;
    font-size: 12px;
    white-space: nowrap;
`;

export const dropdownButton = css`
    position: relative;
    padding: 5px 9px;
    display: inline;
    &:hover {
        pointer: cursor;
        cursor: pointer;
        background-color: ${color.whiteHover};
        border-radius: 2px;
        box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
            0px 4px 5px 0px rgba(0, 0, 0, 0.14),
            0px 1px 10px 0px rgba(0, 0, 0, 0.12);
    }
`;

export const dropdownList = css`
    z-index: 10000;
    width: fit-content;
    background-color: rgb(39, 40, 34);
    opacity: 1;
    position: absolute;
    list-style: none !important;
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

export const iconButtonContainer = css`
    border-radius: 3px;
    padding: 2px 12px;
    justify-self: center;
`;

export const listItem = css`
    padding: 6px 12px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    background-color: #272822;
    &:hover {
        pointer: cursor;
        cursor: pointer;
        background-color: ${color.whiteHover};
        border-radius: 2px;
        box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
            0px 4px 5px 0px rgba(0, 0, 0, 0.14),
            0px 1px 10px 0px rgba(0, 0, 0, 0.12);
    }
`;

export default useStyles;
