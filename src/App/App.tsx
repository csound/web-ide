import React from "react";
import Router from "../Router/Router";
import "./App.css";
import firebase from "firebase/app";
import Csound from "./components/CsoundComponent";
import { History } from "history";

interface IAppProps {
    history: History;
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
                <Router history={this.props.history} />
            </Csound>
        );
    }
}

export default App;
