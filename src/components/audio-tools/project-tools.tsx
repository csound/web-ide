import { getDownloadURL } from "firebase/storage";
import { storageReference } from "@config/firestore";
import { useSelector } from "@root/store";
import { nonCloudFiles } from "../file-tree/actions";
import { checkAudioBytes, readAudioStream } from "./limits";
import { useSaveAudioFile } from "./use-save-audio-file";
import ImpulseTool from "./impulse-tool";
import AudioTool, { type AudioSource } from "./audio-tool";

/** Identify project files the browser audio loader can accept. */
const isAudio = (name: string) =>
    /\.(wav|wave|aif|aiff|flac|mp3|ogg|opus|m4a|aac|webm)$/i.test(name);

/** Connect audio sources and explicit result retention to the current project file tree. */
function ProjectAudioTool({
    projectUid,
    mode
}: {
    projectUid: string;
    mode: "sample" | "analysis" | "impulse" | "convolution";
}) {
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
                    if (!response.body)
                        throw new Error(
                            "Could not read the project audio file."
                        );
                    return readAudioStream(
                        response.body,
                        signal,
                        Number(response.headers.get("content-length"))
                    );
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
                checkAudioBytes(file.buffer.length);
                return file.buffer.slice();
            }
        }))
    ];
    const onSave = useSaveAudioFile(projectUid);
    return mode === "impulse" || mode === "convolution" ? (
        <ImpulseTool
            key={projectUid}
            mode={mode}
            sources={sources}
            onSave={onSave}
        />
    ) : (
        <AudioTool
            key={projectUid}
            mode={mode}
            sources={sources}
            onSave={onSave}
        />
    );
}

/** Open the sample editor with project audio sources and a separate result file. */
export function SampleEditor({ projectUid }: { projectUid: string }) {
    return <ProjectAudioTool projectUid={projectUid} mode="sample" />;
}
/** Open file analysis with project audio sources and downloadable Csound data. */
export function AudioAnalysis({ projectUid }: { projectUid: string }) {
    return <ProjectAudioTool projectUid={projectUid} mode="analysis" />;
}

/** Create a reference sweep or recover a response from recorded audio. */
export function ImpulseResponse({ projectUid }: { projectUid: string }) {
    return <ProjectAudioTool projectUid={projectUid} mode="impulse" />;
}
/** Prepare an existing response for Csound's convolve opcode. */
export function ConvolutionPrep({ projectUid }: { projectUid: string }) {
    return <ProjectAudioTool projectUid={projectUid} mode="convolution" />;
}
