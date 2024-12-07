// import firebase from "firebase-admin";
// import serviceAccountDev from "./service-key-dev.json";
// import serviceAccountProd from "./service-key-prod.json";

// const firebaseDev = firebase.initializeApp(
//     {
//         credential: firebase.credential.cert(
//             serviceAccountDev as firebase.ServiceAccount
//         ),
//         databaseURL: "https://csound-ide-dev.firebaseio.com"
//     },
//     "dev"
// );

// const firebaseProd = firebase.initializeApp(
//     {
//         credential: firebase.credential.cert(
//             serviceAccountProd as firebase.ServiceAccount
//         ),
//         databaseURL: "https://csound-ide.firebaseio.com"
//     },
//     "prod"
// );

// const db = {
//     dev: firebaseDev.firestore(),
//     prod: firebaseProd.firestore()
// };

// type WhereArguments = [string, firebase.firestore.WhereFilterOp, any];
// type FirestoreDocument = firebase.firestore.QueryDocumentSnapshot;

// const getData = async (
//     databaseID: "dev" | "prod",
//     collectionName: string,
//     whereArguments?: WhereArguments | false,
//     condition: (doc: FirestoreDocument) => boolean = () => true
// ): Promise<Array<Record<string, any>>> => {
//     const result: Array<Record<string, any>> = [];
//     const query: firebase.firestore.QuerySnapshot = Array.isArray(
//         whereArguments
//     )
//         ? await db[databaseID]
//               .collection(collectionName)
//               .where(...whereArguments)
//               .get()
//         : await db[databaseID].collection(collectionName).get();

//     query.forEach((doc: any) => {
//         if (condition(doc)) {
//             result.push({ id: doc.id, ...doc.data() });
//         }
//     });

//     return result;
// };

// const getFirebaseData = async (
//     databaseID: "dev" | "prod"
// ): Promise<Record<string, any>> => {
//     const projects = await getData(databaseID, "projects", [
//         "public",
//         "==",
//         true
//     ]);
//     const projectsMap = projects.reduce(
//         (acc, curr) => {
//             acc[curr.id] = curr;
//             return acc;
//         },
//         {} as Record<string, any>
//     );

//     const profiles = await getData(databaseID, "profiles");
//     const tags = await getData(databaseID, "tags");

//     let stars = await getData(databaseID, "stars", false, (doc) => {
//         if (projectsMap[doc.id] === undefined) {
//             return false;
//         }
//         return projectsMap[doc.id].public === true;
//     });

//     stars = stars.map((e) => ({
//         ...e,
//         count: Object.keys(e).length - 1
//     }));

//     const timestamp = Date.now();
//     return {
//         projects,
//         profiles,
//         tags,
//         stars,
//         timestamp
//     };
// };

// export { getFirebaseData };
