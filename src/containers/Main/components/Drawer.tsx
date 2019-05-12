import {
    Drawer as MUIDrawer,
    List,
    Divider,
    IconButton
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import classNames from "classnames";
import React from "react";
import { mainStylesHook } from "../styles";
import { makeStyles } from "@material-ui/core/styles";
import { StyleRulesCallback, Theme } from '@material-ui/core';
import { mailFolderListItems, otherMailFolderListItems } from "./tileData";

interface IDrawerProps {
    handleDrawerClose: any;
    open: boolean;
}

const Drawer = (props: IDrawerProps) =>  {
    const classes = mainStylesHook(); // React Hook
    const { handleDrawerClose, open } = props;
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
                <IconButton onClick={handleDrawerClose}>
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

export default Drawer;
