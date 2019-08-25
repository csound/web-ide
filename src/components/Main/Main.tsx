import React from "react";
import { connect } from "react-redux";
import Router from "../Router/Router";
import { ThemeProvider } from '@material-ui/styles';
import { resolveTheme } from "../Themes/themes";
import CssBaseline from '@material-ui/core/CssBaseline';
import { IStore } from "../../db/interfaces";
import { thirdPartyAuthSuccess } from "../Login/actions";
import { History } from "history";
import { mainStylesHOC } from "./styles";
import * as firebase from "firebase/app";

interface IMainProps {
    classes: any;
    history: History;
    theme: string,
    thirdPartyAuthSuccess: (user: any) => void;
}


class Main extends React.Component<IMainProps, {}> {

    public componentDidMount () {
        firebase.auth().onAuthStateChanged(
            (user) => !!user && this.props.thirdPartyAuthSuccess(user)
        );
    }

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

const mapDispatchToProps = (dispatch: any): any => ({
    thirdPartyAuthSuccess: (user) => dispatch(
        thirdPartyAuthSuccess(user)
    ),
});


export default connect(mapStateToProps, mapDispatchToProps)(mainStylesHOC(Main));
