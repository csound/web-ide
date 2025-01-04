import { useEffect, useState } from "react";
import { useDispatch } from "@root/store";
import { isMobile } from "@root/utils";
import { WebIdeRouter } from "@comp/router/router";
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
import { ConsoleProvider } from "@comp/console/context";
import HotKeys from "@comp/hot-keys/hot-keys";

const Main = () => {
    const dispatch = useDispatch();
    const [autoLoginTimeout, setAutoLoginTimeout] = useState(false);

    useEffect(() => {
        let unsubscribeLoggedInUserProfile: () => void;
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
            <ConsoleProvider>
                <HotKeys>
                    <Modal />
                    <IosWarning />
                    <Snackbar />
                    <WebIdeRouter />
                </HotKeys>
            </ConsoleProvider>
        </ThemeProvider>
    );
};

export default Main;
