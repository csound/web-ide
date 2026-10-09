import { lazy, Suspense, useEffect, useState } from "react";
import { getDownloadURL } from "firebase/storage";
import { storageReference } from "../../config/firestore";
import { useSaveAudioFile } from "../audio-tools/use-save-audio-file";

const AudioFilePreview = lazy(() =>
    import("./file-preview").then((module) => ({
        default: module.AudioFilePreview
    }))
);

export const AudioEditor = ({
    audioFileUrl,
    filename,
    projectUid
}: {
    audioFileUrl: string;
    filename: string;
    projectUid: string;
}) => {
    const [resolved, setResolved] = useState<{ path: string; url: string }>();
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const onSave = useSaveAudioFile(projectUid);
    useEffect(() => {
        let cancelled = false;
        setError("");
        const resolve = async () => {
            try {
                const url = audioFileUrl.startsWith("blob:")
                    ? audioFileUrl
                    : await getDownloadURL(
                          await storageReference(audioFileUrl)
                      );
                if (!cancelled) setResolved({ path: audioFileUrl, url });
            } catch {
                if (!cancelled) setError("Could not open this audio file.");
            }
        };
        void resolve();
        return () => {
            cancelled = true;
        };
    }, [audioFileUrl, attempt]);
    if (error)
        return (
            <p role="alert">
                {error}{" "}
                <button onClick={() => setAttempt((value) => value + 1)}>
                    Retry
                </button>
            </p>
        );
    return (
        <Suspense fallback={<p role="status">Opening audio preview…</p>}>
            {resolved?.path === audioFileUrl ? (
                <AudioFilePreview
                    key={`${projectUid}:${audioFileUrl}`}
                    url={resolved.url}
                    filename={filename}
                    onSave={onSave}
                />
            ) : (
                <p role="status">Looking up audio file…</p>
            )}
        </Suspense>
    );
};
