import React from "react";
import { connect } from "react-redux";
import Router from "../Router/Router";
import { ThemeProvider } from '@material-ui/styles';
import { resolveTheme } from "../Themes/themes";
import CssBaseline from '@material-ui/core/CssBaseline';
import { IStore } from "../../db/interfaces";
import Csound from "../Csound/CsoundComponent";
import BurgerMenu from "../BurgerMenu/BurgerMenu";
import { History } from "history";
import { mainStylesHOC } from "./styles";
import Header from "../Header/Header";

interface IMainProps {
    classes: any;
    history: History;
    theme: string;
}

class Main extends React.Component<IMainProps, any> {

    public render() {
        return (
            <Csound>
                <ThemeProvider theme={resolveTheme(this.props.theme)}>
                    <CssBaseline />
                    <BurgerMenu />
                    <Header />
                    <Router history={this.props.history} />
                </ThemeProvider>
            </Csound>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        history: ownProp.history,
        theme: store.theme && store.theme.name,
    }
}

export default connect(mapStateToProps, {})(mainStylesHOC(Main));
