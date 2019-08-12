import { IDocument, IProject } from "./interfaces";
//import { merge } from "lodash";

export interface IProjectsReducer {
    activeProject: number,
    activeDocument: number,
    projects: IProject[];
};

const defaultCsd: IDocument = {
    currentValue: "",
    lastEdit: null,
    name: "project.csd",
    savedValue: `<CsoundSynthesizer>
<CsOptions>
-o dac
</CsOptions>
<CsInstruments>
#include "project.orc"
</CsInstruments>
<CsScore>
#include "project.sco"
</CsScore>
</CsoundSynthesizer>
    `,
    type: "csd",
}

const defaultOrc: IDocument = {
    currentValue: "",
    lastEdit: null,
    name: "project.orc",
    savedValue: `
sr=44100
ksmps=32
0dbfs=1

instr 1
  iamp = ampdbfs(p5)
  ipch = cps2pch(p4,12)
  ipan = 0.5

  asig = vco2(iamp, ipch)

  al, ar pan2 asig, ipan

  out(al, ar)
endin
    `,
    type: "orc",
}

const defaultSco: IDocument = {
    currentValue: "",
    lastEdit: null,
    name: "project.sco",
    savedValue: `
i1 0 2 8.00 -12
    `,
    type: "sco",
}

const initialProjectsState: IProjectsReducer = {
    activeProject: 0,
    activeDocument: 0,
    projects:[
        {
            name: "Untitled Project",
            isPublic: false,
            documents: [defaultCsd, defaultOrc, defaultSco],
            projectId: 0,
            assets: [],
        },
    ]
}

export default (state: IProjectsReducer, action: any) => {
    switch (action.type) {
        case "DOCUMENT_UPDATE_VALUE": {
            state.projects[action.projectIndex].documents[action.documentIndex].currentValue = action.val;
            return {...state};
        }
        case "DOCUMENT_NEW": {
            console.log("what.")
            state.projects[action.projectIndex].documents.push({
                currentValue: action.val,
                lastEdit: null,
                name: action.name,
                savedValue: action.val,
                type: "orc",
            });
            return {...state};
        }
        default: {
            return state || initialProjectsState;
        }
    }
}
