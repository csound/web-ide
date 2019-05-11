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
import { WithStyles, withStyles, createStyles } from "@material-ui/core/styles";
import { mailFolderListItems, otherMailFolderListItems } from "./tileData";

interface IDrawer {
    classes: any;
    handleDrawerClose: any;
    open: boolean;
}


class Drawer extends React.Component<WithStyles & IDrawer, any> {
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

export default withStyles(createStyles(styles))(Drawer);
