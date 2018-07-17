import { AUTH_FAIL, AUTH_SUCCESS, AUTH_REQUEST } from "./types";
import * as firebase from "firebase";
import "firebase/auth/dist/index.cjs";
import { push } from "connected-react-router";

export const checkAuth = () => {
    return async dispatch => {
        dispatch({
            type: AUTH_REQUEST
        });

        firebase.auth().onAuthStateChanged(user => {
            if (user === null) {
                dispatch({ type: AUTH_FAIL });
                dispatch(push("/login"));
            } else {
                dispatch({ type: AUTH_SUCCESS });
            }
        });
    };
};
