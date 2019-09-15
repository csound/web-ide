// import firebase from "firebase/app";
import "firebase/auth";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { db, projects, profiles, usernames } from "../../config/firestore";
import {
    GET_USER_PROJECTS,
    ProfileActionTypes,
    ADD_USER_PROJECT,
    DELETE_USER_PROJECT,
    GET_USER_PROFILE,
    GET_USER_IMAGE_URL
} from "./types";
import defaultCsd from "../../templates/DefaultCsd.json";
import defaultOrc from "../../templates/DefaultOrc.json";
import defaultSco from "../../templates/DefaultSco.json";
import firebase from "firebase/app";
import { openSnackbar } from "../Snackbar/actions";
import { SnackbarType } from "../Snackbar/types";
import crypto from "crypto";
import { push } from "connected-react-router";

const getUserProfileAction = (payload: any): ProfileActionTypes => {
    return {
        type: GET_USER_PROFILE,
        payload
    };
};

export const getUserProfile = (
    username: string
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            let uid;
            if (username === null) {
                uid = firebase.auth().currentUser!.uid;
            } else {
                const result = await usernames.doc(username).get();
                const data = result.data() || null;

                if (data === null) {
                    dispatch(push("/404", { message: "Profile Not Found" }));
                    return;
                } else {
                    uid = data!.userUid;
                }
            }
            const profile = await profiles.doc(uid).get();

            if (!profile.exists) {
                dispatch(push("/404"));
                openSnackbar("User profile not found", SnackbarType.Error);
            } else {
                dispatch(getUserProfileAction(profile.data()));
            }
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
                await newProjectRef.collection("files").add({...defaultCsd, userUid: user.uid});
                await newProjectRef.collection("files").add({...defaultOrc, userUid: user.uid});
                await newProjectRef.collection("files").add({...defaultSco, userUid: user.uid});
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

export const getUserImageURLAction = (url: string): ProfileActionTypes => {
    return {
        type: GET_USER_IMAGE_URL,
        payload: url
    };
};

export const getUserImageURL = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => dispatch => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user != null) {
            const md5Email = crypto
                .createHash("md5")
                .update("phasereset@gmail.com")
                .digest("hex");
            const gravatarUrl = `https://www.gravatar.com/avatar/${md5Email}`;
            const response = await fetch(`${gravatarUrl}?d=404`);

            if (response.status !== 200) {
                console.log("no gravatar");
            }

            dispatch(getUserImageURLAction(gravatarUrl));
        }
    });
};
