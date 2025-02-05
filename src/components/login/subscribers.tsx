import { doc, onSnapshot } from "firebase/firestore";
import { UPDATE_USER_PROFILE } from "./types";
import { profiles } from "@config/firestore";
import { AppThunkDispatch } from "@root/store";

export const subscribeToLoggedInUserProfile = (
    userUid: string,
    dispatch: AppThunkDispatch
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(profiles, userUid),
        (profile) => {
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
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
