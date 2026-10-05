import { store } from "@root/store";
import { addNonCloudFile, nonCloudFiles } from "@comp/file-tree/actions";
import { getUniqueFilename } from "@comp/projects/utils";
import type { IDocument } from "@comp/projects/types";
import { documentPath, runPerformanceBatch } from "./actions";
import { renderFilename, type RenderSettings } from "./render-settings";
import { encodingCsd, joinWaves, readWave, splitWave } from "./wave-files";

export type RenderJob = {
    projectUid: string;
    documents: IDocument[];
    settings: RenderSettings;
    combine: boolean;
    splitChannels: boolean;
    signal: AbortSignal;
    setConsole: React.Dispatch<React.SetStateAction<string[]>>;
    onProgress: (message: string) => void;
};

export async function renderJob(job: RenderJob): Promise<string[]> {
    if (!job.documents.length) throw new Error("Choose at least one track.");
    return runPerformanceBatch(async (perform, signal) => {
        const project =
            store.getState().ProjectsReducer.projects[job.projectUid];
        if (!project) throw new Error("No project is open.");
        const staged: { name: string; buffer: Uint8Array }[] = [];
        const combined: Uint8Array[] = [];
        let totalBytes = 0;
        const stage = (name: string, buffer: Uint8Array) => {
            totalBytes += buffer.byteLength;
            if (totalBytes > 512 * 1024 * 1024)
                throw new Error(
                    "This export exceeds 512 MB. Render fewer tracks or a shorter score."
                );
            staged.push({ name, buffer });
        };
        const encode = async (bytes: Uint8Array, name: string) => {
            signal.throwIfAborted();
            job.onProgress(`Encoding ${name}`);
            const wave = readWave(bytes);
            if (job.settings.format === "mp3" && wave.channels > 2)
                throw new Error(
                    "MP3 supports one or two channels. Choose separate mono files or use WAV or Ogg."
                );
            const inputName = getUniqueFilename(
                "csound-encoding-input.wav",
                Object.values(project.documents).map((doc) =>
                    documentPath(doc, project.documents)
                )
            );
            const result = await perform({
                projectUid: job.projectUid,
                csdText: encodingCsd(bytes, inputName),
                inputFiles: [{ name: inputName, data: bytes }],
                collectFiles: false,
                mode: "render",
                setConsole: job.setConsole,
                renderSettings: {
                    ...job.settings,
                    filename: name,
                    channels: wave.channels,
                    sampleRate: wave.sampleRate,
                    ksmps: 1,
                    orchestraMacros: undefined,
                    scoreMacros: undefined
                }
            });
            if (!result.audio)
                throw new Error("The encoder produced no audio.");
            stage(
                renderFilename({ ...job.settings, filename: name }),
                result.audio
            );
        };
        const exportPcm = async (bytes: Uint8Array, name: string) => {
            if (job.splitChannels) {
                const parts = splitWave(bytes);
                for (const [index, part] of parts.entries())
                    await encode(
                        part,
                        `${name}-ch${String(index + 1).padStart(2, "0")}`
                    );
            } else await encode(bytes, name);
        };
        let combinedBytes = 0;
        for (const [index, doc] of job.documents.entries()) {
            signal.throwIfAborted();
            job.onProgress(
                `Rendering ${index + 1} of ${job.documents.length}: ${doc.filename}`
            );
            const intermediate = job.combine || job.splitChannels;
            const csd = /\.csd$/i.test(doc.filename);
            const result = await perform({
                projectUid: job.projectUid,
                csdPath: csd ? documentPath(doc, project.documents) : undefined,
                orc: doc.currentValue,
                collectFiles: false,
                mode: "render",
                setConsole: job.setConsole,
                renderSettings: {
                    ...job.settings,
                    ...(intermediate
                        ? { format: "wav", bitDepth: "double", dither: false }
                        : {})
                }
            });
            if (!result.audio)
                throw new Error(`${doc.filename} produced no audio.`);
            const stem = job.settings.filename.replace(/\.(wav|ogg|mp3)$/i, "");
            const name =
                job.documents.length === 1 || job.combine
                    ? stem
                    : `${stem}-${String(index + 1).padStart(2, "0")}-${doc.filename.replace(/\.[^.]+$/, "").replace(/[/\\"<>|:*?]/g, "_")}`;
            if (job.combine) {
                combinedBytes += result.audio.length;
                if (combinedBytes > 512 * 1024 * 1024)
                    throw new Error(
                        "This combined export exceeds 512 MB. Render fewer tracks at a time."
                    );
                combined.push(result.audio);
            } else if (intermediate) await exportPcm(result.audio, name);
            else
                stage(
                    renderFilename({ ...job.settings, filename: name }),
                    result.audio
                );
        }
        if (job.combine)
            await exportPcm(
                joinWaves(combined),
                job.settings.filename.replace(/\.(wav|ogg|mp3)$/i, "")
            );
        signal.throwIfAborted();
        if (
            store.getState().ProjectsReducer.activeProjectUid !== job.projectUid
        )
            throw new Error(
                "The project changed during rendering. No files were added."
            );
        // Publish only once the whole job succeeds; cancellation leaves no partial batch.
        return staged.map((file) => {
            const name = getUniqueFilename(file.name, [
                ...nonCloudFiles.keys()
            ]);
            nonCloudFiles.set(name, { ...file, name, createdAt: new Date() });
            store.dispatch(addNonCloudFile({ name, createdAt: Date.now() }));
            return name;
        });
    }, job.signal);
}
