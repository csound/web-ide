import * as firebase from "firebase/app";
import "firebase/firestore";

// ENVIRONMENT SETTINGS
/*
const DEV = {
    apiKey: "AIzaSyCbwSqIRwrsmioXL7b0yqrHJnOcNNqWN9E",
    authDomain: "csound-ide.firebaseapp.com",
    databaseURL: "https://csound-ide.firebaseio.com",
    projectId: "csound-ide",
    storageBucket: "csound-ide.appspot.com",
    messagingSenderId: "1089526309602"
}; */

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
    // TODO - make dev/prod switchable
    firebase.initializeApp(PROD);
}

// CREATE REFERENCES FOR USE BY APP CODE
export const db = firebase.firestore();
export const projects = db.collection("projects");
export const profiles = db.collection("profiles");
export const projectFiles = db.collection("projectFiles");
