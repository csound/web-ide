// const firebase = require("firebase");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const log = require("./logger.js")("new_user_callback");

const createUserDocument = async user => {
    log(
        "createUserDocument",
        `Creating user: ${user.displayName}, with uid ${user.uid}`
    );

    const userDoc = {
        userUid: user.uid,
        userJoinDate: new Date(),
        email: user.email,
        displayName: user.displayName,
        username: "",
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

// For every new user, let's create a queryable firestore profile document
const createProfileDocument = async user => {
    log(
        "createProfileDocument",
        `Adding: ${user.displayName}, with uid ${user.uid} to profiles`
    );

    const profileDoc = {
        bio: "",
        link1: "",
        link2: "",
        link3: ""
    };

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
    await createUserDocument(user);
    await createProfileDocument(user);
    return true;
});
