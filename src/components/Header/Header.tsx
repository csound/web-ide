import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Login from "../Login/Login";
import * as loginActions from "../Login/actions";
import { push } from "connected-react-router";
import CSLogo from "../CSLogo/CSLogo";
import { Link } from "react-router-dom";
import { AppBar, Toolbar, IconButton, MenuItem, Menu } from "@material-ui/core";
import { AccountBox } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/Menu";
import { headerStylesHOC } from "./styles";
import * as SS from "./styles";
import { IStore } from "../../db/interfaces";
import { isEmpty } from "lodash";
import MenuBar from "../MenuBar/MenuBar";
import clsx from "clsx";

interface IHeaderProps {
    classes: any;
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

export const Header = ({classes, showMenuBar = true }: IHeaderProps) => {
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
    
    // const userDisplayName = useSelector(
    //     (store: IStore) => store.userProfile && store.userProfile.name
    // );

    const anchorEl = useRef(null);

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
                id="menu-appbar"
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
                    <Link to="/profile" className={classes.menuItemLink}>
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
        <div className={classes.root}>
            {isLoginDialogOpen && <Login />}
            <AppBar className={classes.appBar}>
                <Toolbar disableGutters={true} css={SS.toolbar}>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        // onClick={handleDrawerOpen}
                        edge="start"
                        className={clsx(classes.menuButton)}
                    >
                        <MenuIcon />
                    </IconButton>

                    <CSLogo
                        size={38}
                        interactive={true}
                        onClick={handleIconClick}
                    />
                    {showMenuBar && <MenuBar />}
                    <div className={classes.spacer} />
                    {authenticated ? userMenu() : loginButton()}
                </Toolbar>
            </AppBar>
        </div>
    );
};

export default headerStylesHOC(Header);
