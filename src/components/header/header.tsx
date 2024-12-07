import React, { RefObject, useState, useRef } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { selectCurrentRoute } from "@comp/router/selectors";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { selectUserImageURL, selectUserName } from "@comp/profile/selectors";
import { selectLoggedInUid } from "@comp/login/selectors";
import AppBar from "@mui/material/AppBar";
import Login from "@comp/login/login";
import * as loginActions from "@comp/login/actions";
import CSLogo from "@comp/cs-logo/cs-logo";
import { Link } from "react-router-dom";
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
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import HelpIcon from "@mui/icons-material/Help";
import GitHubIcon from "@mui/icons-material/GitHub";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import * as SS from "./styles";
// import { tooltipClasses } from "@comp/styles";
import { isEmpty } from "ramda";
import MenuBar from "@comp/menu-bar/menu-bar";
import ProjectProfileMeta from "./project-profile-meta";
import TargetControls from "@comp/target-controls";
import SocialControls from "@comp/social-controls/social-controls";

const Header = (): React.ReactElement => {
    const dispatch = useDispatch();

    const authenticated = useSelector(
        (store: RootState) => store.LoginReducer.authenticated
    );
    const activeProjectUid = useSelector(
        (store: RootState) => store.ProjectsReducer.activeProjectUid
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
        (store: RootState) => store.LoginReducer.isLoginDialogOpen
    );

    const anchorElement: RefObject<HTMLButtonElement | null> = useRef(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleProfileMenuOpen = () => {
        setIsProfileMenuOpen(true);
    };

    const handleProfileMenuClose = () => {
        setIsProfileMenuOpen(false);
    };

    const logout = () => dispatch(loginActions.logOut());
    const openLoginDialog = () => dispatch(loginActions.openLoginDialog());

    const avatar = isEmpty(avatarUrl) ? (
        <AccountBox />
    ) : (
        <Avatar src={avatarUrl || ""} css={SS.avatar} />
    );

    const userMenu = () => (
        <div css={SS.userMenu}>
            <IconButton
                aria-owns={isProfileMenuOpen ? "menu-appbar" : undefined}
                data-tip="UserMenu"
                aria-haspopup="true"
                color="inherit"
                onClick={handleProfileMenuOpen}
                ref={anchorElement}
                component="button"
            >
                {avatar as any}
            </IconButton>
            <Menu
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
        routeIsHome || routeIsProfile ? (
            <IconButton
                color="inherit"
                aria-label="open drawer"
                data-tip="Open drawer"
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

                    <CSLogo size={38} interactive={true} />

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
        </>
    );
};

export default Header;
