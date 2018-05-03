import { READ_ALL } from "./types";
/* eslint import/no-webpack-loader-syntax: off */

import firebase from "firebase";

export const getAllData = data => {
    return dispatch => {
        dispatch({ type: READ_ALL.REQUEST });

        firebase
            .firestore()
            .collection("test")
            .doc("test_document")
            .onSnapshot(function(doc) {
                if (doc === null) {
                    dispatch({ type: READ_ALL.FAIL });
                }

                var source = doc.metadata.hasPendingWrites ? "Local" : "Server";
                console.log(source, " data: ", doc.data());

                dispatch({ type: READ_ALL.SUCCESS, payload: doc.data() });
            });
    };
};
