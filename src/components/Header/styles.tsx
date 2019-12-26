import { Theme } from "@material-ui/core";
import { makeStyles, createStyles, withStyles } from "@material-ui/styles";
import { css as classCss } from "emotion";
import { css } from "@emotion/core";

const drawerWidth = 260;

export const headerRoot = css`
    background-image: linear-gradient(
        to right,
        #262724,
        #252622,
        #242520,
        #23241d,
        #22231b
    );
`;

export const headerStyles = (theme: Theme) =>
    createStyles({
        appBarShift: {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen
            })
        },
        burgerToggler: {
            margin: "0 12px",
            color: theme.palette.primary.contrastText,
            width: "48px"
        },
        menuButton: {
            marginLeft: 12,
            marginRight: 6
        },
        hide: {
            display: "none"
        },
        drawer: {
            width: drawerWidth
        },
        drawerHeader: {
            width: drawerWidth,
            paddingLeft: 16,
            height: 40
        },
        drawerPaper: {
            position: "relative",
            whiteSpace: "nowrap",
            width: drawerWidth,
            transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen
            })
        },
        drawerPaperClose: {
            overflowX: "hidden",
            transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
            }),
            width: theme.spacing(7),
            [theme.breakpoints.up("sm")]: {
                width: theme.spacing(9)
            }
        },
        flex: {
            flex: 1
        },
        spacer: {
            flexGrow: 1
        },
        profileName: {
            textAlign: "right"
        },
        menuItemLink: {
            textDecoration: "none",
            color: "black"
        }
    });

export const toolbar = css`
    display: flex;
    justify-content: space-between;
`;

export const avatar = css`
    height: 42px;
    width: 42px;
    padding: 0 !important;
    margin-right: 6px;
    border-radius: 4px;
`;

export const userMenu = css`
    position: static;
    margin-right: 12px;
    & > button {
        padding: 0 !important;
    }
`;

export const menuPaper = classCss`
    top: 40px!important;
`;

export const loginButton = css`
    position: relative;
    right: 12px;
`;

export const accountTooltip = classCss`
    margin-right: 24px;
`;

export const headerStylesHook = makeStyles(headerStyles);
export const headerStylesHOC = (ClassComponent: any) =>
    withStyles(headerStyles)(ClassComponent);
