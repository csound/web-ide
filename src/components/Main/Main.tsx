import React from "react";
import { connect } from "react-redux";
import Router from "../Router/Router";
import Modal from "../Modal";
import Snackbar from "../Snackbar/Snackbar";
import { ThemeProvider } from "@material-ui/styles";
import { resolveTheme } from "../Themes/themes";
import CssBaseline from "@material-ui/core/CssBaseline";
import { IStore } from "../../db/interfaces";
import { thirdPartyAuthSuccess } from "../Login/actions";
import { History } from "history";
import { mainStylesHOC } from "./styles";
import firebase from "firebase/app";
import * as Sentry from "@sentry/browser";
import HotKeys from "../HotKeys/HotKeys";

interface IMainProps {
    classes: any;
    history: History;
    theme: string;
    thirdPartyAuthSuccess: (user: any) => void;
}

class Main extends React.Component<IMainProps, {}> {
    constructor(props: IMainProps) {
        super(props);

        if (typeof process.env.REACT_APP_SENTRY_DSN !== "undefined") {
            Sentry.init({
                dsn: process.env.REACT_APP_SENTRY_DSN
            });
        }
    }

    componentDidCatch(error, errorInfo) {
        if (typeof process.env.REACT_APP_SENTRY_DSN !== "undefined") {
            Sentry.withScope(scope => {
                Object.keys(errorInfo).forEach(key => {
                    scope.setExtra(key, errorInfo[key]);
                });
                Sentry.captureException(error);
            });
        }
    }

    public componentDidMount() {
        firebase
            .auth()
            .onAuthStateChanged(
                user => !!user && this.props.thirdPartyAuthSuccess(user)
            );
    }

    public render() {
        return (
            <HotKeys>
                <ThemeProvider theme={resolveTheme(this.props.theme)}>
                    <CssBaseline />
                    <Modal />
                    <Snackbar />
                    <Router history={this.props.history} />
                </ThemeProvider>
            </HotKeys>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any) => {
    return {
        classes: ownProp.classes,
        history: ownProp.history,
        theme: store.theme.name
    };
};

const mapDispatchToProps = (dispatch: any): any => ({
    thirdPartyAuthSuccess: user => dispatch(thirdPartyAuthSuccess(user))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(mainStylesHOC(Main));
