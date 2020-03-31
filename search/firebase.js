const firebase = require("firebase-admin");
// const serviceAccount = require("/etc/firebase-service-key.json");
const serviceAccountDev = require("./service-key-dev.json");
const serviceAccountProd = require("./service-key-prod.json");

const firebaseDev = firebase.initializeApp(
    {
        credential: firebase.credential.cert(serviceAccountDev),
        databaseURL: "https://csound-ide-dev.firebaseio.com"
    },
    "dev"
);

const firebaseProd = firebase.initializeApp(
    {
        credential: firebase.credential.cert(serviceAccountProd),
        databaseURL: "https://csound-ide.firebaseio.com"
    },
    "prod"
);

const db = {
    dev: firebaseDev.firestore(),
    prod: firebaseProd.firestore()
};

const getData = async (
    databaseID,
    collectionName,
    whereArguments,
    condition = e => true
) => {
    const result = [];
    let query;

    try {
        if (Array.isArray(whereArguments)) {
            query = await db[databaseID]
                .collection(collectionName)
                .where(...whereArguments)
                .get();
        } else {
            query = await db[databaseID].collection(collectionName).get();
        }

        query.forEach(doc => {
            if (condition(doc) === true) {
                result.push({ id: doc.id, ...doc.data() });
            }
        });
    } catch (e) {
        console.error(e);
    }

    return result;
};

const getFirebaseData = async databaseID => {
    const projects = await getData(databaseID, "projects", [
        "public",
        "==",
        true
    ]);
    const projectsMap = projects.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
    });
    const profiles = await getData(databaseID, "profiles");
    const tags = await getData(databaseID, "tags");
    let stars = await getData(databaseID, "stars", false, doc => {
        if (typeof projectsMap[doc.id] === "undefined") {
            return false;
        }
        return projectsMap[doc.id].public === true;
    });

    stars = stars.map(e => {
        return {
            ...e,
            count: Object.keys(e).length - 1
        };
    });
    const timestamp = Date.now();
    return {
        projects,
        profiles,
        tags,
        stars,
        timestamp
    };
};

module.exports = {
    getFirebaseData
};
