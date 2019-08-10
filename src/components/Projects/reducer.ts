import { IDocument, IProject } from "./interfaces";
//import { merge } from "lodash";

export interface IProjectsReducer {
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
    projects:[
        {
            name: "Untitled Project",
            isPublic: false,
            documents: [defaultCsd, defaultOrc, defaultSco],
            projectId: 0,
            assets: [],
        }
    ]
}

export default (state: IProjectsReducer, action: any) => {
    switch (action.type) {
        default: {
            return initialProjectsState;
        }
    }
}
