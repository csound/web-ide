const firebase = require("firebase-admin");
const serviceAccount = require("./service-key.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://csound-ide-dev.firebaseio.com"
});

const db = firebase.firestore();

const getData = async (collectionName, whereArguments) => {
    const result = [];
    let query;

    try {
        if (Array.isArray(whereArguments)) {
            query = await db
                .collection(collectionName)
                .where(...whereArguments)
                .get();
        } else {
            query = await db.collection(collectionName).get();
        }

        query.forEach(doc => {
            result.push({ id: doc.id, ...doc.data() });
        });
    } catch (e) {
        console.error(e);
    }

    return result;
};

const getFirebaseData = async () => {
    const projects = await getData("projects", ["public", "==", true]);
    const profiles = await getData("profiles");
    const tags = await getData("tags");
    let stars = await getData("stars");

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
