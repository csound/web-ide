import { difference, keys, isEmpty, pluck } from "ramda";
import { profiles, projects } from "@config/firestore";
import firebase from "firebase/app";
import "firebase/firestore";
import { Action } from "redux";
import { ThunkAction } from "redux-thunk";

import { selectDisplayedStarredProjects } from "./selectors";
import {
    GET_DISPLAYED_RANDOM_PROJECTS,
    // GET_DISPLAYED_STARRED_PROJECTS,
    GET_FEATURED_PROJECT_USER_PROFILES,
    GET_SEARCHED_PROJECT_USER_PROFILES,
    // GET_STARS,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    GET_RANDOM_PROJECT_USER_PROFILES,
    GET_POPULAR_PROJECT_USER_PROFILES,
    FETCH_POPULAR_PROJECTS,
    SET_POPULAR_PROJECTS_OFFSET,
    HomeActionTypes
} from "./types";
import { IProject } from "@comp/projects/types";
import { convertProjectSnapToProject } from "@comp/projects/utils";
import { IStarredProjectSearchResult, IStarredProject } from "@db/search";
import { IStore } from "@root/store/types";

const databaseID = process.env.NODE_ENV === "development" ? "dev" : "prod";
const searchURL = `https://web-ide-search-api.csound.com/search/${databaseID}`;
// const searchURL = `http://localhost:4000/search/${databaseID}`;

export const searchProjects = (
    query: string,
    offset: number
): ThunkAction<void, any, null, Action<string>> => async (dispatch) => {
    dispatch({ type: SEARCH_PROJECTS_REQUEST });

    const searchRequest = await fetch(
        `${searchURL}/query/projects/${query}/8/${offset}/name/desc`
    );
    const projects = await searchRequest.json();
    projects.data = projects.data.slice(0, 8);

    const userIDs = [
        ...new Set([...projects.data.map((item) => item.userUid)])
    ];

    if (userIDs.length === 0) {
        dispatch({ type: GET_SEARCHED_PROJECT_USER_PROFILES, payload: false });
        dispatch({ type: SEARCH_PROJECTS_SUCCESS, payload: false });

        return;
    }

    if (!isEmpty(userIDs)) {
        const projectProfiles = {};

        const profilesQuery = await profiles
            .where(firebase.firestore.FieldPath.documentId(), "in", userIDs)
            .get();

        profilesQuery.forEach((snapshot) => {
            projectProfiles[snapshot.id] = snapshot.data();
        });

        dispatch({
            type: GET_SEARCHED_PROJECT_USER_PROFILES,
            payload: projectProfiles
        });
    }

    dispatch({ type: SEARCH_PROJECTS_SUCCESS, payload: projects });
};

export const fetchPopularProjects = (offset = 0, pageSize = 8) => {
    return async (
        dispatch: (action: HomeActionTypes) => Promise<void>,
        getState: () => IStore
    ): Promise<void> => {
        const nextOffset = Math.max(0, offset) + pageSize;

        dispatch({
            type: SET_POPULAR_PROJECTS_OFFSET,
            newOffset: nextOffset
        });

        const state = getState().HomeReducer;

        const starsRequest = await fetch(
            `${searchURL}/list/stars/${pageSize}/${offset}/count/desc`
        );
        const starredProjects: IStarredProjectSearchResult = await starsRequest.json();

        const starsIDs = starredProjects.data.map(
            (item: IStarredProject) => item.id
        );

        const publicProjectsSnapshots = await projects
            .where("public", "==", true)
            .where(firebase.firestore.FieldPath.documentId(), "in", starsIDs)
            .get();

        const popularProjects: IProject[] = await Promise.all(
            publicProjectsSnapshots.docs.map(
                async (snap) => await convertProjectSnapToProject(snap)
            )
        );

        const userIDs = pluck("userUid", popularProjects);

        const missingProfiles = difference(userIDs, keys(state.profiles));
        if (!isEmpty(missingProfiles)) {
            const projectProfiles = {};

            const profilesQuery = await profiles
                .where(
                    firebase.firestore.FieldPath.documentId(),
                    "in",
                    missingProfiles
                )
                .get();

            profilesQuery.forEach((snapshot) => {
                projectProfiles[snapshot.id] = snapshot.data();
            });

            dispatch({
                type: GET_POPULAR_PROJECT_USER_PROFILES,
                payload: projectProfiles
            });
        }

        dispatch({
            type: FETCH_POPULAR_PROJECTS,
            payload: popularProjects,
            totalRecords: starredProjects.totalRecords
        });
    };
};

