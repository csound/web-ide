import React from "react";
import { connect } from "react-redux";
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
import firebase from "firebase/app";
import "firebase/auth";
import Editor from "../../pages/Editor/Editor";
import { styles } from "./styles";
import { withStyles, createStyles } from "@material-ui/core/styles";
import { IStore } from "../../db/interfaces";

interface IMainProps {
    classes: any;
}

interface IMainLocalState {
    anchorEl: any;
}

class Main extends React.Component<IMainProps, IMainLocalState> {

    public readonly state: IMainLocalState = {
        anchorEl: null,
    }

    constructor(props: IMainProps) {
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
        const { classes } = this.props;
        const { anchorEl } = this.state;
        const open = Boolean(anchorEl);

        return (
            <div className={classes.root}>
                <AppBar position="absolute">
                    <Toolbar disableGutters={false}>
                        <Typography
                            variant="h5"
                            color="inherit"
                            className={classes.flex}
                            noWrap
                        >
                            Csound Web-IDE
                        </Typography>
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
        classes: ownProp.classes,
    };
};

export default connect( mapStateToProps, {})(withStyles(createStyles(styles))(Main));
