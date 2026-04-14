import React, { useEffect, useState, useRef } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { selectIsOwnerForProject } from "@comp/project-editor/selectors";
import {
    selectUserImageURL,
    selectLoggedInUserName
} from "@comp/profile/selectors";
import {
    selectLoggedInUid,
    selectLoginRequesting
} from "@comp/login/selectors";
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
    ListItemIcon,
    ListItemText
} from "@mui/material";
import { AccountBox } from "@mui/icons-material";
import Button from "@mui/material/Button";
import useMediaQuery from "@mui/material/useMediaQuery";
import CachedAvatar from "@comp/profile/cached-avatar";
import HelpIcon from "@mui/icons-material/Help";
import GitHubIcon from "@mui/icons-material/GitHub";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import * as SS from "./styles";
import { isEmpty } from "ramda";
import { MenuBar } from "@comp/menu-bar/menu-bar";
import ProjectProfileMeta from "./project-profile-meta";
import { TargetControls } from "@comp/target-controls";
import SocialControls from "@comp/social-controls/social-controls";
import { isMobile } from "@root/utils";

export const Header = () => {
    const dispatch = useDispatch();
    const isCompactViewport = useMediaQuery("(max-width:900px)");
    const mobileView = isMobile() || isCompactViewport;

    const authenticated = useSelector(
        (store: RootState) => store.LoginReducer.authenticated
    );
    const isAuthRequesting = useSelector(selectLoginRequesting);
    const activeProjectUid = useSelector(
        (store: RootState) => store.ProjectsReducer.activeProjectUid
    );

    const currentRoute = useLocation();

    const routeIsHome = currentRoute.pathname === "/";

    const routeIsEditor = currentRoute.pathname.startsWith("/editor");
    const routeProjectUid = routeIsEditor
        ? currentRoute.pathname.split("/")[2] || ""
        : "";
    const editorProjectUid = activeProjectUid || routeProjectUid;
    const projectControlsReady =
        !!editorProjectUid && activeProjectUid === editorProjectUid;

    const routeIsProfile = currentRoute.pathname.startsWith("/profile");

    const routeIsDocumentation = currentRoute.pathname === "/documentation";

    const isOwner = useSelector(selectIsOwnerForProject(editorProjectUid));

    const loggedInUid = useSelector(selectLoggedInUid);

    const loggedInUserName = useSelector(selectLoggedInUserName);

    const avatarUrl = useSelector(selectUserImageURL(loggedInUid || ""));

    const isLoginDialogOpen = useSelector(
        (store: RootState) => store.LoginReducer.isLoginDialogOpen
    );

    const anchorElement = useRef<HTMLButtonElement>(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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

    const utilityLinks = [
        {
            label: "Site Documentation",
            icon: <HelpIcon />,
            onClick: () => window.open("/documentation", "_blank")
        },
        {
            label: "Report an Issue",
            icon: <ReportProblemIcon />,
            onClick: () =>
                window.open(
                    "https://github.com/csound/web-ide/issues",
                    "_blank"
                )
        },
        {
            label: "Github Project",
            icon: <GitHubIcon />,
            onClick: () =>
                window.open("https://github.com/csound/web-ide", "_blank")
        }
    ];

    const utilityMenuAnchor = useRef<HTMLButtonElement>(null);
    const [isUtilityMenuOpen, setIsUtilityMenuOpen] = useState(false);

    const leadingSlot =
        routeIsEditor && mobileView ? (
            <div css={SS.menuSlot}>
                {editorProjectUid ? (
                    <MenuBar projectUid={editorProjectUid} />
                ) : null}
            </div>
        ) : (
            <div css={SS.spacer} />
        );

    const editorControlsPlaceholder = (
        <div css={SS.headerControlsPlaceholder}>
            <span css={SS.headerControlCircle} />
            <span css={SS.headerControlCircle} />
        </div>
    );

    const utilityNav = (
        <div css={SS.utilityNav}>
            <IconButton
                ref={utilityMenuAnchor}
                size="small"
                css={SS.utilityToggle}
                onClick={() => setIsUtilityMenuOpen(true)}
                aria-label="Help and links"
                aria-controls={isUtilityMenuOpen ? "utility-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={isUtilityMenuOpen}
            >
                <HelpIcon />
            </IconButton>
            <Menu
                id="utility-menu"
                anchorEl={utilityMenuAnchor.current}
                open={isUtilityMenuOpen}
                onClose={() => setIsUtilityMenuOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                {utilityLinks.map(({ label, icon, onClick }) => (
                    <MenuItem
                        key={label}
                        onClick={() => {
                            setIsUtilityMenuOpen(false);
                            onClick();
                        }}
                    >
                        <ListItemIcon>{icon}</ListItemIcon>
                        <ListItemText>{label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );

    return (
        <>
            {isLoginDialogOpen && <Login />}
            <AppBar position={"fixed"} css={SS.headerRoot}>
                <Toolbar disableGutters={true} css={SS.toolbar}>
                    {leadingSlot}

                    <CSLogo size={38} interactive={true} />

                    {routeIsEditor && editorProjectUid && !mobileView && (
                        <MenuBar projectUid={editorProjectUid} />
                    )}
                    <div style={{ flexGrow: 1 }} />
                    {routeIsEditor ? (
                        <div css={SS.headerRightSideGroup}>
                            {editorProjectUid && projectControlsReady && (
                                <TargetControls
                                    activeProjectUid={editorProjectUid}
                                />
                            )}
                            {editorProjectUid &&
                                !projectControlsReady &&
                                editorControlsPlaceholder}
                            {editorProjectUid &&
                                projectControlsReady &&
                                !mobileView && (
                                    <SocialControls
                                        activeProjectUid={editorProjectUid}
                                    />
                                )}
                        </div>
                    ) : (
                        <div css={SS.defaultRightSideGroup} />
                    )}
                    {!mobileView && utilityNav}
                    <div css={SS.authSlot}>
                        {isAuthRequesting ? (
                            <div css={SS.authPlaceholder} />
                        ) : authenticated ? (
                            userMenu()
                        ) : (
                            loginButton()
                        )}
                    </div>
                </Toolbar>
            </AppBar>
            {routeIsEditor && !isOwner && !mobileView && <ProjectProfileMeta />}
        </>
    );
};
