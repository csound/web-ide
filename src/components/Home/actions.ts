import {profiles, projects} from '@config/firestore';
import {firestore} from 'firebase/app';
import {Action} from 'redux';
import {ThunkAction} from 'redux-thunk';

import {selectStars} from './selectors';
import {GET_DISPLAYED_RANDOM_PROJECTS, GET_DISPLAYED_STARRED_PROJECTS, GET_FEATURED_PROJECT_USER_PROFILES, GET_SEARCHED_PROJECT_USER_PROFILES, GET_STARS, SEARCH_PROJECTS_REQUEST, SEARCH_PROJECTS_SUCCESS} from './types';

const databaseID = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
const searchURL = `https://web-ide-search-api.csound.com/search/${databaseID}`;
// const searchURL = `http://localhost:4000/search/${databaseID}`;



export const searchProjects = (query: string, offset: number):
    ThunkAction<void, any, null, Action<string>> => async dispatch => {
      dispatch({type: SEARCH_PROJECTS_REQUEST});

      const searchRequest = await fetch(
          `${searchURL}/query/projects/${query}/8/${offset}/name/desc`);
      let projects = await searchRequest.json();
      projects.data = projects.data.slice(0, 8);

      const userIDs = [...new Set([...projects.data.map(e => e.userUid)])];

      if (userIDs.length === 0) {
        dispatch({type: GET_SEARCHED_PROJECT_USER_PROFILES, payload: false});
        dispatch({type: SEARCH_PROJECTS_SUCCESS, payload: false});

        return;
      }

      const projectProfiles = {};

      const profilesQuery =
          await profiles.where(firestore.FieldPath.documentId(), 'in', userIDs)
              .get();

      profilesQuery.forEach(snapshot => {
        projectProfiles[snapshot.id] = snapshot.data();
      });

      dispatch(
          {type: GET_SEARCHED_PROJECT_USER_PROFILES, payload: projectProfiles});

      dispatch({type: SEARCH_PROJECTS_SUCCESS, payload: projects});
    };

export const getStars = (): ThunkAction<void, any, null, Action<string>> =>
    async dispatch => {
  const starsRequest = await fetch(`${searchURL}/list/stars/8/0/count/desc`);
  let starredProjects = await starsRequest.json();
  starredProjects.data = starredProjects.data.slice(0, 4);

  dispatch({type: GET_STARS, payload: starredProjects});
};

export const getPopularProjects =
    (): ThunkAction<void, any, null, Action<string>> =>
        async (dispatch, getStore) => {
      const state = getStore();
      const orderedStars = selectStars(state);
      const starsIDs = orderedStars.map(e => (e as any).id);

      if (orderedStars.length === 0) {
        return;
      }
      const splitStarProjectsQuery =
          await projects.where('public', '==', true)
              .where(firestore.FieldPath.documentId(), 'in', starsIDs)
              .get();

      const starProjects: any[] = [];
      splitStarProjectsQuery.forEach(snapshot => {
        starProjects.push({id: snapshot.id, ...snapshot.data()});
      });

      const starProjectsIDs = starProjects.map(e => e.id);

      const randomProjectsRequest =
          await fetch(`${searchURL}/random/projects/8`);
      let randomProjects = await randomProjectsRequest.json();
      randomProjects = randomProjects.data
                           .filter(e => {
                             return starProjectsIDs.includes(e.id) === false;
                           })
                           .slice(0, 4);

      const userIDs = [...new Set([
        ...starProjects.map(e => e.userUid),
        ...randomProjects.map(e => e.userUid)
      ])];

      const projectProfiles = {};

      const profilesQuery =
          await profiles.where(firestore.FieldPath.documentId(), 'in', userIDs)
              .get();

      profilesQuery.forEach(snapshot => {
        projectProfiles[snapshot.id] = snapshot.data();
      });

      dispatch(
          {type: GET_FEATURED_PROJECT_USER_PROFILES, payload: projectProfiles});
      dispatch({type: GET_DISPLAYED_STARRED_PROJECTS, payload: starProjects});
      dispatch({type: GET_DISPLAYED_RANDOM_PROJECTS, payload: randomProjects});
    };
