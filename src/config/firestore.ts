import * as firebase from "firebase/app";
import "firebase/firestore";
import "firebase/firebase-storage";

const DEV = {
    apiKey: "AIzaSyDFV4Pm43eQXbFUrayG9Dj_7ddEBzQ9Gd4",
    authDomain: "csound-ide-dev.firebaseapp.com",
    databaseURL: "https://csound-ide-dev.firebaseio.com",
    projectId: "csound-ide-dev",
    storageBucket: "csound-ide-dev.appspot.com",
    messagingSenderId: "449370062532"
};

const PROD = {
    apiKey: "AIzaSyCbwSqIRwrsmioXL7b0yqrHJnOcNNqWN9E",
    authDomain: "csound-ide.firebaseapp.com",
    databaseURL: "https://csound-ide.firebaseio.com",
    projectId: "csound-ide",
    storageBucket: "csound-ide.appspot.com",
    messagingSenderId: "1089526309602"
};

// INITIALIZE FIREBASE WITH SETTINGS
if (!firebase.apps.length) {
    let target;
    if (process.env.REACT_APP_DATABASE === "DEV") {
        target = DEV;
    } else if (process.env.REACT_APP_DATABASE === "PROD") {
        target = PROD;
    }
    // firebase.settings();
    firebase.initializeApp(target);
}

// CREATE REFERENCES FOR USE BY APP CODE
export const db = firebase.firestore();
export const projectLastModified = db.collection("projectLastModified");
export const projects = db.collection("projects");
export const projectsCount = db.collection("projectsCount");
export const profiles = db.collection("profiles");
export const followers = db.collection("followers");
export const following = db.collection("following");
export const usernames = db.collection("usernames");
export const targets = db.collection("targets");
export const tags = db.collection("tags");
export const stars = db.collection("stars");
export const profileStars = db.collection("profileStars");
export const projectFiles = db.collection("projectFiles");
export const storageRef = firebase.storage().ref();

// OTHER
export const getCurrentUserPromise = () =>
    new Promise(resolve => {
        const unsubscribe = firebase.auth().onAuthStateChanged(user => {
            resolve(user);
            unsubscribe();
        });
    });
export const getFirebaseTimestamp: () => any =
    firebase.firestore.FieldValue.serverTimestamp;
export type Timestamp = firebase.firestore.Timestamp;
export const fieldDelete: () => any = () =>
    firebase.firestore.FieldValue.delete();
