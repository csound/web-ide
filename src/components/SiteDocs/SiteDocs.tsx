import React, { Component } from "react";
import withStyles from "./styles";
import Header from "../Header/Header";

class SiteDocs extends Component<any, {}> {
    public render() {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Header showMenuBar={false} />
                <main>
                    <h1>Csound Web-IDE</h1>
                    <h2>Documentation</h2>
                </main>
            </div>
        );
    }
}

export default withStyles(SiteDocs);
