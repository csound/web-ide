import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import { FileTree } from "../../src/components/file-tree";
import { DnDProvider } from "../../src/components/file-tree/context";
import {
    addNonCloudFile,
    nonCloudFiles
} from "../../src/components/file-tree/actions";
import { SIGNIN_SUCCESS } from "../../src/components/login/types";
import type { IDocument, IProject } from "../../src/components/projects/types";

function document(
    filename: string,
    path: string[] = [],
    type: IDocument["type"] = "txt"
): IDocument {
    return {
        documentUid: filename,
        filename,
        path,
        type,
        currentValue: "",
        savedValue: "",
        isModifiedLocally: false,
        userUid: "fixture-author",
        created: undefined,
        lastModified: undefined
    };
}
const documents = [
    document("samples", [], "folder"),
    document("nested", ["samples"], "folder"),
    document("deep.orc", ["samples", "nested"]),
    document("nested.wav", ["samples"], "bin"),
    ...[
        "project.csd",
        "instrument.orc",
        "score.sco",
        "README.md",
        "opcodes.udo",
        "macros.h",
        "include.inc",
        "sample.wav",
        "sample.FLAC",
        "sequence.mid",
        "piano.sf2",
        "instrument.sfz",
        "spring.matrxB",
        "spectrum.pvx",
        "partials.ats",
        "tuning.scl",
        "keys.kbm",
        "table.ftable",
        "score.csv",
        "settings.json",
        "generate.py",
        "player.html",
        "cover.png",
        "movie.webm",
        "samples.zip",
        "score.pdf",
        "notes.txt"
    ].map((name) => document(name)),
    document("unknown.asset", [], "bin"),
    document("unknown-source", [], "txt"),
    document("a-very-long-filename-to-check-ellipsis-with-visible-actions.csd")
];
const project: IProject = {
    projectUid: "icons-fixture",
    userUid: "fixture-author",
    name: "File types",
    description: "",
    isPublic: false,
    tags: [],
    stars: {},
    documents: Object.fromEntries(
        documents.map((doc) => [doc.documentUid, doc])
    )
};
store.dispatch({ type: SIGNIN_SUCCESS, user: { uid: "fixture-author" } });
store.dispatch({ type: "PROJECTS.STORE_PROJECT_LOCALLY", projects: [project] });
store.dispatch({
    type: "PROJECTS.ACTIVATE_PROJECT",
    projectUid: project.projectUid
});
for (const name of ["rendered.wav", "rendered.unknown"]) {
    nonCloudFiles.set(name, {
        name,
        buffer: new Uint8Array(),
        createdAt: new Date()
    });
    store.dispatch(addNonCloudFile({ name, createdAt: Date.now() }));
}
createRoot(window.document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <main
                    style={{
                        width: "100%",
                        maxWidth: 520,
                        height: "100vh",
                        margin: "auto"
                    }}
                >
                    <DnDProvider project={project}>
                        <FileTree activeProjectUid={project.projectUid} />
                    </DnDProvider>
                </main>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
