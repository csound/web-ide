import { useProjectToolFiles } from "./project-files";
import ImpulseTool from "./impulse-tool";
import AudioTool from "./audio-tool";

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
    const { sources, onSave } = useProjectToolFiles(projectUid, isAudio, {
        acceptsDocument: (document) => document.type === "bin"
    });
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
