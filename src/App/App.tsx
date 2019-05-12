import React from "react";
import { connect } from "react-redux";
import Router from "../Router/Router";
import { ThemeProvider } from '@material-ui/styles';
import { resolveTheme } from "../Themes/themes";
import CssBaseline from '@material-ui/core/CssBaseline';
import { IStore } from "../db/interfaces";
import "./App.css";
import firebase from "firebase/app";
import Csound from "./components/CsoundComponent";
import BurgerMenu from "../containers/BurgerMenu/BurgerMenu";
import { History } from "history";

interface IAppProps {
    history: History;
    theme: string;
}

class App extends React.Component<IAppProps, any> {

    public componentWillMount() {
        firebase.initializeApp({
            apiKey: "AIzaSyCbwSqIRwrsmioXL7b0yqrHJnOcNNqWN9E",
            authDomain: "csound-ide.firebaseapp.com",
            databaseURL: "https://csound-ide.firebaseio.com",
            projectId: "csound-ide",
            storageBucket: "csound-ide.appspot.com",
            messagingSenderId: "1089526309602"
        });
    }

    public render() {
        return (
            <Csound>
                <CssBaseline />
                <ThemeProvider theme={resolveTheme(this.props.theme)}>
                    <BurgerMenu />
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

export default connect(mapStateToProps, {})(App);
