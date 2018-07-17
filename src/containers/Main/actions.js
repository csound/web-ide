import {
    USER_PROFILE_FAIL,
    USER_PROFILE_SUCCESS,
    USER_PROFILE_REQUEST
} from "./types";
import * as firebase from "firebase";
import "firebase/auth/dist/index.cjs";

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
