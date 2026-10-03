import { useSyncExternalStore } from "react";
import type { CsoundObj, ReadlineEvent } from "@csound/browser";

export type { ReadlineEvent } from "@csound/browser";

export interface ReadlineEngine extends Pick<CsoundObj, "readlineSubmit"> {
    on: (
        event: "readline",
        listener: (event: ReadlineEvent) => void
    ) => unknown;
    off: (
        event: "readline",
        listener: (event: ReadlineEvent) => void
    ) => unknown;
}

type Request = { requestId: number; prompt: string; projectUid: string };
type Snapshot = {
    request: Request | null;
    draft: string;
    queued: number;
    submitting: boolean;
    error: string;
};
const empty: Snapshot = {
    request: null,
    draft: "",
    queued: 0,
    submitting: false,
    error: ""
};

export function createReadlineConsole() {
    let snapshot = empty;
    const listeners = new Set<() => void>();
    let disconnect = () => {};
    let send = () => {};
    let clearQueue = () => {};
    const update = (changes: Partial<Snapshot>) => {
        snapshot = { ...snapshot, ...changes };
        listeners.forEach((listener) => listener());
    };

    return {
        getSnapshot: () => snapshot,
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        setDraft: (draft: string) => update({ draft, error: "" }),
        submit: () => send(),
        clearQueue: () => clearQueue(),
        connect(
            engine: ReadlineEngine,
            projectUid: string,
            echo: (text: string) => void
        ) {
            disconnect();
            let disposed = false;
            let sending = false;
            let queue: string[] = [];
            const submitLine = engine.readlineSubmit.bind(engine);

            const pump = async (): Promise<void> => {
                const request = snapshot.request;
                if (disposed || sending || !request || queue.length === 0)
                    return;
                const line = queue[0];
                sending = true;
                update({ submitting: true, queued: queue.length - 1 });
                try {
                    const result = await submitLine(request.requestId, line);
                    if (disposed) return;
                    if (result !== 0) throw new Error("Line rejected");
                    queue.shift();
                    echo(`${request.prompt}${line}\n`);
                    // A close or the next prompt can arrive before the promise resolves.
                    if (snapshot.request === request) update({ request: null });
                } catch {
                    if (disposed) return;
                    update({
                        draft: queue.join("\n"),
                        error: "Csound did not accept this line. Edit it and try again."
                    });
                    queue = [];
                } finally {
                    if (!disposed) {
                        sending = false;
                        update({ submitting: false, queued: queue.length });
                        void pump();
                    }
                }
            };

            const onReadline = ({ requestId, prompt }: ReadlineEvent) => {
                if (disposed) return;
                if (prompt === null) {
                    if (snapshot.request?.requestId === requestId)
                        update({ request: null });
                } else if (snapshot.request?.requestId !== requestId) {
                    update({ request: { requestId, prompt, projectUid } });
                    void pump();
                }
            };
            engine.on("readline", onReadline);
            send = () => {
                if (disposed || sending || queue.length || !snapshot.request)
                    return;
                queue = snapshot.draft.split(/\r\n|\r|\n/);
                update({ draft: "", error: "" });
                void pump();
            };
            clearQueue = () => {
                queue = sending ? queue.slice(0, 1) : [];
                update({ queued: 0 });
            };
            const dispose = () => {
                if (disposed) return;
                disposed = true;
                queue = [];
                engine.off("readline", onReadline);
                send = () => {};
                clearQueue = () => {};
                update(empty);
            };
            disconnect = dispose;
            return dispose;
        }
    };
}

export const consoleReadline = createReadlineConsole();
export const useReadlineRequest = () =>
    useSyncExternalStore(
        consoleReadline.subscribe,
        () => consoleReadline.getSnapshot().request
    );
