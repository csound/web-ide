import { User, getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import {
    collection,
    deleteField,
    getFirestore,
    setLogLevel,
    serverTimestamp
} from "firebase/firestore";
import { getStorage, ref } from "firebase/storage";

const DEV = {
    apiKey: "AIzaSyDFV4Pm43eQXbFUrayG9Dj_7ddEBzQ9Gd4",
    authDomain: "csound-ide-dev.firebaseapp.com",
    databaseURL: "https://csound-ide-dev.firebaseio.com",
    projectId: "csound-ide-dev",
    storageBucket: "csound-ide-dev.appspot.com",
    messagingSenderId: "449370062532",
    appId: "1:449370062532:web:a9a2802fe150e69c6e1391"
};

const PROD = {
    apiKey: "AIzaSyCbwSqIRwrsmioXL7b0yqrHJnOcNNqWN9E",
    authDomain: "csound-ide.firebaseapp.com",
    databaseURL: "https://csound-ide.firebaseio.com",
    projectId: "csound-ide",
    storageBucket: "csound-ide.appspot.com",
    messagingSenderId: "1089526309602"
};

setLogLevel("debug");

let firebaseApp;

console.log("firebaseApp", firebaseApp);

// INITIALIZE FIREBASE WITH SETTINGS
if (!firebaseApp) {
    let target;
    if (process.env.REACT_APP_DATABASE === "DEV") {
        target = DEV;
    } else if (process.env.REACT_APP_DATABASE === "PROD") {
        target = PROD;
    }
    // firebase.settings();
    firebaseApp = initializeApp(target);
    console.log("firebaseApp init", target);
}

// CREATE REFERENCES FOR USE BY APP CODE
export const database = getFirestore();
console.log({ database });
export const projectLastModified = collection(database, "projectLastModified");
export const projects = collection(database, "projects");
export const projectsCount = collection(database, "projectsCount");
export const profiles = collection(database, "profiles");
export const followers = collection(database, "followers");
export const following = collection(database, "following");
export const usernames = collection(database, "usernames");
export const targets = collection(database, "targets");
export const tags = collection(database, "tags");
export const stars = collection(database, "stars");
export const profileStars = collection(database, "profileStars");
export const projectFiles = collection(database, "projectFiles");
export const storageReference = async (path: string) =>
    await ref(getStorage(firebaseApp), path);

// OTHER
export const getCurrentUserPromise = (): Promise<User | null> =>
    new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
            resolve(user);
            unsubscribe();
        });
    });
export const getFirebaseTimestamp: () => any = serverTimestamp;
export { Timestamp } from "firebase/firestore";
export const fieldDelete: () => any = () => deleteField();
