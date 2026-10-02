import { parseArgs } from "node:util";
import {
    Firestore,
    FieldPath,
    QueryDocumentSnapshot
} from "firebase-admin/firestore";
import { syncProjectStarCount } from "../src/project_stars.js";

const { values } = parseArgs({
    options: {
        project: { type: "string" },
        apply: { type: "boolean", default: false }
    }
});
if (!values.project) {
    throw new Error(
        "Usage: tsx functions/scripts/backfill-star-counts.ts --project ID [--apply]"
    );
}

const db = new Firestore({ projectId: values.project });
let cursor: QueryDocumentSnapshot | undefined;
let checked = 0;
let changed = 0;
try {
    for (;;) {
        let query = db
            .collection("projects")
            .orderBy(FieldPath.documentId())
            .select("starCount")
            .limit(100);
        if (cursor) query = query.startAfter(cursor);
        const page = await query.get();
        if (page.empty) break;
        for (const project of page.docs) {
            const result = await syncProjectStarCount(
                db,
                project.id,
                values.apply
            );
            checked++;
            if (result.changed) {
                changed++;
                console.log(
                    JSON.stringify({ ...result, applied: values.apply })
                );
            }
        }
        cursor = page.docs.at(-1);
    }
    console.log(
        JSON.stringify({
            project: values.project,
            apply: values.apply,
            checked,
            changed
        })
    );
} finally {
    await db.terminate();
}
