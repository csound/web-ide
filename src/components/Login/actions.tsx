import {
    SIGNIN_FAIL, SIGNIN_SUCCESS, SIGNIN_REQUEST,
    OPEN_DIALOG, CLOSE_DIALOG, CREATE_USER_FAIL,
    CREATE_USER_SUCCESS, CREATE_CLEAR_ERROR, LOG_OUT
} from "./types";
import firebase from "firebase/app";
import "firebase/auth";
import { push } from "connected-react-router";

export const login = (email: string, password: string) => {
    return async (dispatch: any) => {
        dispatch({
            type: SIGNIN_REQUEST
        });

        try {
            const user = await firebase.auth().signInWithEmailAndPassword(email, password);
            dispatch({
                type: SIGNIN_SUCCESS,
                user,
            });
            // dispatch(push("/"));
        } catch (e) {
            dispatch({
                type: SIGNIN_FAIL
            });
        }
    }
}

export const thirdPartyAuthSuccess = (user: any) => {
    return async (dispatch: any) => {
        dispatch({
            type: SIGNIN_SUCCESS,
            user,
        })
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

export const logOut = () => {
    return async (dispatch: any) => {
        try {
            await firebase.auth().signOut();
        } catch (e){
            console.error(e);
        }
        dispatch(push("/"));
        dispatch({
            type: LOG_OUT,
        })
    }
}

export const createNewUser = (email: string, password: string) => {
    return async (dispatch: any) => {
        firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((creditendials: any) => {
                    dispatch({
                        type: CREATE_USER_SUCCESS,
                        creditendials,
                    })
                })
                .catch((error: any) => {
                    dispatch({
                        type: CREATE_USER_FAIL,
                        errorCode: error.code,
                        errorMessage: error.message,
                    })
                });
    }
}

export const createUserClearError = () => {
    return async (dispatch: any) => {
        dispatch({
            type: CREATE_CLEAR_ERROR,
        })
    }
}


// export const logOut = () => {
//     return async (dispatch: any) => {
//         dispatch({
//             type: LOG_OUT,
//         })
//     }
// }
