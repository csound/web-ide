import { STORE_PROJECT_STARS } from "@comp/projects/types";
import { stars } from "@config/firestore";
import { doc, onSnapshot } from "firebase/firestore";

export const subscribeToProjectStars = (
    projectUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = onSnapshot(
        doc(stars, projectUid),
        (stars) => {
            const starsData = stars.data();
            const starsDataSerializeable = {};
            for (const sdk in starsData) {
                const sdkd = starsData[sdk];
                if (typeof sdkd === "object") {
                    starsDataSerializeable[sdk] = sdkd.toMillis();
                }
            }
            dispatch({
                type: STORE_PROJECT_STARS,
                projectUid,
                stars: starsDataSerializeable
            });
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
