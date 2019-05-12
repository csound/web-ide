import { SIGNIN_FAIL, SIGNIN_SUCCESS, SIGNIN_REQUEST,
         OPEN_DIALOG, CLOSE_DIALOG } from "./types";
import firebase from "firebase/app";
import "firebase/auth";
import { push } from "connected-react-router";

export const login = (email: string, password: string) => {
    return async (dispatch: any) => {
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
    }
}

export const openLoginDialog = () => {
    return async (dispatch: any) => {
        dispatch({
            type: OPEN_DIALOG,
        })
    }
}

export const closeLoginDialog = () => {
    return async (dispatch: any) => {
        dispatch({
            type: CLOSE_DIALOG,
        })
    }
}
