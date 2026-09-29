import admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { isbot } from "isbot";
import fs from "node:fs";

const ogPlaceholder = /<meta name="functions-insert-dynamic-og"\s*\/?>/;

export const host = onRequest(async (req, res) => {
    // Recheck visibility on each request, including after a project is hidden.
    res.set("Cache-Control", "private, no-store");
    try {
        let indexHTML = fs.readFileSync("./dist/index.html").toString();
        const reqPath = req.path ? req.path.split("/") : req.path;

        if (
            isbot(req.headers["user-agent"] || "") &&
            reqPath &&
            reqPath.length > 1 &&
            reqPath[1] === "editor"
        ) {
            const projectUid = reqPath[2];
            if (!projectUid) {
                res.status(404).send();
                return;
            }

            const projectSnapshot = await admin
                .firestore()
                .collection("projects")
                .doc(projectUid)
                .get();

            const projectData = projectSnapshot.data();
            // Admin SDK reads bypass Firestore rules. Only public projects may
            // contribute metadata to this unauthenticated page response.
            if (!projectSnapshot.exists || projectData?.public !== true) {
                res.status(404).send();
                return;
            }

            const userUid = projectData.userUid;
            if (typeof userUid !== "string" || !userUid) {
                res.status(404).send();
                return;
            }

            const profileSnap = await admin
                .firestore()
                .collection("profiles")
                .doc(userUid)
                .get();

            const profile = profileSnap.data();
            if (!profileSnap.exists || !profile) {
                res.status(404).send();
                return;
            }

            indexHTML = indexHTML.replace(
                ogPlaceholder,
                // A callback keeps $&, $` and $' in user text literal.
                () => getProjectOg(projectData, profile, projectUid)
            );
            res.status(200).send(indexHTML);
        } else {
            indexHTML = indexHTML.replace(ogPlaceholder, "");
            res.status(200).send(indexHTML);
        }
    } catch (e) {
        console.error("Unexpected error:", e);
        res.status(500).send("An error occurred");
    }
});

const defaultDesc =
    "CsoundWebIDE is a code editor which runs Csound in the browser and stores projects in the cloud.";
const defaultTitle = "Csound WebIDE";
const defaultLogo = "https://ide.csound.com/apple-touch-icon.png";

const textOr = (value: unknown, fallback: string): string =>
    typeof value === "string" ? value : fallback;

const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
};

const escapeAttribute = (value: string): string =>
    value.replace(/[&<>"']/g, (character) => htmlEscapes[character]);

const getProjectOg = (
    project: Record<string, unknown>,
    profile: Record<string, unknown>,
    projectUid: string
): string => {
    const author = textOr(
        profile.displayName,
        textOr(profile.username, defaultTitle)
    );
    const metadata = {
        "fb:app_id": "428548837960735",
        "og:type": "website",
        "og:title": `${author} - ${textOr(project.name, defaultTitle)}`,
        "og:description": textOr(project.description, defaultDesc),
        "og:image": textOr(profile.photoUrl, defaultLogo),
        "og:url": `https://ide.csound.com/editor/${encodeURIComponent(projectUid)}`
    };
    return Object.entries(metadata)
        .map(
            ([property, content]) =>
                `<meta property="${property}" content="${escapeAttribute(content)}" />`
        )
        .join("");
};
