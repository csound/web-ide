const admin = require("firebase-admin");
const functions = require("firebase-functions");
const isBot = require("isbot");
const fs = require("fs");
const R = require("ramda");

exports.host = functions.https.onRequest(async (req, res) => {
    let indexHTML = fs.readFileSync("./index.html").toString();
    const path = req.path ? req.path.split("/") : req.path;
    const ogPlaceholder = '<meta name="functions-insert-dynamic-og" />';

    if (
        //isBot(req.headers["user-agent"]) &&
        path &&
        path.length > 1 &&
        path[1] === "editor"
    ) {
        const projectUid = path[2];
        const project = await admin
            .firestore()
            .collection("projects")
            .doc(projectUid);
        if (R.isNil(project)) {
            return res.status(404).send();
        }
        const profile = await admin
            .firestore()
            .collection("projects")
            .doc(projectUid.username);
        if (R.isNil(profile)) {
            return res.status(404).send();
        }
        const projectWithUid = R.assoc("projectUid", projectUid, project);
        indexHTML = indexHTML.replace(
            ogPlaceholder,
            getProjectOg(projectWithUid, profile)
        );
    } else {
        indexHTML = indexHTML.replace(ogPlaceholder, "");
        // res.status(200).send(indexHTML);
    }

    res.status(200).send(indexHTML);
});

const defaultDesc =
    "CsoundWebIDE is a code editor which runs Csound in the browser and stores projects in the cloud.";
const defaultTitle = "Csound WebIDE";
const defaultLogo = "https://ide.csound.com/apple-touch-icon.png";

const getProjectOg = (project, profile) => {
    let og = `<meta property="fb:app_id" content="428548837960735" />`;
    og += `<meta property="og:type" content="website" />`;
    og += `<meta property="og:title" content="${R.propOr(
        defaultTitle,
        "name",
        project
    )}" />`;
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
