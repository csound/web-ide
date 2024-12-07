import React, { useEffect, useState } from "react";
import { useDispatch } from "@root/store";
import { isMobile } from "@root/utils";
import Router from "@comp/router/router";
import ThemeProvider from "@styles/theme-provider";
import Modal from "@comp/modal";
import IosWarning from "./ios-warning";
import Snackbar from "@comp/snackbar/snackbar";
import { subscribeToLoggedInUserProfile } from "@comp/login/subscribers";
import {
    setRequestingStatus,
    thirdPartyAuthSuccess
} from "@comp/login/actions";
import { getAuth } from "firebase/auth";
import HotKeys from "@comp/hot-keys/hot-keys";

const Main = (): React.ReactElement => {
    const dispatch = useDispatch();
    const [autoLoginTimeout, setAutoLoginTimeout] = useState(false);

    useEffect(() => {
        let unsubscribeLoggedInUserProfile;
        // the observer doesn't know if the login state
        // change is a result of manual login or autologin
        // we determine this from a timeout
        !autoLoginTimeout && setTimeout(() => setAutoLoginTimeout(true), 1000);
        const unsubscribeAuthObserver = getAuth().onAuthStateChanged((user) => {
            if (user) {
                unsubscribeLoggedInUserProfile = subscribeToLoggedInUserProfile(
                    user.uid,
                    dispatch
                );
                const tsIsSometimesStupidUser = {
                    uid: user.uid,
                    displayName: user.displayName || undefined
                };
                dispatch(
                    thirdPartyAuthSuccess(
                        tsIsSometimesStupidUser,
                        !autoLoginTimeout
                    )
                );
            } else {
                dispatch(setRequestingStatus(false));
            }
        });
        // if (!isMobile()) {
        //     (window as any).ps_body = new PerfectScrollbar("#root");
        // }

        return () => {
            unsubscribeAuthObserver();
            unsubscribeLoggedInUserProfile && unsubscribeLoggedInUserProfile();
            !isMobile() &&
                (window as any).ps_body &&
                (window as any).ps_body.destroy();
        };
    }, []);

    return (
        <ThemeProvider>
            <Router>
                <>
                    <Modal />
                    <IosWarning />
                    <Snackbar />
                </>
            </Router>
        </ThemeProvider>
    );
};

export default Main;
