import { getCurrentUserPromise, usernames, profiles } from "@config/firestore";
import { getUserProfileAction } from "./actions";
import { push } from "connected-react-router";

export const subscribeToProfile = async (
    username: string | null,
    dispatch: any
) => {
    const loggedInUser: any = await getCurrentUserPromise();
    if (!username && !loggedInUser) {
        dispatch(push("/404", { message: "User not found." }));
        return;
    }

    let profileUid: string | null = null;
    if (typeof username === "string" && username.length > 0) {
        const usernameDocRef = await usernames.doc(username).get();
        if (!usernameDocRef.exists) {
            dispatch(push("/404", { message: "User not found." }));
            return;
        }
        const usernameDoc: any = usernameDocRef.data();
        if (usernameDoc === null) {
            dispatch(push("/404", { message: "User not found" }));
            return;
        }
        profileUid = usernameDoc.userUid;
    } else {
        profileUid = loggedInUser ? loggedInUser.uid : null;
    }

    if (!profileUid) {
        dispatch(push("/404", { message: "User not found." }));
        return;
    }

    // const loggedInUid = loggedInUser ? loggedInUser.uid : null;

    const unsubscribe: () => void = profiles.doc(profileUid).onSnapshot(
        profile => {
            dispatch(
                getUserProfileAction({
                    profile: profile.data(),
                    loggedInUid: loggedInUser ? loggedInUser.uid : null,
                    profileUid
                })
            );
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