/*
export const getPopularProjects = (
    withRandomProjects = false,
    startCount = 0
): ThunkAction<void, any, null, Action<string>> => async (
    dispatch,
    getStore
) => {
    dispatch({
        type: GET_POPULAR_PROJECT_USER_PROFILES,
        payload: false
    });
    dispatch({ type: GET_DISPLAYED_STARRED_PROJECTS, payload: false });

    const starsRequest = await fetch(
        `${searchURL}/list/stars/8/${startCount * 4}/count/desc`
    );
    const starredProjects = (await starsRequest.json()).data;

    const starsIDs = starredProjects.map((item) => (item as any).id);

    if (starredProjects.length === 0) {
        dispatch({ type: GET_DISPLAYED_STARRED_PROJECTS, payload: [] });
        return;
    }
    const splitStarProjectsQuery = await projects
        .where("public", "==", true)
        .where(firebase.firestore.FieldPath.documentId(), "in", starsIDs)
        .get();

    const starProjects: any[] = [];
    splitStarProjectsQuery.forEach((snapshot) => {
        starProjects.push({ id: snapshot.id, ...snapshot.data() });
    });

    const userIDs = [...new Set([...starProjects.map((item) => item.userUid)])];

    const projectProfiles = {};

    const profilesQuery = await profiles
        .where(firebase.firestore.FieldPath.documentId(), "in", userIDs)
        .get();

    profilesQuery.forEach((snapshot) => {
        projectProfiles[snapshot.id] = snapshot.data();
    });
    dispatch({
        type: GET_POPULAR_PROJECT_USER_PROFILES,
        payload: projectProfiles
    });
    dispatch({ type: GET_DISPLAYED_STARRED_PROJECTS, payload: starProjects });

    dispatch({ type: GET_STARS, payload: starProjects });

    if (withRandomProjects === true) {
        dispatch(getRandomProjects());
    }
};

*/

export const getRandomProjects = (): ThunkAction<
    void,
    any,
    null,
    Action<string>
> =>
    // eslint-disable-next-line unicorn/consistent-function-scoping
    async (dispatch, getStore) => {
        dispatch({ type: GET_DISPLAYED_RANDOM_PROJECTS, payload: false });

        const state = getStore();
        const starProjects = selectDisplayedStarredProjects(state);
        if (starProjects.length === 0) {
            return;
        }

        const starProjectsIDs = new Set(starProjects.map((item) => item.id));

        const randomProjectsRequest = await fetch(
            `${searchURL}/random/projects/8`
        );
        let randomProjects = await randomProjectsRequest.json();
        randomProjects = randomProjects.data
            .filter((item) => {
                return starProjectsIDs.has(item.id) === false;
            })
            .slice(0, 4);

        const userIDs = [
            ...new Set([...randomProjects.map((item) => item.userUid)])
        ];

        if (!isEmpty(userIDs)) {
            const projectProfiles = {};

            const profilesQuery = await profiles
                .where(firebase.firestore.FieldPath.documentId(), "in", userIDs)
                .get();

            profilesQuery.forEach((snapshot) => {
                projectProfiles[snapshot.id] = snapshot.data();
            });

            dispatch({
                type: GET_FEATURED_PROJECT_USER_PROFILES,
                payload: projectProfiles
            });

            dispatch({
                type: GET_RANDOM_PROJECT_USER_PROFILES,
                payload: projectProfiles
            });
        }

        dispatch({
            type: GET_DISPLAYED_RANDOM_PROJECTS,
            payload: randomProjects
        });
    };
