import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import AppBar from "@material-ui/core/AppBar";
import Login from "../Login/Login";
import * as loginActions from "../Login/actions";
import { push } from "connected-react-router";
import CSLogo from "../CSLogo/CSLogo";
import { Link } from "react-router-dom";
import {
    Toolbar,
    IconButton,
    MenuItem,
    Menu,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from "@material-ui/core";
import { AccountBox } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/Menu";
import HelpIcon from "@material-ui/icons/Help";
import GitHubIcon from "@material-ui/icons/GitHub";
import ReportProblemIcon from "@material-ui/icons/ReportProblem";
import * as SS from "./styles";
// import { tooltipClasses } from "@styles";
import { IStore } from "@store/types";
import { isEmpty } from "lodash";
// import { hasPath } from "ramda";
import MenuBar from "../MenuBar/MenuBar";
import TargetControls from "../TargetControls";
import SocialControls from "../SocialControls/SocialControls";

interface IHeaderProps {
    showMenuBar: boolean;
}

interface IHeaderDispatchProperties {
    logOut: () => void;
    openLoginDialog: () => void;
    handleIconClick: () => void;
}

interface IHeaderLocalState {
    isProfileMenuOpen: boolean;
}

type IHeader = IHeaderProps & IHeaderDispatchProperties;

export const Header = ({ showMenuBar = true }) => {
    const dispatch = useDispatch();

    const authenticated = useSelector(
        (store: IStore) => store.LoginReducer.authenticated
    );

    const avatarUrl = useSelector(
        (store: IStore) => store.userProfile && store.userProfile.photoUrl
    );
    const isLoginDialogOpen = useSelector(
        (store: IStore) => store.LoginReducer.isLoginDialogOpen
    );

    const anchorEl = useRef(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleProfileMenuOpen = (event: any) => {
        setIsProfileMenuOpen(true);
    };

    const handleProfileMenuClose = (event: any) => {
        setIsProfileMenuOpen(false);
    };

    const logout = () => dispatch(loginActions.logOut());
    const openLoginDialog = () => dispatch(loginActions.openLoginDialog());
    const handleIconClick = () => dispatch(push("/"));

    const avatar = isEmpty(avatarUrl) ? (
        <AccountBox />
    ) : (
        <Avatar src={avatarUrl || ""} css={SS.avatar} />
    );

    const userMenu = () => (
        <div css={SS.userMenu}>
            <IconButton
                aria-owns={isProfileMenuOpen ? "menu-appbar" : undefined}
                aria-haspopup="true"
                color="inherit"
                onClick={handleProfileMenuOpen}
                ref={anchorEl}
            >
                {avatar}
            </IconButton>
            <Menu
                classes={{ paper: SS.menuPaper }}
                anchorEl={anchorEl.current}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right"
                }}
                open={isProfileMenuOpen}
                onClose={handleProfileMenuClose}
            >
                <MenuItem>
                    <Link to="/profile" css={SS.menuItemLink}>
                        View Profile
                    </Link>
                </MenuItem>
                <MenuItem onClick={logout}>Logout</MenuItem>
            </Menu>
        </div>
    );

    const loginButton = () => (
        <Button
            css={SS.loginButton}
            color="inherit"
            onClick={() => {
                setIsProfileMenuOpen(false);
                openLoginDialog();
            }}
        >
            Login
        </Button>
    );

    return (
        <>
            {isLoginDialogOpen && <Login />}
            <AppBar position={"fixed"} css={SS.headerRoot}>
                <Toolbar disableGutters={true} css={SS.toolbar}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={() => setIsDrawerOpen(true)}
                        edge="start"
                        css={SS.menuButton}
                    >
                        <MenuIcon />
                    </IconButton>
                    <CSLogo
                        size={38}
                        interactive={true}
                        onClick={handleIconClick}
                    />
                    {showMenuBar && <MenuBar />}
                    <div style={{ flexGrow: 1 }} />
                    {showMenuBar && <TargetControls />}
                    {showMenuBar && <SocialControls />}
                    {authenticated ? userMenu() : loginButton()}
                </Toolbar>
            </AppBar>

            <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
                <div css={SS.drawer}>
                    <div css={SS.drawerHeader}>
                        <h2>Csound Web-IDE</h2>
                    </div>
                    <Divider />
                    <List>
                        <ListItem
                            button
                            onClick={() =>
                                window.open("/documentation", "_blank")
                            }
                        >
                            <ListItemIcon>
                                <HelpIcon />
                            </ListItemIcon>
                            <ListItemText primary="Site Documentation" />
                        </ListItem>
                        <ListItem
                            button
                            onClick={() =>
                                window.open(
                                    "https://github.com/csound/web-ide/issues",
                                    "_blank"
                                )
                            }
                        >
                            <ListItemIcon>
                                <ReportProblemIcon />
                            </ListItemIcon>
                            <ListItemText primary="Report an Issue" />
                        </ListItem>
                    </List>
                    <Divider />
                    <List>
                        <ListItem
                            button
                            onClick={() =>
                                window.open(
                                    "https://github.com/csound/web-ide",
                                    "_blank"
                                )
                            }
                        >
                            <ListItemIcon>
                                <GitHubIcon />
                            </ListItemIcon>
                            <ListItemText primary="Github Project" />
                        </ListItem>
                    </List>
                    {/* <Divider/>
                        <List >
                        <ListItem>
                        <ListItemText primary={`Version: `} />
                        </ListItem>
                        </List> */}
                </div>
            </Drawer>
        </>
    );
};

export default Header;
