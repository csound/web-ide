import ProjectSearch from "./ProjectSearchShim";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";

const worker = ProjectSearch();

export const searchProjects = (
    query: string
): ThunkAction<void, any, null, Action<string>> => dispatch => {
    worker.projectSearch(query);
};
