import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import classNames from "classnames";
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
import firebase from "firebase";
import Editor from "../../pages/Editor/Editor";
import { styles } from "./styles";
import { withStyles } from "@material-ui/core/styles";

class Main extends React.Component {
    state = {
        anchorEl: null
    };

    handleMenu = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
        this.setState({ anchorEl: null });
    };

    logout = () => {
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
                            variant="title"
                            color="inherit"
                            className={classes.flex}
                            noWrap
                        >
                            Csound Web-IDE
                        </Typography>
                        <div>
                            <IconButton
                                aria-owns={open ? "menu-appbar" : null}
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

const mapStateToProps = (store, ownProp) => {
    return {};
};

const mapDispatchToProps = (dispatch) => ({});


export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Main));
