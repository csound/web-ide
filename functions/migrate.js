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

// projectsCount
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

// followersCount and followingCount
const migration2020_2 = async () => {
    const batch = admin.firestore().batch();
    const allUsers = await admin
        .firestore()
        .collection("usernames")
        .get();
    const allUserIds = await allUsers.docs.map(x => x.data().userUid);

    await asyncForEach(allUserIds, async userUid => {
        const followersCountRef = await admin
            .firestore()
            .collection("followersCount")
            .doc(userUid);

        const followingCountRef = await admin
            .firestore()
            .collection("followingCount")
            .doc(userUid);

        const allFollowers = await admin
            .firestore()
            .collection("followers")
            .doc(userUid)
            .get();

        const allFollowing = await admin
            .firestore()
            .collection("following")
            .doc(userUid)
            .get();

        batch.set(followersCountRef, {
            followersCount: Object.keys(allFollowers.data() || {}).length
        });

        batch.set(followingCountRef, {
            followingCount: Object.keys(allFollowing.data() || {}).length
        });
    });

    await batch.commit();
};

// migration2020_2().then(() => process.exit(0));
