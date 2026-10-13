import { store } from "../../src/store";
import {
    getStarterFiles,
    type ProjectStarterTemplate
} from "../../src/csound-templates/starters";
import {
    getLiveCsound,
    isCsoundBusy,
    runPerformance,
    stopPerformance
} from "../../src/components/csound/actions";

let lines: string[] = [];
let analyser: AnalyserNode | undefined;
let projectUid = "";
(window as any).starters = {
    async start(template: ProjectStarterTemplate, useSAB: boolean) {
        lines = [];
        projectUid = `starter-${template}`;
        store.dispatch({
            type: "PROJECTS.STORE_PROJECT_LOCALLY",
            projects: [
                {
                    projectUid,
                    name: template,
                    userUid: "fixture",
                    isPublic: false,
                    description: "",
                    tags: [],
                    stars: {},
                    documents: Object.fromEntries(
                        getStarterFiles(template, "fixture").map((file) => [
                            file.name,
                            {
                                documentUid: file.name,
                                filename: file.name,
                                path: [],
                                type: file.type,
                                currentValue: file.value,
                                savedValue: file.value,
                                isModifiedLocally: false,
                                userUid: "fixture"
                            }
                        ])
                    )
                }
            ]
        });
        store.dispatch({ type: "PROJECTS.ACTIVATE_PROJECT", projectUid });
        const result = await runPerformance({
            projectUid,
            csdPath: "project.csd",
            mode: "play",
            useSAB,
            setConsole: (value) => {
                lines = typeof value === "function" ? value(lines) : value;
            }
        });
        const csound = getLiveCsound(projectUid);
        const node = await csound?.getNode();
        if (node) {
            analyser = node.context.createAnalyser();
            node.connect(analyser);
        }
        return result.status;
    },
    midi: (status: number, note: number, velocity: number) =>
        getLiveCsound(projectUid)?.midiMessage(status, note, velocity),
    level() {
        if (!analyser) return 0;
        const data = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(data);
        return Math.max(...data.map(Math.abs));
    },
    log: () => lines.join(""),
    busy: isCsoundBusy,
    async stop() {
        analyser?.disconnect();
        analyser = undefined;
        await stopPerformance(projectUid);
    }
};
