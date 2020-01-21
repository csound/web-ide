import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Router from "../Router/Router";
import ThemeProvider from "@styles/ThemeProvider";
import Modal from "../Modal";
import Snackbar from "../Snackbar/Snackbar";
import { thirdPartyAuthSuccess } from "../Login/actions";
import { History } from "history";
import firebase from "firebase/app";
import HotKeys from "../HotKeys/HotKeys";
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";

interface IMain {
    history: History;
}

const Main = (props: IMain) => {
    const dispatch = useDispatch();

    useEffect(() => {
        firebase
            .auth()
            .onAuthStateChanged(
                user => !!user && dispatch(thirdPartyAuthSuccess(user))
            );
        const ps = new PerfectScrollbar("body");
        return () => {
            console.log("DESTROY");
            ps.destroy();
        };
        // eslint-disable-next-line
    }, []);

    return (
        <HotKeys>
            <ThemeProvider>
                <Modal />
                <Snackbar />
                <Router history={props.history} />
            </ThemeProvider>
        </HotKeys>
    );
};

export default Main;
