// Fictional project: browser tests block all cloud requests.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import { FileTree } from "../../src/components/file-tree";
import { DnDProvider } from "../../src/components/file-tree/context";
import { TargetControlsConfigDialogSingleTarget } from "../../src/components/target-controls/config-dialog/single-target";
import type { IDocument, IProject } from "../../src/components/projects/types";

const documents: IDocument[] = Array.from({ length: 100 }, (_, index) => {
    const filename = `example-${String(index + 1).padStart(3, "0")}.csd`;
    return {
        documentUid: filename,
        filename,
        path: [],
        type: "txt",
        currentValue: "",
        savedValue: "",
        isModifiedLocally: false,
        userUid: "fixture-author",
        created: undefined,
        lastModified: undefined
    };
});
const project: IProject = {
    projectUid: "file-list-fixture",
    userUid: "fixture-author",
    name: "Many files",
    description: "",
    isPublic: true,
    tags: [],
    stars: {},
    documents: Object.fromEntries(
        documents.map((document) => [document.documentUid, document])
    )
};
store.dispatch({ type: "PROJECTS.STORE_PROJECT_LOCALLY", projects: [project] });
store.dispatch({
    type: "PROJECTS.ACTIVATE_PROJECT",
    projectUid: project.projectUid
});

function Fixture() {
    const [selected, setSelected] = useState(documents[0].documentUid);
    return (
        <main style={{ display: "flex", gap: 24, padding: 24 }}>
            <section
                style={{ width: 320, height: 400 }}
                aria-label="Project files"
            >
                <DnDProvider project={project}>
                    <FileTree activeProjectUid={project.projectUid} />
                </DnDProvider>
            </section>
            <section aria-label="Target settings">
                <TargetControlsConfigDialogSingleTarget
                    allDocuments={documents}
                    targetIndex={0}
                    targetName="Main"
                    oldTargetName="Main"
                    targetDocumentUid={selected}
                    isDefaultTarget={true}
                    handleTargetDelete={() => {}}
                    handleTargetNameChange={() => {}}
                    handleSelectTargetDocument={({ nextTargetDocumentUid }) =>
                        setSelected(nextTargetDocumentUid)
                    }
                    handleMarkAsDefaultTarget={() => {}}
                    newTargets={[]}
                />
                <output data-testid="selected-target">{selected}</output>
            </section>
        </main>
    );
}
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <Fixture />
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
