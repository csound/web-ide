import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { isbot } from "isbot";
import fs from "node:fs";
import path from "node:path";
import * as R from "ramda";

function printTree(dirPath, indent = "") {
    // Read all files and directories inside the current directory
    const files = fs.readdirSync(dirPath);

    // Loop through each file/directory
    files.forEach((file, index) => {
        const isLast = index === files.length - 1;
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);

        // Print the file or directory name
        const prefix = isLast ? "└── " : "├── ";
        console.log(indent + prefix + file);

        // If it's a directory, recursively print its contents
        if (stats.isDirectory() && file !== "node_modules") {
            const newIndent = indent + (isLast ? "    " : "│   ");
            printTree(filePath, newIndent);
        }
    });
}

export const host = functions.https.onRequest(async (req, res) => {
    try {
        console.log("Current Working Directory:", process.cwd());
        printTree("./");
        let indexHTML = fs.readFileSync("./dist/index.html").toString();
        const path = req.path ? req.path.split("/") : req.path;
        const ogPlaceholder = '<meta name="functions-insert-dynamic-og"/>';

        if (
            isbot(req.headers["user-agent"] || "") &&
            path &&
            path.length > 1 &&
            path[1] === "editor"
        ) {
            const projectUid = path[2];

            const projectSnapshot = await admin
                .firestore()
                .collection("projects")
                .doc(projectUid)
                .get();

            if (R.isNil(projectSnapshot) || !projectSnapshot.exists) {
                res.status(404).send();
                return;
            }

            const projectData = projectSnapshot.data();
            const userUid = R.pathOr(null, ["userUid"], projectData || {});

            if (R.isNil(userUid)) {
                res.status(404).send();
                return;
            }

            const profileSnap = await admin
                .firestore()
                .collection("profiles")
                .doc(userUid)
                .get();

            if (R.isNil(profileSnap) || !profileSnap.exists) {
                res.status(404).send();
                return;
            }

            const profile = profileSnap.data();
            const projectWithUid = R.assoc(
                "projectUid",
                projectUid,
                projectData
            );
            indexHTML = indexHTML.replace(
                ogPlaceholder,
                getProjectOg(projectWithUid, profile)
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

const getProjectOg = (project: any, profile: any): string => {
    let og = `<meta property="fb:app_id" content="428548837960735" />`;
    og += `<meta property="og:type" content="website" />`;
    og += `<meta property="og:title" content="${R.propOr(
        profile.username,
        "displayName",
        profile
    )} - ${R.propOr(defaultTitle, "name", project)}" />`;
    og += `<meta property="og:description" content="${R.propOr(
        defaultDesc,
        "description",
        project
    )}" />`;
    og += `<meta property="og:image" content="${R.propOr(
        defaultLogo,
        "photoUrl",
        profile
    )}" />`;
    og += `<meta property="og:url" content="https://ide.csound.com/editor/${R.propOr(
        "",
        "projectUid",
        project
    )}" />`;
    return og;
};
