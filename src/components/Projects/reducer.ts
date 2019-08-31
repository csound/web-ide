import { IDocument, IProject } from "./interfaces";
import { generateUid } from "../../utils";

export interface IProjectsReducer {
    activeProjectUid: string;
    projects: {[projectUid: string]: IProject};
};

const defaultCsd: IDocument = {
    currentValue: "",
    documentUid: generateUid("project.csd"),
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
    documentUid: generateUid("project.orc"),
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
    documentUid: generateUid("project.sco"),
    lastEdit: null,
    name: "project.sco",
    savedValue: `
i1 0 2 8.00 -12
    `,
    type: "sco",
}

export const initialProjectUid: string = generateUid("defaultproject");

export const initialDocumentUids: string[] = [
    defaultCsd.documentUid, defaultOrc.documentUid, defaultSco.documentUid
];

const initialProjectsState: IProjectsReducer = {
    activeProjectUid: initialProjectUid,
    projects: {
        [initialProjectUid]: {
            name: "Untitled Project",
            isPublic: false,
            documents: {
                [defaultCsd.documentUid]: defaultCsd,
                [defaultOrc.documentUid]: defaultOrc,
                [defaultSco.documentUid]: defaultSco,
            },
            projectUid: initialProjectUid,
            assets: [],
        },
    }
}

export default (state: IProjectsReducer = initialProjectsState, action: any) => {
    switch (action.type) {
        case "DOCUMENT_UPDATE_VALUE": {
            if (!action.documentUid || !action.projectUid) {return state;}
            state.projects[action.projectUid].documents[action.documentUid].currentValue = action.val;
            return {...state};
        }
        case "DOCUMENT_NEW": {
            state.projects[action.projectUid].documents =
                {...state.projects[action.projectUid].documents,
                 [action.documentUid]: {
                     currentValue: action.val,
                     documentUid: action.documentUid,
                     lastEdit: null,
                     name: action.name,
                     savedValue: action.val,
                     type: "orc",
                 }} ;
            return {...state};
        }
        default: {
            return initialProjectsState;
        }
    }
}
