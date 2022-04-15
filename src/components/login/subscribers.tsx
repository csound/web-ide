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
            dispatch({
                type: UPDATE_USER_PROFILE,
                profile: profile.data(),
                userUid
            });
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
