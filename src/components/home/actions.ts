import { difference, keys, isEmpty, pluck } from "ramda";
import { profiles, projects } from "@config/firestore";
import firebase from "firebase/app";
import "firebase/firestore";
import { Action } from "redux";
import { ThunkAction } from "redux-thunk";
import {
    ADD_USER_PROFILES,
    SEARCH_PROJECTS_REQUEST,
    SEARCH_PROJECTS_SUCCESS,
    FETCH_POPULAR_PROJECTS,
    SET_POPULAR_PROJECTS_OFFSET,
    HomeActionTypes
} from "./types";
import { IProject } from "@comp/projects/types";
import {
    convertProjectSnapToProject,
    firestoreProjectToIProject
} from "@comp/projects/utils";
import { IStarredProjectSearchResult, IStarredProject } from "@db/search";
import { IStore } from "@root/store/types";

const databaseID = process.env.NODE_ENV === "development" ? "dev" : "prod";
const searchURL = `https://web-ide-search-api.csound.com/search/${databaseID}`;
// const searchURL = `http://localhost:4000/search/${databaseID}`;

export const searchProjects = (
    query: string,
    offset: number
): ThunkAction<void, any, null, Action<string>> => async (dispatch) => {
    dispatch({ type: SEARCH_PROJECTS_REQUEST, query, offset });

    if (isEmpty(query)) {
        return;
    }

    const searchRequest = await fetch(
        `${searchURL}/query/projects/${query}/8/${offset}/name/desc`
    );
    const projects = await searchRequest.json();
    projects.data = projects.data.slice(0, 8);

    const searchResult: IProject[] = projects.data.map(
        firestoreProjectToIProject
    );

    const userIDs = pluck("userUid", searchResult);

    if (!isEmpty(userIDs)) {
        const projectProfiles = {};

        const profilesQuery = await profiles
            .where(firebase.firestore.FieldPath.documentId(), "in", userIDs)
            .get();

        profilesQuery.forEach((snapshot) => {
            projectProfiles[snapshot.id] = snapshot.data();
        });

        dispatch({
            type: ADD_USER_PROFILES,
            payload: projectProfiles
        });
    }

    dispatch({
        type: SEARCH_PROJECTS_SUCCESS,
        result: searchResult,
        totalRecords: projects.totalRecords
    });
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

        if (!isEmpty(starsIDs)) {
            const publicProjectsSnapshots = await projects
                .where("public", "==", true)
                .where(
                    firebase.firestore.FieldPath.documentId(),
                    "in",
                    starsIDs
                )
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
                    type: ADD_USER_PROFILES,
                    payload: projectProfiles
                });
            }

            dispatch({
                type: FETCH_POPULAR_PROJECTS,
                payload: popularProjects,
                totalRecords: starredProjects.totalRecords
            });
        }
    };
};
