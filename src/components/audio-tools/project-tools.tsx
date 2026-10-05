import { getDownloadURL } from "firebase/storage";
import { storageReference } from "@config/firestore";
import { useDispatch, useSelector } from "@root/store";
import { addNonCloudFile, nonCloudFiles } from "../file-tree/actions";
import { getUniqueFilename } from "../projects/utils";
import AudioTool, { type AudioSource } from "./audio-tool";

const isAudio = (name: string) =>
    /\.(wav|wave|aif|aiff|flac|mp3|ogg|opus|m4a|aac|webm)$/i.test(name);

function ProjectAudioTool({
    projectUid,
    mode
}: {
    projectUid: string;
    mode: "sample" | "analysis";
}) {
    const dispatch = useDispatch();
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
                    document.type === "bin" && isAudio(document.filename)
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
                    const url = await getDownloadURL(
                        await storageReference(
                            `${document.userUid}/${projectUid}/${document.documentUid}`
                        )
                    );
                    const response = await fetch(url, { signal });
                    if (!response.ok)
                        throw new Error(
                            "Could not read the project audio file."
                        );
                    return new Uint8Array(await response.arrayBuffer());
                }
            })),
        ...generated.filter(isAudio).map((name) => ({
            id: `generated:${name}`,
            name,
            load: async () => {
                const file = nonCloudFiles.get(name);
                if (!file)
                    throw new Error(
                        "This generated file is no longer available."
                    );
                return file.buffer.slice();
            }
        }))
    ];
    return (
        <AudioTool
            key={projectUid}
            mode={mode}
            sources={sources}
            onSave={(file) => {
                const name = getUniqueFilename(
                    file.name.replace(/^.*[/\\]/, ""),
                    [
                        ...nonCloudFiles.keys(),
                        ...Object.values(documents || {}).map(
                            (document) => document.filename
                        )
                    ]
                );
                const createdAt = new Date();
                nonCloudFiles.set(name, { name, createdAt, buffer: file.data });
                dispatch(
                    addNonCloudFile({ name, createdAt: createdAt.getTime() })
                );
                return name;
            }}
        />
    );
}

export function SampleEditor({ projectUid }: { projectUid: string }) {
    return <ProjectAudioTool projectUid={projectUid} mode="sample" />;
}
export function AudioAnalysis({ projectUid }: { projectUid: string }) {
    return <ProjectAudioTool projectUid={projectUid} mode="analysis" />;
}
