import ProjectSearch from "./ProjectSearchShim";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import {
    // db,
    // projects,
    // profiles,
    // stars,
    // usernames,
    tags
} from "@config/firestore";
import { GET_TAGS } from "./types";
const worker = ProjectSearch();

export const searchProjects = (
    query: string
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    worker.projectSearch(query);
};

export const getTags = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => async dispatch => {
    tags.onSnapshot(snapshot => {
        const result = snapshot.docs.map(doc => {
            return { tag: doc.id, uids: doc.data() };
        });
        dispatch({ type: GET_TAGS, payload: result });
    });
};
