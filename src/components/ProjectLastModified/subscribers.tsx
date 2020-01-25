import { projectLastModified } from "@config/firestore";
import { updateProjectLastModifiedLocally } from "./actions";

export const subscribeToProjectLastModified = (
    projectUid: string,
    dispatch: any
) => {
    const unsubscribe: () => void = projectLastModified
        .doc(projectUid)
        .onSnapshot(
            timestampDoc => {
                if (!timestampDoc.exists) return;
                const { timestamp } = timestampDoc.data() as any;
                timestamp &&
                    dispatch(
                        updateProjectLastModifiedLocally(projectUid, timestamp)
                    );
            },
            (error: any) => console.error(error)
        );
    return unsubscribe;
};
