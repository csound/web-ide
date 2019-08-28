import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access the Firebase Realtime Database.

admin.initializeApp();

export const accountCreate = functions.auth.user().onCreate(user => {
    const userUid = user.uid;

    const doc = { userUid,
                bio: '',
                link1:'',
                link2:'', 
                link3:'',
                username: ''};

    admin.firestore().collection('profiles').doc(userUid)
    .set(doc).then(writeResult => {
        console.log('User Created result:', writeResult);
        return;
    }).catch(err => {
       console.log(err);
       return;
    });
});