// import firebase from "firebase/app";
import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { db, projects } from "../../config/firestore";
import {
    GET_USER_PROJECTS,
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT
} from "./types";
import defaultCsd from "../../templates/DefaultCsd.json";
import defaultOrc from "../../templates/DefaultOrc.json";
import defaultSco from "../../templates/DefaultSco.json";
import firebase from "firebase/app";

const getUserProjectsAction = (payload: any): ProfileActionTypes => {
    return {
        type: GET_USER_PROJECTS,
        payload
    };
};

export const getUserProjects = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => dispatch => {
    firebase.auth().onAuthStateChanged(user => {
        if (user != null) {
            const uid = firebase.auth().currentUser!.uid;
            projects.where("userUid", "==", uid).onSnapshot(querySnapshot => {
                const projects: any = [];
                querySnapshot.forEach(d => {
                    return projects.push({
                        ...d.data(),
                        projectUid: querySnapshot.docs[projects.length].id
                    });
                });
                dispatch(getUserProjectsAction(projects));
            });
        }
    });
};

const addUserProjectAction = (): ProfileActionTypes => {
    return {
        type: ADD_USER_PROJECT
    };
};

export const addUserProject = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            const newProject = {
                userUid: user.uid,
                name: "New Project",
                public: false
            };

            try {
                const newProjectRef = await projects.add(newProject);
                await newProjectRef.collection("files").add(defaultCsd);
                await newProjectRef.collection("files").add(defaultOrc);
                await newProjectRef.collection("files").add(defaultSco);
                dispatch(addUserProjectAction());
            } catch (e) {
                console.error("Failed to add project");
            }
        }
    });
};

const deleteUserProjectAction = (): ProfileActionTypes => {
    return {
        type: DELETE_USER_PROJECT
    };
};

export const deleteUserProject = (
    doc: any
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            const files = await projects
                .doc(doc.projectUid)
                .collection("files")
                .get();

            const batch = db.batch();
            const docRef = projects.doc(doc.projectUid);
            batch.delete(docRef);
            files.forEach(d => batch.delete(d.ref));

            try {
                await batch.commit();
                console.log("Project deleted");
                dispatch(deleteUserProjectAction());
            } catch (e) {
                console.log("Deletion error");
            }
        }
    });
};
