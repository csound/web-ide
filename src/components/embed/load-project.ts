import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { projects, targets } from "@config/firestore";
import { IFirestoreDocument, IFirestoreProject } from "@db/types";
import { IDocument, IProject } from "@comp/projects/types";
import {
    fileDocumentDataToDocumentType,
    firestoreProjectToIProject
} from "@comp/projects/utils";
import { ITarget } from "@comp/target-controls/types";
import { findFallbackPlayTarget } from "@comp/target-controls/utils";

export const isPlayable = (document: IDocument): boolean =>
    document.type === "txt" && /\.(csd|orc)$/i.test(document.filename);

export async function loadEmbedProject(projectUid: string): Promise<{
    project: IProject;
    documentUid?: string;
}> {
    const reference = doc(projects, projectUid);
    const snapshot = await getDoc(reference);
    if (!snapshot.exists() || snapshot.data().public !== true) {
        throw new Error("This project is private or no longer exists.");
    }

    // Check visibility before requesting any source files.
    const [files, targetSnapshot] = await Promise.all([
        getDocs(collection(reference, "files")),
        getDoc(doc(targets, projectUid))
    ]);
    const project = firestoreProjectToIProject({
        ...snapshot.data(),
        id: snapshot.id
    } as IFirestoreProject);
    project.documents = Object.fromEntries(
        files.docs.map((file) => [
            file.id,
            fileDocumentDataToDocumentType(
                file.data() as IFirestoreDocument,
                file.id
            )
        ])
    );
    const settings = targetSnapshot.data();
    const target: ITarget | undefined =
        settings?.targets?.[settings.defaultTarget];
    const defaultUid =
        target?.targetType === "main"
            ? target.targetDocumentUid
            : target?.playlistDocumentsUid?.[0];
    const defaultDocument = defaultUid && project.documents[defaultUid];
    const playable = Object.values(project.documents).filter(isPlayable);
    return {
        project,
        documentUid:
            defaultDocument && isPlayable(defaultDocument)
                ? defaultDocument.documentUid
                : (findFallbackPlayTarget(playable) ?? playable[0])?.documentUid
    };
}
