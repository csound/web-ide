import { doc, onSnapshot } from "firebase/firestore";
import { UPDATE_USER_PROFILE } from "./types";
import { profiles } from "@config/firestore";

export const subscribeToLoggedInUserProfile = (
    userUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(profiles, userUid),
        (profile) => {
            const profileData: any = profile.data();
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
