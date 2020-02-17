const firebase = require("firebase-admin");
const serviceAccount = require("./service-key.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://csound-ide-dev.firebaseio.com"
});

const db = firebase.firestore();
const projectLastModified = db.collection("projectLastModified");
const projects = db.collection("projects");
const projectsCount = db.collection("projectsCount");
const profiles = db.collection("profiles");
const followers = db.collection("followers");
const following = db.collection("following");
const usernames = db.collection("usernames");
const targets = db.collection("targets");
const tags = db.collection("tags");
const stars = db.collection("stars");
const profileStars = db.collection("profileStars");
const projectFiles = db.collection("projectFiles");

module.exports = {
    projectLastModified,
    projects,
    projectsCount,
    profiles,
    followers,
    following,
    usernames,
    targets,
    tags,
    stars,
    profileStars,
    projectFiles
};
