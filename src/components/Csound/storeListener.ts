import {ICsoundObj} from "./interfaces"
import { store } from "../../store";
// import { difference } from "lodash"

export function registerCsoundStoreListener(csound:ICsoundObj) {
    // let docs = store.getState().ProjectsReducer.projects[0].documents;
    // let last = Object.values(docs).map(d => d.documentUid);

    store.subscribe(() => {
        // const activeProjectUid = store.getState().ProjectsReducer.activeProjectUid;
        // const current = store.getState().ProjectsReducer.projects[activeProjectUid].documents;

        // let removes = difference(last, current);
        // let adds = difference(current, last);

        // if(removes.length > 0 || adds.length > 0) {
        //
        //     for(let i of adds) {
        //         console.log("Added: " + i);
        //         // csound.writeToFS()
        //     }
        //     //console.log("Adds " + adds)
        //     //console.log("Removes " + removes)
        //
        //     last = current;
        // }

    })
}
