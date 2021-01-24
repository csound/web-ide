import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { isMobile } from "@root/utils";
import Router from "@comp/router/router";
import ThemeProvider from "@styles/theme-provider";
import ReactTooltip from "react-tooltip";
import Modal from "@comp/modal";
import IosWarning from "./ios-warning";
import Snackbar from "@comp/snackbar/snackbar";
import { subscribeToLoggedInUserProfile } from "@comp/login/subscribers";
import {
    setRequestingStatus,
    thirdPartyAuthSuccess
} from "@comp/login/actions";
import firebase from "firebase/app";
import "firebase/auth";
import HotKeys from "@comp/hot-keys/hot-keys";
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";

const Main = (): React.ReactElement => {
    const dispatch = useDispatch();
    const [autoLoginTimeout, setAutoLoginTimeout] = useState(false);

    useEffect(() => {
        let unsubscribeLoggedInUserProfile;
        // the observer doesn't know if the login state
        // change is a result of manual login or autologin
        // we determine this from a timeout
        !autoLoginTimeout && setTimeout(() => setAutoLoginTimeout(true), 1000);
        const unsubscribeAuthObserver = firebase
            .auth()
            .onAuthStateChanged((user) => {
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
            (window as any).ps_body = new PerfectScrollbar("#root");
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
                <Router />
            </ThemeProvider>
        </HotKeys>
    );
};

export default Main;
