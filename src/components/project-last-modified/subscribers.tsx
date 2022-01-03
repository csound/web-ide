import { doc, onSnapshot } from "firebase/firestore";
import { projectLastModified } from "@config/firestore";
import { updateProjectLastModifiedLocally } from "./actions";

export const subscribeToProjectLastModified = async (
    projectUid: string,
    dispatch: (any) => void
): Promise<() => void> => {
    const unsubscribe: () => void = onSnapshot(
        doc(projectLastModified, projectUid),
        async (timestampDocument) => {
            if (!timestampDocument.exists()) {
                return;
            }

            const { timestamp } = timestampDocument.data();
            timestamp &&
                (await dispatch(
                    updateProjectLastModifiedLocally(projectUid, timestamp)
                ));
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
