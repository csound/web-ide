import { STORE_PROJECT_STARS } from "@comp/projects/types";
import { stars } from "@config/firestore";

export const subscribeToProjectStars = (
    projectUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = stars.doc(projectUid).onSnapshot(
        (stars) => {
            dispatch({
                type: STORE_PROJECT_STARS,
                projectUid,
                stars: stars.data()
            });
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
