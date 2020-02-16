const admin = require("firebase-admin");
const functions = require("firebase-functions");
const serviceAccountCredentials = require(process.env
    .GOOGLE_APPLICATION_CREDENTIALS);

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

const defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountCredentials),
    databaseURL: "https://csound-ide-dev.firebaseio.com"
});

const migration2020_1 = async () => {
    const batch = admin.firestore().batch();
    const allUsers = await admin
        .firestore()
        .collection("usernames")
        .get();
    const allUserIds = await allUsers.docs.map(x => x.data().userUid);

    await asyncForEach(allUserIds, async userUid => {
        const countRef = await admin
            .firestore()
            .collection("projectsCount")
            .doc(userUid);

        const allProjects = await admin
            .firestore()
            .collection("projects")
            .where("userUid", "==", userUid)
            .get();

        const publicProjects = await admin
            .firestore()
            .collection("projects")
            .where("userUid", "==", userUid)
            .where("public", "==", true)
            .get();

        batch.set(countRef, {
            all: allProjects.size,
            public: publicProjects.size
        });
    });

    await batch.commit();
};

// migration2020_1().then(() => process.exit(0));
