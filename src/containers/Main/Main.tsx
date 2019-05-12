import React from "react";
import { connect } from "react-redux";
import Login from "../Login/Login";
import * as loginActions from "../Login/actions";
// import classNames from "classnames";
import { Switch, Route } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    MenuItem,
    Menu
} from "@material-ui/core";
import { AccountCircle } from "@material-ui/icons";
import Button from "@material-ui/core/Button";
import firebase from "firebase/app";
import "firebase/auth";
import Editor from "../../pages/Editor/Editor";
import { mainStylesHOC } from "./styles";
import { IStore } from "../../db/interfaces";
// import { merge } from "lodash";

interface IMainProps {
    authenticated: boolean;
    classes: any;
    isLoginDialogOpen: boolean;
}

interface IMainDispatchProperties {
    openLoginDialog: () => void;
}

interface IMainLocalState {
    anchorEl: any;
}

type IMain = IMainProps & IMainDispatchProperties;

class Main extends React.Component<IMain, IMainLocalState> {

    public readonly state: IMainLocalState = {
        anchorEl: null,
    }

    constructor(props: IMain) {
        super(props);
        this.handleMenu = this.handleMenu.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    handleMenu(event: any) {
        this.setState({ anchorEl: event.currentTarget });
    }

    handleClose() {
        this.setState({ anchorEl: null });
    }

    logout() {
        firebase.auth().signOut();
    };

    render() {
        const { anchorEl } = this.state;
        const { authenticated, classes, isLoginDialogOpen,
                openLoginDialog } = this.props;
        const open = Boolean(anchorEl);
        const userMenu = () => (
            <div>
                <IconButton
                    aria-owns={open ? "menu-appbar" : undefined}
                    aria-haspopup="true"
                    onClick={this.handleMenu}
                    color="inherit"
                >
                    <AccountCircle />
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right"
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right"
                    }}
                    open={open}
                    onClose={this.handleClose}
                >
                    <MenuItem onClick={this.logout}>
                        Logout
                    </MenuItem>
                </Menu>
            </div>
        );

        const loginButton = () => (
            <Button
                color="inherit"
                onClick={() => openLoginDialog()}
            >Login</Button>
        );

        return (
            <div className={classes.root}>
                {isLoginDialogOpen && <Login />}
                <AppBar position="absolute">
                    <Toolbar disableGutters={false}>
                        <Typography
                            variant="h5"
                            color="inherit"
                            className={classes.flex}
                            noWrap
                        >
                            {"Csound Web-IDE"}
                        </Typography>
                        {authenticated ? userMenu() : loginButton()}
                    </Toolbar>
                </AppBar>
                <main className={classes.content}>
                    <div className={classes.toolbar} />
                    <Switch>
                        <Route path="/" component={Editor} />
                    </Switch>
                </main>
            </div>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any): IMainProps => {
    return {
        authenticated: store.LoginReducer.authenticated,
        classes: ownProp.classes,
        isLoginDialogOpen: store.LoginReducer.isLoginDialogOpen,
    };
};

const mapDispatchToProps = (dispatch: any): IMainDispatchProperties => ({
    openLoginDialog: () => dispatch(loginActions.openLoginDialog())
});

export default connect( mapStateToProps, mapDispatchToProps)(mainStylesHOC(Main));
