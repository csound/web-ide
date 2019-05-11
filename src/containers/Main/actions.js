import {
    USER_PROFILE_FAIL,
    USER_PROFILE_SUCCESS,
    USER_PROFILE_REQUEST
} from "./types";
import firebase from "firebase/app";
import "firebase/auth";

export const checkAuth = () => {
    return dispatch => {
        dispatch({
            type: USER_PROFILE_REQUEST
        });

        firebase.auth().onAuthStateChanged(user => {
            if (user === null) {
                dispatch({ type: USER_PROFILE_FAIL });
            } else {
                dispatch({ type: USER_PROFILE_SUCCESS });
            }
        });
    };
};
