import {
    Drawer as MUIDrawer,
    List,
    Divider,
    IconButton
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import classNames from "classnames";
import React from "react";
import { styles } from "../styles";
import { withStyles } from "@material-ui/core/styles";
import { mailFolderListItems, otherMailFolderListItems } from "./tileData";

class Drawer extends React.Component {
    state = {};
    render() {
        const { classes, open } = this.props;
        return (
            <MUIDrawer
                variant="permanent"
                classes={{
                    paper: classNames(
                        classes.drawerPaper,
                        !open && classes.drawerPaperClose
                    )
                }}
                open={open}
            >
                <div className={classes.toolbar}>
                    <IconButton onClick={this.props.handleDrawerClose}>
                        <ChevronLeftIcon />
                    </IconButton>
                </div>
                <Divider />
                <List>{mailFolderListItems}</List>
                <Divider />
                <List>{otherMailFolderListItems}</List>
            </MUIDrawer>
        );
    }
}

export default withStyles(styles)(Drawer);
