import { doc, onSnapshot } from "firebase/firestore";
import { CLEAR_USER_PROFILE_SNAPSHOT, UPDATE_USER_PROFILE } from "./types";
import { profiles } from "@config/firestore";
import { AppThunkDispatch } from "@root/store";

export const subscribeToLoggedInUserProfile = (
    userUid: string,
    dispatch: AppThunkDispatch
): (() => void) => {
    let active = true;
    const clearSnapshot = () => dispatch({ type: CLEAR_USER_PROFILE_SNAPSHOT });
    // Cached profiles can outlive a login. Wait for this listener's snapshot.
    clearSnapshot();
    const unsubscribe: () => void = onSnapshot(
        doc(profiles, userUid),
        (profile) => {
            if (!active) return;
            const profileData = profile.data();
            if (!profileData) {
                console.error("No profile data found for user", {
                    userUid,
                    profile
                });
                dispatch({
                    type: UPDATE_USER_PROFILE,
                    profile: undefined,
                    userUid
                });
                return;
            }
            if (typeof profileData.userJoinDate === "object") {
                profileData.userJoinDate = profileData.userJoinDate.toMillis();
            }
            dispatch({
                type: UPDATE_USER_PROFILE,
                profile: profileData,
                userUid
            });
        },
        (error: any) => {
            if (!active) return;
            clearSnapshot();
            console.error(error);
        }
    );
    return () => {
        if (!active) return;
        active = false;
        unsubscribe();
        clearSnapshot();
    };
};
