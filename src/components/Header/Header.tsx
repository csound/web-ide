import React from "react";
import { connect } from "react-redux";
import Login from "../Login/Login";
import * as loginActions from "../Login/actions";
// import classNames from "classnames";
// import { Switch, Route } from "react-router-dom";
import { Link } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    MenuItem,
    Menu
} from "@material-ui/core";
import { AccountCircle } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import firebase from "firebase/app";
import "firebase/auth";
import { headerStylesHOC } from "./styles";
import { IStore } from "../../db/interfaces";
import { isEmpty } from "lodash";
import MenuBar from "../MenuBar/MenuBarIndex";

interface IHeaderProps {
    authenticated: boolean;
    avatarUrl: string | null | undefined;
    classes: any;
    isLoginDialogOpen: boolean;
    // theme: Theme;
    userDisplayName: string | null;
    showMenuBar: boolean;
}

interface IHeaderDispatchProperties {
    logOut: () => void;
    openLoginDialog: () => void;
}

interface IHeaderLocalState {
    isProfileMenuOpen: boolean;
}

type IHeader = IHeaderProps & IHeaderDispatchProperties;

class Header extends React.Component<IHeader, IHeaderLocalState> {

    static defaultProps = {
        showMenuBar: true,
    }

    protected anchorEl: any;

    public readonly state: IHeaderLocalState = {
        isProfileMenuOpen: false,
    }

    constructor(props: IHeader) {
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
            <Avatar
                src={avatarUrl || ""}
                style={{maxHeight: "24px",
                        maxWidth: "24px",
                        padding: "0!important"}}
            />
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
                    <MenuItem>
                      <Link to="/profile" className={classes.menuItemLink}>
                          View Profile
                      </Link>
                    </MenuItem>
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
                <AppBar className={classes.appBar}>
                    <Toolbar disableGutters={true}>
                        {this.props.showMenuBar && <MenuBar />}
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

const mapStateToProps = (store: IStore, ownProps: any): IHeaderProps => {
    return {
        authenticated: store.LoginReducer.authenticated,
        avatarUrl: store.userProfile && store.userProfile.photoUrl,
        classes: ownProps.classes,
        isLoginDialogOpen: store.LoginReducer.isLoginDialogOpen,
        userDisplayName: store.userProfile && store.userProfile.name,
        showMenuBar: ownProps.showMenuBar,
    };
};

const mapDispatchToProps = (dispatch: any): IHeaderDispatchProperties => ({
    logOut: () => dispatch(loginActions.logOut()),
    openLoginDialog: () => dispatch(loginActions.openLoginDialog()),
});

export default connect( mapStateToProps, mapDispatchToProps)(headerStylesHOC(Header));
