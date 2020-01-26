import { profiles } from "@config/firestore";
import { getUserProfileAction } from "./actions";

export const subscribeToProfile = (profileUid: string, dispatch: any) => {
    const unsubscribe: () => void = profiles.doc(profileUid).onSnapshot(
        profile => {
            dispatch(
                getUserProfileAction({
                    profile: profile.data(),
                    profileUid
                })
            );
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
