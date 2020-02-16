// const firebase = require("firebase");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("new_user_callback");

// For every new user, let's create a queryable firestore profile document
const createProfileDocument = async user => {
    log(
        "createProfileDocument",
        `Adding: ${user.displayName}, with uid ${user.uid} to profiles`
    );

    const profileDoc = {
        displayName: user.displayName,
        bio: "",
        link1: "",
        link2: "",
        link3: "",
        photoUrl: user.photoURL,
        userUid: user.uid,
        userJoinDate: new Date(),
        username: ""
    };

    // initialize projectsCountColl
    await admin
        .firestore()
        .collection("projectsCount")
        .doc(user.uid)
        .set({ all: 0, public: 0 });

    return await admin
        .firestore()
        .collection(`profiles`)
        .doc(user.uid)
        .set(profileDoc, { merge: true })
        .catch(err => {
            log("error", err);
            return;
        });
};

exports.new_user_callback = functions.auth.user().onCreate(async user => {
    log(
        "new_user_callback",
        `Creating new user: ${user.displayName}, with uid ${user.uid}`
    );
    await createProfileDocument(user);
    return true;
});
