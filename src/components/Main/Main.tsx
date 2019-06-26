import React from "react";
import { connect } from "react-redux";
import Router from "../Router/Router";
import { ThemeProvider } from '@material-ui/styles';
import { resolveTheme } from "../Themes/themes";
import CssBaseline from '@material-ui/core/CssBaseline';
import { IStore } from "../../db/interfaces";
import { History } from "history";
import { mainStylesHOC } from "./styles";

interface IMainProps {
    classes: any;
    history: History;
    theme: string,
}


class Main extends React.Component<IMainProps, {}> {

    public render() {

        return (
            <ThemeProvider theme={resolveTheme(this.props.theme)}>
                <CssBaseline />
                <Router history={this.props.history} />
            </ThemeProvider>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        classes: ownProp.classes,
        history: ownProp.history,
        theme: store.theme.name,
    }
}

export default connect(mapStateToProps, {})(mainStylesHOC(Main));
