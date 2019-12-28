import { css } from "@emotion/core";

export const toolbar = css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 8px;
`;

export const content = theme => css`
    background-color: ${theme.background.primary};
    padding: 0;
`;

// import { Theme } from "@material-ui/core";
// import { makeStyles, createStyles } from "@material-ui/styles";
// const layoutStyles = (theme: Theme) =>
//     createStyles({
//         toolbar: {
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "flex-end",
//             padding: "0 8px",
//             ...theme.mixins.toolbar
//         },
//         content: {
//             // flexGrow: 1,
//             backgroundColor: theme.palette.background.default,
//             padding: 0
//         }
//     });
// export const layoutStylesHook = makeStyles(layoutStyles);
