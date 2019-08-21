import React, { Component } from "react";
import withStyles from "./styles";
import { Link } from 'react-router-dom'
import Header from "../Header/Header";

class Home extends Component<any, {}> {
    public render() {

        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Header showMenuBar={false}/>
                <main>
                <h1>Csound Web-IDE</h1>
                <p>
                    Welcome to the Csound Web-IDE. This project is currently
                    under development.
                </p>
                </main>
                <div className={classes.centerBox}>
                    <Link to="/editor" className={classes.startCodingButton}>
                        Start Coding
                    </Link>
                </div>
            </div>
        )
    }
}

export default withStyles(Home);
