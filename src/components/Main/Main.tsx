import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { isMobile } from "@root/utils";
import Router from "@comp/Router/Router";
import ThemeProvider from "@styles/ThemeProvider";
import ReactTooltip from "react-tooltip";
import Modal from "@comp/Modal";
import IosWarning from "./IosWarning";
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
    const [autoLoginTimeout, setAutoLoginTimeout] = useState(false);

    useEffect(() => {
        let unsubscribeLoggedInUserProfile: any = null;
        // the observer doesn't know if the login state
        // change is a result of manual login or autologin
        // we determine this from a timeout
        !autoLoginTimeout && setTimeout(() => setAutoLoginTimeout(true), 1000);
        const unsubscribeAuthObserver = firebase
            .auth()
            .onAuthStateChanged(user => {
                if (user) {
                    unsubscribeLoggedInUserProfile = subscribeToLoggedInUserProfile(
                        user.uid,
                        dispatch
                    );
                    dispatch(thirdPartyAuthSuccess(user, !autoLoginTimeout));
                } else {
                    dispatch(setRequestingStatus(false));
                }
            });
        if (!isMobile()) {
            (window as any).ps_body = new PerfectScrollbar("body");
        }

        return () => {
            unsubscribeAuthObserver();
            unsubscribeLoggedInUserProfile && unsubscribeLoggedInUserProfile();
            !isMobile() &&
                (window as any).ps_body &&
                (window as any).ps_body.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <HotKeys>
            <ThemeProvider>
                <Modal />
                <IosWarning />
                <Snackbar />
                <ReactTooltip />
                <Router history={props.history} />
            </ThemeProvider>
        </HotKeys>
    );
};

export default Main;
