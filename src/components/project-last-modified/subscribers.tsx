import { projectLastModified } from "@config/firestore";
import { updateProjectLastModifiedLocally } from "./actions";

export const subscribeToProjectLastModified = (
    projectUid: string,
    dispatch: (any) => void
): (() => void) => {
    const unsubscribe: () => void = projectLastModified
        .doc(projectUid)
        .onSnapshot(
            (timestampDocument) => {
                if (!timestampDocument.exists) {
                    return;
                }
                const { timestamp } = timestampDocument.data() as any;
                timestamp &&
                    dispatch(
                        updateProjectLastModifiedLocally(projectUid, timestamp)
                    );
            },
            (error: any) => console.error(error)
        );
    return unsubscribe;
};
