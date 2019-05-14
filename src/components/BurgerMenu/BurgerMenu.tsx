import React, { Component } from "react";
import { connect } from "react-redux";
import { slide as Menu} from "react-burger-menu";
// import Button from "@material-ui/core/Button";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
// import Collapse from "@material-ui/core/Collapse";
// import ExpandLess from "@material-ui/icons/ExpandLess";
// import ExpandMore from "@material-ui/icons/ExpandMore";
import CustomizeIcon from "@material-ui/icons/FilterBAndW";
// import IncreaseIcon from "@material-ui/icons/Add";
// import DecreaseIcon from "@material-ui/icons/Remove";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub } from "@fortawesome/free-brands-svg-icons"
import { IStore } from "../../db/interfaces";
import { burgerMenuStylesHOC } from "./styles";
import * as burgerMenuActions from "./actions";


interface IBurgerMenuProps {
    classes: any;
    isOpen: boolean;
}

interface IBurgerMenuDispatchProps {
    setBurgerMenuState: (isOpen: boolean) => void;
}

interface IBurgerMenuLocalState {
    isCustomizeExpanded: boolean;
    isThemesExpanded: boolean;
}

function ListItemLink(props: any) {
    return <ListItem button component="a" {...props} />;
}

class BurgerMenu extends Component<IBurgerMenuProps & IBurgerMenuDispatchProps, {}> {

    public readonly state: IBurgerMenuLocalState = {
        isCustomizeExpanded: false,
        isThemesExpanded: false,
    }

    constructor(props: any) {
        super(props);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.toggleCustomizeExpander = this.toggleCustomizeExpander.bind(this);
        this.toggleThemesExpander = this.toggleThemesExpander.bind(this);
    }

    handleStateChange({isOpen}: any) {
        if (isOpen !== this.props.isOpen) {
            this.props.setBurgerMenuState(isOpen);
        }
    }

    toggleCustomizeExpander() {
        this.setState({
            isCustomizeExpanded: !this.state.isCustomizeExpanded
        });
    }

    toggleThemesExpander() {
        this.setState({
            isThemesExpanded: !this.state.isThemesExpanded
        });
    }

    render() {
        const { classes, isOpen } = this.props;
        // const open = true;
        return (
            <Menu
                className={classes.root}
                menuClassName={classes.menu}
                isOpen={isOpen}
                onStateChange={this.handleStateChange}
            >
                <List component="nav">
                    <ListItem button onClick={this.toggleCustomizeExpander}>
                        <ListItemIcon>
                            <CustomizeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Customize" />
                    </ListItem>
                </List>
                <Divider />
                <List component="nav">
                    <ListItemLink href="https://www.github.com/csound/web-ide">
                        <ListItemIcon>
                            <FontAwesomeIcon
                                icon={faGithub}
                                style={{width: "56px", height: "24px"}}
                            />
                        </ListItemIcon>
                        <ListItemText primary="Find us on Github" />
                    </ListItemLink>
                </List>
            </Menu>
        )
    }
}

const mapStateToProps = (store: IStore, ownProp: any): IBurgerMenuProps => {
    return {
        classes: ownProp.classes,
        isOpen: store.burgerMenu && store.burgerMenu.isOpen,
    };
};

const mapDispatchToProps = (dispatch: any): IBurgerMenuDispatchProps => ({
    setBurgerMenuState: (isOpen) => dispatch(burgerMenuActions.setOpenState(isOpen)),
});


export default connect(mapStateToProps, mapDispatchToProps)(burgerMenuStylesHOC(BurgerMenu));

// {this.state.isCustomizeExpanded ? <ExpandLess /> : <ExpandMore />}
// <Collapse in={this.state.isCustomizeExpanded} timeout="auto" unmountOnExit>
// <List component="div" disablePadding>
// <ListItem className={classes.nested}>
// <ListItemText primary="Editor Fontsize" />
// <Button className={classes.inlineButtons}>
// <IncreaseIcon />
// </Button>
// <Button className={classes.inlineButtons}>
// <DecreaseIcon />
// </Button>
// </ListItem>
// <ListItem className={classes.nested}>
// <ListItemText primary="Console Fontsize" />
// <Button className={classes.inlineButtons}>
// <IncreaseIcon />
// </Button>
// <Button className={classes.inlineButtons}>
// <DecreaseIcon />
// </Button>
// </ListItem>
// <ListItem button className={classes.nested} onClick={this.toggleThemesExpander} >
// <ListItemText primary="Themes" />
// {this.state.isThemesExpanded ? <ExpandLess /> : <ExpandMore />}
// </ListItem>
// <Collapse in={this.state.isThemesExpanded} timeout="auto" unmountOnExit>
// <List component="div" disablePadding>
// <ListItem button className={classes.doubleNested}>
// <ListItemText primary="dark" />
// </ListItem>
// </List>
// </Collapse>
// <ListItem button className={classes.nested} onClick={this.toggleThemesExpander} >
// <ListItemText primary="Typography" />
// {this.state.isThemesExpanded ? <ExpandLess /> : <ExpandMore />}
// </ListItem>
// <Collapse in={this.state.isThemesExpanded} timeout="auto" unmountOnExit>
// <List component="div" disablePadding>
// <ListItem button className={classes.doubleNested}>
// <ListItemText primary="monospace" />
// </ListItem>
// </List>
// </Collapse>
// </List>
// </Collapse>
