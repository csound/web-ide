import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
// import { BrowserRouter } from "react-router-dom";
// import { ConnectedRouter } from "connected-react-router/esm/index.js";
// import { history } from "@store";
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ThemeProvider>
            <div style={{ position: "absolute" }}>
                <ReactTooltip />
            </div>
            <HotKeys>
                <>
                    <Modal />
                    <IosWarning />
                    <Snackbar />
                    <Router />
                </>
            </HotKeys>
        </ThemeProvider>
    );
};

export default Main;
