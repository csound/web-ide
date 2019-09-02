// import firebase from "firebase/app";
import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { db, projects, profiles } from "../../config/firestore";
import {
    GET_USER_PROJECTS,
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT,
    GET_USER_PROFILE
} from "./types";
import defaultCsd from "../../templates/DefaultCsd.json";
import defaultOrc from "../../templates/DefaultOrc.json";
import defaultSco from "../../templates/DefaultSco.json";
import firebase from "firebase/app";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";

const getUserProfileAction = (payload: any): ProfileActionTypes => {
    return {
        type: GET_USER_PROFILE,
        payload
    };
};

export const getUserProfile = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => dispatch => {
    firebase.auth().onAuthStateChanged(user => {
        if (user != null) {
            const uid = firebase.auth().currentUser!.uid;
            profiles.where("userUid", "==", uid).onSnapshot(querySnapshot => {
                const profile: any = [];
                querySnapshot.forEach(d => {
                    return profile.push(d.data());
                });

                if (typeof profile[0] === "undefined") {
                    dispatch(
                        openSnackbar(
                            "User profile not found",
                            SnackbarType.Error
                        )
                    );
                } else {
                    dispatch(getUserProfileAction(profile[0]));
                }
            });
        }
    });
};

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
                dispatch(openSnackbar("Project Added", SnackbarType.Success));
            } catch (e) {
                dispatch(
                    openSnackbar("Could not add Project", SnackbarType.Error)
                );
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
                dispatch(deleteUserProjectAction());
                dispatch(openSnackbar("Project Deleted", SnackbarType.Success));
            } catch (e) {
                dispatch(
                    openSnackbar("Could Not Delete Project", SnackbarType.Error)
                );
            }
        }
    });
};
