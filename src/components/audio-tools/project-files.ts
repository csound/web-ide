import { getDownloadURL } from "firebase/storage";
import { storageReference } from "@config/firestore";
import { useSelector } from "@root/store";
import { nonCloudFiles } from "../file-tree/actions";
import { useSaveAudioFile } from "./use-save-audio-file";
import type { IDocument } from "../projects/types";
import { checkAudioBytes, readAudioStream } from "./limits";
import type { AudioSource } from "./audio-tool";

/** Share bounded project-file reads and explicit result retention across tools. */
export function useProjectToolFiles(
    projectUid: string,
    accepts: (name: string) => boolean,
    {
        checkSize = checkAudioBytes,
        acceptsDocument = () => true
    }: {
        checkSize?: (size: number) => void;
        acceptsDocument?: (document: IDocument) => boolean;
    } = {}
) {
    const documents = useSelector(
        (state) => state.ProjectsReducer.projects[projectUid]?.documents
    );
    const generated = useSelector(
        (state) => state.FileTreeReducer.nonCloudFiles
    );
    const sources: AudioSource[] = [
        ...Object.values(documents || {})
            .filter(
                (document) =>
                    document.type !== "folder" &&
                    accepts(document.filename) &&
                    acceptsDocument(document)
            )
            .map((document) => ({
                id: document.documentUid,
                name: [
                    ...document.path.map(
                        (id) => documents?.[id]?.filename || id
                    ),
                    document.filename
                ].join("/"),
                load: async (signal: AbortSignal) => {
                    signal.throwIfAborted();
                    if (document.type !== "bin") {
                        checkSize(document.currentValue.length);
                        const bytes = new TextEncoder().encode(
                            document.currentValue
                        );
                        checkSize(bytes.length);
                        return bytes;
                    }
                    const url = await getDownloadURL(
                        await storageReference(
                            `${document.userUid}/${projectUid}/${document.documentUid}`
                        )
                    );
                    const response = await fetch(url, { signal });
                    if (!response.ok)
                        throw new Error("Could not read the project file.");
                    if (!response.body)
                        throw new Error("Could not read the project file.");
                    return readAudioStream(
                        response.body,
                        signal,
                        Number(response.headers.get("content-length")),
                        checkSize
                    );
                }
            })),
        ...generated.filter(accepts).map((name) => ({
            id: `generated:${name}`,
            name,
            load: async () => {
                const file = nonCloudFiles.get(name);
                if (!file)
                    throw new Error(
                        "This generated file is no longer available."
                    );
                checkSize(file.buffer.length);
                return file.buffer.slice();
            }
        }))
    ];
    const onSave = useSaveAudioFile(projectUid);
    return { sources, onSave };
}
