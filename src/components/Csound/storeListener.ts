import {ICsoundObj} from "./interfaces"
import { store } from "../../store";
import _ from "lodash"

export function registerCsoundStoreListener(csound:ICsoundObj) {
    let docs = store.getState().ProjectsReducer.projects[0].documents;
    let last = docs.map(d => d.documentUid);

    store.subscribe(() => {
        let docs = store.getState().ProjectsReducer.projects[0].documents;
        let current = docs.map(d => d.documentUid);

        let removes = _.difference(last, current);
        let adds = _.difference(current, last);

        if(last != current) {

            for(let i of adds) {
   //             csound.writeToFS()
            }
            //console.log("Adds " + adds)
            //console.log("Removes " + removes)

            last = current;
        }

    })
}