const firebase = require("firebase");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("new_user_callback");

// For every new user, let's create a queryable firestore profile document
const createProfileDocument = async user => {
    log(
        "createProfileDocument",
        `Adding: ${user.displayName}, with uid ${user.uid} to profiles`
    );

    const userDoc = {
        userUid: user.uid,
        userJoinDate: firebase.database.ServerValue.TIMESTAMP,
        email: user.email,
        bio: "",
        link1: "",
        link2: "",
        link3: "",
        displayName: user.displayName,
        fullName: "",
        photoUrl: user.photoURL
    };

    return await admin
        .firestore()
        .collection(`users`)
        .doc(user.uid)
        .set(userDoc, { merge: true })
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
