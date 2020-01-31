import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Router from "@comp/Router/Router";
import ThemeProvider from "@styles/ThemeProvider";
import Modal from "@comp/Modal";
import Snackbar from "@comp/Snackbar/Snackbar";
import { subscribeToLoggedInUserProfile } from "@comp/Login/subscribers";
import {
    setRequestingStatus,
    thirdPartyAuthSuccess
} from "@comp/Login/actions";
import { History } from "history";
import firebase from "firebase/app";
import HotKeys from "../HotKeys/HotKeys";
import PerfectScrollbar from "perfect-scrollbar/dist/perfect-scrollbar.esm.js";
import "perfect-scrollbar/css/perfect-scrollbar.css";

interface IMain {
    history: History;
}

const Main = (props: IMain) => {
    const dispatch = useDispatch();
    useEffect(() => {
        let unsubscribeLoggedInUserProfile: any = null;
        const unsubscribeAuthObserver = firebase
            .auth()
            .onAuthStateChanged(user => {
                if (user) {
                    dispatch(thirdPartyAuthSuccess(user));
                    unsubscribeLoggedInUserProfile = subscribeToLoggedInUserProfile(
                        user.uid,
                        dispatch
                    );
                } else {
                    dispatch(setRequestingStatus(false));
                }
            });
        (window as any).ps_body = new PerfectScrollbar("body");
        return () => {
            unsubscribeAuthObserver();
            unsubscribeLoggedInUserProfile && unsubscribeLoggedInUserProfile();
            (window as any).ps_body.destroy();
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
