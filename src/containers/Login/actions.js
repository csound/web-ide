import { SIGNIN_FAIL, SIGNIN_SUCCESS, SIGNIN_REQUEST } from "./types";
import firebase from "firebase/app";
import "firebase/auth";
import { push } from "connected-react-router";

export const login = (email, password) => {
    return async dispatch => {
        dispatch({
            type: SIGNIN_REQUEST
        });

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            dispatch({
                type: SIGNIN_SUCCESS
            });
            dispatch(push("/"));
        } catch (e) {
            dispatch({
                type: SIGNIN_FAIL
            });
        }
    };
};
