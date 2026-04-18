/**
 * E2E mock project data.
 *
 * When `VITE_E2E` is set, the project-context bypasses Firestore and uses
 * this hardcoded project so the editor mounts without a real backend.
 */
import { IDocument, IProject } from "./types";

const MOCK_DOC_UID = "e2e-doc-001";
const MOCK_PROJECT_UID = "e2e-project";

const CSD_VALUE = `<CsoundSynthesizer>
<CsOptions>
</CsOptions>
<CsInstruments>
0dbfs=1
nchnls=2

instr 1
  asig vco2 p4, p5
  aenv linenr asig,0.01,0.1,0.01
  out aenv, aenv
endin

event_i "i", 1, 0, 2, 0dbfs/2, A4
event_i "e", 0, 2.5

</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>`;

const mockDocument: IDocument = {
    currentValue: CSD_VALUE,
    created: Date.now(),
    documentUid: MOCK_DOC_UID,
    filename: "project.csd",
    lastModified: Date.now(),
    savedValue: CSD_VALUE,
    type: "txt",
    userUid: "e2e-user",
    isModifiedLocally: false,
    path: []
};

export const e2eMockProject: IProject = {
    projectUid: MOCK_PROJECT_UID,
    description: "E2E test project",
    name: "E2E Test",
    userUid: "e2e-user",
    isPublic: true,
    documents: { [MOCK_DOC_UID]: mockDocument },
    stars: {},
    tags: []
};
