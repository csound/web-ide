import { isIOS } from "@root/utils";

// Audio Session is still absent from TypeScript's DOM declarations.
type AudioSessionType =
    | "auto"
    | "playback"
    | "play-and-record"
    | "ambient"
    | "transient"
    | "transient-solo";
type AudioSession = { type: AudioSessionType };

/** Call before Csound creates its AudioContext, never for offline rendering. */
export function beginPlaybackAudioSession() {
    if (!isIOS()) return;
    try {
        const session = (
            navigator as Navigator & { audioSession?: AudioSession }
        ).audioSession;
        if (!session) return;
        const previous = session.type;
        let applied = previous;
        const setType = (type: AudioSessionType) => {
            if (session.type !== type) session.type = type;
            applied = session.type;
        };
        // iOS otherwise treats Web Audio as ambient sound and obeys Silent Mode.
        // https://bugs.webkit.org/show_bug.cgi?id=237322#c6
        if (previous !== "play-and-record") setType("playback");
        return {
            enableInput: () => {
                try {
                    setType("play-and-record");
                } catch {
                    // Session support must not prevent microphone permission requests.
                }
            },
            release: () => {
                try {
                    // Do not overwrite a session changed by another audio user.
                    if (session.type === applied) setType(previous);
                } catch {
                    // The document may already be closing.
                }
            }
        };
    } catch {
        // Older browsers and restricted embeds may not allow session changes.
        return;
    }
}
