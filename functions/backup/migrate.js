const admin = require("firebase-admin");
const functions = require("firebase-functions");
const R = require("ramda");

const newTimestamp = admin.firestore.FieldValue.serverTimestamp;

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

// projectCreated timestamp
const migration2020_3 = async () => {
    const batch = admin.firestore().batch();
    const allProjectsRef = await admin
        .firestore()
        .collection("projects")
        .get();

    await asyncForEach(allProjectsRef.docs, async projectSnap => {
        const projectUid = projectSnap.id;
        const data = projectSnap.data();

        const projectRef = await admin
            .firestore()
            .collection("projects")
            .doc(projectUid);

        batch.set(
            projectRef,
            R.pipe(
                R.pick([
                    "description",
                    "iconName",
                    "userUid",
                    "iconBackgroundColor",
                    "iconForegroundColor",
                    "public",
                    "name"
                ]),
                R.assoc("created", newTimestamp())
            )(data)
        );
    });
    await batch.commit();
};

// profileStars
const migration2020_4 = async () => {
    const batch = admin.firestore().batch();
    const allStarsRef = await admin
        .firestore()
        .collection("stars")
        .get();

    const allStars = allStarsRef.docs.reduce((a, doc) => {
        const data = doc.data();
        const projectUid = doc.id;
        const allUserIds = R.keys(data);
        return R.reduce(
            (acc, userid) =>
                R.assoc(
                    userid,
                    R.assoc(projectUid, data[userid], acc[userid] || {}),
                    acc
                ),
            a,
            allUserIds
        );
    }, {});
    await asyncForEach(R.keys(allStars), async userID => {
        const starsMap = allStars[userID];
        const profileStarsRef = await admin
            .firestore()
            .collection("profileStars")
            .doc(userID);
        // console.log(userID, starsMap);
        batch.set(profileStarsRef, starsMap);
    });

    await batch.commit();
};

// migration2020_4().then(() => process.exit(0));
