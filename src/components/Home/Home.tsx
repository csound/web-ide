import React, { Component } from "react";
import withStyles from "./styles";
import { Link } from 'react-router-dom'

class Home extends Component<any, {}> {
    public render() {

        const { classes } = this.props;
        return (
            <div className={classes.root}>
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
