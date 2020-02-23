import ProjectSearch from "./ProjectSearchShim";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import {
    projects,
    profiles,
    stars,
    projectLastModified,
    tags
} from "@config/firestore";
import {
    selectOrderedProjectLastModified,
    selectOrderedStars,
    selectStars
} from "./selectors";
import {
    GET_TAGS,
    GET_STARS,
    GET_PROJECT_LAST_MODIFIED,
    GET_DISPLAYED_STARRED_PROJECTS,
    GET_DISPLAYED_RECENT_PROJECTS,
    GET_PROJECT_USER_PROFILES
} from "./types";
import { firestore } from "firebase/app";

const searchURL = "https://web-ide-search-api.csound.com/search";
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

export const getStars = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> => async dispatch => {
    const starsRequest = await fetch(`${searchURL}/list/stars/8/0/count/desc`);
    const starredProjects = await starsRequest.json();
    console.log(starredProjects);

    dispatch({ type: GET_STARS, payload: starredProjects });
};

export const getPopularProjects = (
    count: number
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getStore
) => {
    const state = getStore();
    const orderedStars = selectStars(state);
    const starsIDs = orderedStars.map(e => (e as any).id);

    if (orderedStars.length === 0) {
        return;
    }
    console.log(orderedStars);

    const splitStarProjectsQuery = await projects
        .where("public", "==", true)
        .where(firestore.FieldPath.documentId(), "in", starsIDs)
        .get();

    const starProjects: any[] = [];
    splitStarProjectsQuery.forEach(snapshot => {
        starProjects.push({ id: snapshot.id, ...snapshot.data() });
    });

    console.log(starProjects);

    const userIDs = [...new Set([...starProjects.map(e => e.userUid)])];

    const projectProfiles = {};

    const profilesQuery = await profiles
        .where(firestore.FieldPath.documentId(), "in", userIDs)
        .get();

    profilesQuery.forEach(snapshot => {
        projectProfiles[snapshot.id] = snapshot.data();
    });

    dispatch({ type: GET_PROJECT_USER_PROFILES, payload: projectProfiles });
    dispatch({ type: GET_DISPLAYED_STARRED_PROJECTS, payload: starProjects });
};
