import { Theme } from "@material-ui/core";
import { makeStyles, createStyles, withStyles } from "@material-ui/styles";
import { css } from "@emotion/core";

const drawerWidth = 240;

const headerStyles = (theme: Theme) =>
    createStyles({
        root: {
            flexGrow: 1,
            zIndex: 100,
            overflow: "hidden",
            position: "relative",
            display: "block"
        },
        appBar: {
            width: "100%",
            marginBottom: "4px",
            borderBottom: "1px solid rgb(17, 21, 24)",
            zIndex: theme.zIndex.drawer + 1,
            transition: theme.transitions.create(["width", "margin"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
            })
        },
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
            marginRight: 36
        },
        hide: {
            display: "none"
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
    height: 29px;
    width: 29px;
    padding: 0 !important;
    margin-right: 6px;
    border-radius: 4px;
`;

export const userMenu = css`
    position: relative;
    right: 12px;
    top: -9px;
    height: 38px;
    width: 38px;
`;

export const loginButton = css`
    position: relative;
    right: 12px;
`;

export const headerStylesHook = makeStyles(headerStyles);
export const headerStylesHOC = (ClassComponent: any) =>
    withStyles(headerStyles)(ClassComponent);
