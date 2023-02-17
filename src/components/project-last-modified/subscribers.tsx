import { doc, onSnapshot } from "firebase/firestore";
import { store } from "@root/store";
import { projectLastModified } from "@config/firestore";
import { updateProjectLastModifiedLocally } from "./actions";

export const subscribeToProjectLastModified = async (
    projectUid: string
): Promise<() => void> => {
    const unsubscribe: () => void = onSnapshot(
        doc(projectLastModified, projectUid),
        async (timestampDocument) => {
            if (!timestampDocument.exists()) {
                return;
            }

            const { timestamp } = timestampDocument.data();
            timestamp &&
                (await store.dispatch(
                    updateProjectLastModifiedLocally(
                        projectUid,
                        timestamp.toMillis()
                    )
                ));
        },
        (error: any) => console.error(error)
    );
    return unsubscribe;
};
