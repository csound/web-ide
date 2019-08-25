/**
 * Sync listener to synchronize changes from Firestore to Redux
 */

import { projects } from "../config/firestore";
import { store } from "../store";

const sync = () => ({ type: "FIRESTORE_SYNC" });

projects.onSnapshot(doc => {
    store.dispatch(sync());
});