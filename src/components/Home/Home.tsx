import React, { Component } from "react";
import withStyles from "./styles";
import Header from "../Header/Header";
import { Typography } from "@material-ui/core";

class Home extends Component<any, {}> {
    public render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Header showMenuBar={false} />
                <main className={classes.main}>
                    <Typography>
                        <h1>Csound Web-IDE</h1>
                        <p>
                            Welcome to the Csound Web-IDE. This project is currently
                            under development.
                        </p>
                        <p>
                            Login and visit your profile page to get started
                            creating new projects.
                        </p>
                    </Typography>
                </main>
            </div>
        );
    }
}

export default withStyles(Home);
