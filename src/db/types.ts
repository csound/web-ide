import firebase from "firebase/app";

export interface IUserProfile {
    name: string;
    email: string;
    userid?: number;
    photoUrl?: string;
}

export interface IFirestoreDocument {
    lastModified: firebase.firestore.Timestamp;
    name: string;
    type: string;
    userUid: string;
    value: string;
}

export interface IFirestoreProject {
    created: firebase.firestore.Timestamp;
    description: string;
    iconBackgroundColor: string;
    iconForegroundColor: string;
    iconName: string;
    name: string;
    public: boolean;
    userUid: string;
    id?: string;
}

export interface IFirestoreProfile {
    backgroundIndex?: number;
    bio: string;
    displayName: string;
    link1: string;
    link2: string;
    link3: string;
    photoUrl: string;
    userJoinDate: firebase.firestore.Timestamp;
    userUid: string;
    username: string;
}
