import React, { useEffect, useState, useRef } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { selectIsOwner } from "@comp/project-editor/selectors";
import {
    selectUserImageURL,
    selectLoggedInUserName
} from "@comp/profile/selectors";
import { selectLoggedInUid } from "@comp/login/selectors";
import AppBar from "@mui/material/AppBar";
import Login from "@comp/login/login";
import * as loginActions from "@comp/login/actions";
import CSLogo from "@comp/cs-logo/cs-logo";
import { Link, useLocation } from "react-router";
import {
    Toolbar,
    IconButton,
    MenuItem,
    Menu,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider
} from "@mui/material";
import { AccountBox } from "@mui/icons-material";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import CachedAvatar from "@comp/profile/cached-avatar";
import MenuIcon from "@mui/icons-material/Menu";
import HelpIcon from "@mui/icons-material/Help";
import GitHubIcon from "@mui/icons-material/GitHub";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import * as SS from "./styles";
// import { tooltipClasses } from "@comp/styles";
import { isEmpty } from "ramda";
import { MenuBar } from "@comp/menu-bar/menu-bar";
import ProjectProfileMeta from "./project-profile-meta";
import { TargetControls } from "@comp/target-controls";
import SocialControls from "@comp/social-controls/social-controls";
import { isMobile } from "@root/utils";
import { closeHeaderDrawer, openHeaderDrawer } from "@comp/menu-ui/actions";
import { selectIsHeaderDrawerOpen } from "@comp/menu-ui/selectors";

export const Header = () => {
    const dispatch = useDispatch();
    const isCompactViewport = useMediaQuery("(max-width:900px)");
    const mobileView = isMobile() || isCompactViewport;

    const authenticated = useSelector(
        (store: RootState) => store.LoginReducer.authenticated
    );
    const activeProjectUid = useSelector(
        (store: RootState) => store.ProjectsReducer.activeProjectUid
    );

    const currentRoute = useLocation();

    const routeIsHome = currentRoute.pathname === "/";

    const routeIsEditor = currentRoute.pathname.startsWith("/editor");

    const routeIsProfile = currentRoute.pathname.startsWith("/profile");

    const routeIsDocumentation = currentRoute.pathname === "/documentation";

    const isOwner = useSelector(selectIsOwner);

    const loggedInUid = useSelector(selectLoggedInUid);

    const loggedInUserName = useSelector(selectLoggedInUserName);

    const avatarUrl = useSelector(selectUserImageURL(loggedInUid || ""));

    const isLoginDialogOpen = useSelector(
        (store: RootState) => store.LoginReducer.isLoginDialogOpen
    );

    const anchorElement = useRef<HTMLButtonElement>(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const isDrawerOpen = useSelector(selectIsHeaderDrawerOpen);

    const handleProfileMenuOpen = () => {
        setIsProfileMenuOpen(true);
    };

    const handleProfileMenuClose = () => {
        setIsProfileMenuOpen(false);
    };

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            handleProfileMenuClose();
            dispatch(closeHeaderDrawer());
        };

        window.addEventListener("keydown", closeOnEscape);

        return () => {
            window.removeEventListener("keydown", closeOnEscape);
        };
    }, [dispatch]);

    const logout = () => dispatch(loginActions.logOut());
    const openLoginDialog = () => dispatch(loginActions.openLoginDialog());

    const avatar = isEmpty(avatarUrl) ? (
        <AccountBox />
    ) : (
        <CachedAvatar src={avatarUrl || ""} css={SS.avatar} />
    );

    const userMenu = () => (
        <div css={SS.userMenu}>
            <IconButton
                aria-controls={
                    isProfileMenuOpen ? "user-menu-appbar" : undefined
                }
                aria-expanded={isProfileMenuOpen}
                data-tip="UserMenu"
                aria-haspopup="true"
                aria-label="Open user menu"
                color="inherit"
                onClick={handleProfileMenuOpen}
                ref={anchorElement}
                component="button"
            >
                {avatar}
            </IconButton>
            <Menu
                id="user-menu-appbar"
                css={SS.menuPaper}
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
                        onClick={() => {
                            handleProfileMenuClose();
                        }}
                    >
                        View Profile
                    </MenuItem>
                </Link>
                <MenuItem
                    onClick={() => {
                        handleProfileMenuClose();
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
        routeIsHome || routeIsProfile || routeIsDocumentation ? (
            <IconButton
                color="inherit"
                aria-label="open drawer"
                aria-controls={
                    isDrawerOpen ? "top-navigation-drawer" : undefined
                }
                aria-expanded={isDrawerOpen}
                data-tip="Open drawer"
                onClick={() => dispatch(openHeaderDrawer())}
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

                    {routeIsEditor && activeProjectUid && mobileView && (
                        <MenuBar />
                    )}

                    <CSLogo size={38} interactive={true} />

                    {routeIsEditor && activeProjectUid && !mobileView && (
                        <MenuBar />
                    )}
                    <div style={{ flexGrow: 1 }} />
                    <div css={SS.headerRightSideGroup}>
                        {routeIsEditor && activeProjectUid && (
                            <TargetControls
                                activeProjectUid={activeProjectUid}
                            />
                        )}
                        {routeIsEditor && activeProjectUid && !mobileView && (
                            <SocialControls
                                activeProjectUid={activeProjectUid}
                            />
                        )}
                    </div>
                    {authenticated ? userMenu() : loginButton()}
                </Toolbar>
            </AppBar>

            <Drawer
                id="top-navigation-drawer"
                open={isDrawerOpen}
                onClose={() => dispatch(closeHeaderDrawer())}
            >
                <div css={SS.drawer}>
                    <div css={SS.drawerHeader}>
                        <h2>Csound Web-IDE</h2>
                    </div>
                    <Divider />
                    <List>
                        <ListItemButton
                            onClick={() =>
                                window.open("/documentation", "_blank")
                            }
                        >
                            <ListItemIcon>
                                <HelpIcon css={SS.drawerIcon} />
                            </ListItemIcon>
                            <ListItemText primary="Site Documentation" />
                        </ListItemButton>
                        <ListItemButton
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
                        </ListItemButton>
                    </List>
                    <Divider />
                    <List>
                        <ListItemButton
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
                        </ListItemButton>
                    </List>
                    {/* <Divider/>
                        <List >
                        <ListItem>
                        <ListItemText primary={`Version: `} />
                        </ListItem>
                        </List> */}
                </div>
            </Drawer>
            {routeIsEditor && !isOwner && !mobileView && <ProjectProfileMeta />}
        </>
    );
};
