import React, { RefObject, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentRoute } from "@comp/router/selectors";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { selectUserImageURL, selectUserName } from "@comp/profile/selectors";
import { selectLoggedInUid } from "@comp/login/selectors";
import AppBar from "@material-ui/core/AppBar";
import Login from "../login/login";
import * as loginActions from "../login/actions";
import { push } from "connected-react-router";
import CSLogo from "../cs-logo/cs-logo";
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
import MenuBar from "../menu-bar/menu-bar";
import ProjectProfileMeta from "./project-profile-meta";
import TargetControls from "../target-controls";
import SocialControls from "../social-controls/social-controls";

const Header = () => {
    const dispatch = useDispatch();

    const authenticated = useSelector(
        (store: IStore) => store.LoginReducer.authenticated
    );
    const activeProjectUid = useSelector(
        (store: IStore) => store.ProjectsReducer.activeProjectUid
    );

    const currentRoute = useSelector(selectCurrentRoute);

    const routeIsHome = currentRoute === "home";

    const routeIsEditor = currentRoute === "editor";

    const routeIsProfile = currentRoute === "profile";

    const isOwner = useSelector(selectIsOwner(activeProjectUid || ""));

    const loggedInUid = useSelector(selectLoggedInUid);

    const loggedInUserName = useSelector(selectUserName(loggedInUid));

    const avatarUrl = useSelector(selectUserImageURL(loggedInUid || ""));

    const isLoginDialogOpen = useSelector(
        (store: IStore) => store.LoginReducer.isLoginDialogOpen
    );

    const anchorElement = useRef() as RefObject<HTMLButtonElement>;

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleProfileMenuOpen = (event?: any) => {
        setIsProfileMenuOpen(true);
    };

    const handleProfileMenuClose = (event?: any) => {
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
                ref={anchorElement}
                component="button"
            >
                {avatar as any}
            </IconButton>
            <Menu
                classes={{ paper: SS.menuPaper }}
                anchorEl={anchorElement.current}
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
                <Link to={`/profile/${loggedInUserName}`} css={SS.menuItemLink}>
                    <MenuItem
                        onClick={(event) => {
                            handleProfileMenuClose(event);
                        }}
                    >
                        View Profile
                    </MenuItem>
                </Link>
                <MenuItem
                    onClick={(event) => {
                        handleProfileMenuClose(event);
                        logout();
                    }}
                >
                    Logout
                </MenuItem>
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

    const burgerMenu =
        routeIsHome || routeIsProfile ? (
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={() => setIsDrawerOpen(true)}
                edge="start"
                css={SS.menuButton}
            >
                <MenuIcon />
            </IconButton>
        ) : (
            <div css={SS.spacer} />
        );

    return (
        <>
            {isLoginDialogOpen && <Login />}
            <AppBar position={"fixed"} css={SS.headerRoot}>
                <Toolbar disableGutters={true} css={SS.toolbar}>
                    {burgerMenu}

                    <CSLogo
                        size={38}
                        interactive={true}
                        onClick={handleIconClick}
                    />

                    {routeIsEditor && activeProjectUid && isOwner && (
                        <MenuBar />
                    )}
                    {routeIsEditor && !isOwner && <ProjectProfileMeta />}
                    <div style={{ flexGrow: 1 }} />
                    <div css={SS.headerRightSideGroup}>
                        {routeIsEditor && <TargetControls />}
                        {routeIsEditor && <SocialControls />}
                    </div>
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
                                <HelpIcon css={SS.drawerIcon} />
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
                                <ReportProblemIcon css={SS.drawerIcon} />
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
                                <GitHubIcon css={SS.drawerIcon} />
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
