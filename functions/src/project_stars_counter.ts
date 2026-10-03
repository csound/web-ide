import admin from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { syncProjectStarCount } from "./project_stars.js";

// Older browser tabs still write star records directly. Reconcile those writes
// from the current record, never from an event that may arrive out of order.
export const projectStarsCounter = onDocumentWritten(
    { document: "stars/{projectUid}", retry: true },
    async (event) => {
        if (event.data)
            await syncProjectStarCount(
                admin.firestore(),
                event.params.projectUid
            );
    }
);
