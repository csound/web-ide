import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Router from "@comp/Router/Router";
import ThemeProvider from "@styles/ThemeProvider";
import Modal from "@comp/Modal";
import Snackbar from "@comp/Snackbar/Snackbar";
import {
    setRequestingStatus,
    thirdPartyAuthSuccess
} from "@comp/Login/actions";
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
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                dispatch(thirdPartyAuthSuccess(user));
            } else {
                dispatch(setRequestingStatus(false));
            }
        });
        const ps = new PerfectScrollbar("body");
        return () => {
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
