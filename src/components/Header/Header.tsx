import React from "react";
import { connect } from "react-redux";
import Login from "../Login/Login";
import * as loginActions from "../Login/actions";
// import classNames from "classnames";
// import { Switch, Route } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    MenuItem,
    Menu
} from "@material-ui/core";
import { AccountCircle, ViewHeadline } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import firebase from "firebase/app";
import "firebase/auth";
// import Editor from "../Editor/Editor";
import { headerStylesHOC } from "./styles";
import { IStore } from "../../db/interfaces";
import { isEmpty } from "lodash";
import * as burgerMenuActions from "../BurgerMenu/actions";

interface IMainProps {
    authenticated: boolean;
    classes: any;
    isLoginDialogOpen: boolean;
    userDisplayName: string | null;
    avatarUrl: string | null | undefined;
}

interface IMainDispatchProperties {
    logOut: () => void;
    openLoginDialog: () => void;
    toggleBurgerMenu: () => void;
}

interface IMainLocalState {
    isProfileMenuOpen: boolean;
}

type IMain = IMainProps & IMainDispatchProperties;

class Main extends React.Component<IMain, IMainLocalState> {

    protected anchorEl: any;

    public readonly state: IMainLocalState = {
        isProfileMenuOpen: false,
    }

    constructor(props: IMain) {
        super(props);
        this.handleProfileMenuOpen = this.handleProfileMenuOpen.bind(this);
        this.handleProfileMenuClose = this.handleProfileMenuClose.bind(this);
        this.anchorEl = React.createRef();
    }

    handleProfileMenuOpen(event: any) {
        this.setState({ isProfileMenuOpen: true });
    }

    handleProfileMenuClose() {
        this.setState({ isProfileMenuOpen: false });
    }

    logout() {
        firebase.auth().signOut();
        this.setState({ isProfileMenuOpen: false });
    };

    render() {
        const { isProfileMenuOpen } = this.state;
        const { authenticated, classes, isLoginDialogOpen,
                openLoginDialog, avatarUrl } = this.props;

        const avatar = isEmpty(avatarUrl) ? (
            <AccountCircle />
        ) : (
            <Avatar src={avatarUrl || ""} />
        );
        const userMenu = () => (
            <div>
                <IconButton
                    aria-owns={isProfileMenuOpen ? "menu-appbar" : undefined}
                    aria-haspopup="true"
                    color="inherit"
                    onClick={this.handleProfileMenuOpen}
                    ref={this.anchorEl}
                >
                    {avatar}
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={this.anchorEl.current}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right"
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right"
                    }}
                    open={isProfileMenuOpen}
                    onClose={this.handleProfileMenuClose}
                >
                    <MenuItem onClick={this.props.logOut}>
                        Logout
                    </MenuItem>
                </Menu>
            </div>
        );

        const loginButton = () => (
            <Button
                color="inherit"
                onClick={() => {
                        this.setState({ isProfileMenuOpen: false });
                        openLoginDialog();
                }}
            >Login
            </Button>
        );

        return (
            <div className={classes.root}>
                {isLoginDialogOpen && <Login />}
                <AppBar position={"relative"}>
                    <Toolbar disableGutters={true}>
                        <Button
                            className={classes.burgerToggler}
                            onClick={this.props.toggleBurgerMenu}
                        >
                            <ViewHeadline />
                        </Button>
                        <Typography
                            variant="subtitle1"
                            color="inherit"
                            className={classes.flex + " " + classes.profileName}
                            noWrap
                            >
                                {this.props.userDisplayName}
                            </Typography>
                            {authenticated ? userMenu() : loginButton()}
                    </Toolbar>
                </AppBar>
            </div>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any): IMainProps => {
    return {
        authenticated: store.LoginReducer.authenticated,
        classes: ownProp.classes,
        isLoginDialogOpen: store.LoginReducer.isLoginDialogOpen,
        userDisplayName: store.userProfile && store.userProfile.name,
        avatarUrl: store.userProfile && store.userProfile.photoUrl,
    };
};

const mapDispatchToProps = (dispatch: any): IMainDispatchProperties => ({
    openLoginDialog: () => dispatch(loginActions.openLoginDialog()),
    logOut: () => dispatch(loginActions.logOut()),
    toggleBurgerMenu: () => dispatch(burgerMenuActions.toggleBurgerMenu()),
});

export default connect( mapStateToProps, mapDispatchToProps)(headerStylesHOC(Main));
