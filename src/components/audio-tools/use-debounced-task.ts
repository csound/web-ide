import { useEffect, useState } from "react";

export const PREVIEW_DELAY = 400;

/** Only publish the latest request; cancel both waiting timers and running workers. */
export function useDebouncedTask<Request, Value>(
    request: Request | undefined,
    execute: (
        request: Request,
        signal: AbortSignal,
        status: (text: string) => void
    ) => Promise<Value>
) {
    const [attempt, retry] = useState(0);
    const [state, setState] = useState<{
        request: Request;
        attempt: number;
        value?: Value;
        error?: string;
        status: string;
        done: boolean;
    }>();
    useEffect(() => {
        if (!request) {
            setState(undefined);
            return;
        }
        const controller = new AbortController();
        const status = (text: string) => {
            if (!controller.signal.aborted)
                setState({ request, attempt, status: text, done: false });
        };
        status("Waiting for changes…");
        const timer = setTimeout(async () => {
            status("Updating…");
            try {
                const value = await execute(request, controller.signal, status);
                if (!controller.signal.aborted)
                    setState({
                        request,
                        attempt,
                        value,
                        status: "",
                        done: true
                    });
            } catch (failure) {
                if (!controller.signal.aborted)
                    setState({
                        request,
                        attempt,
                        error:
                            failure instanceof Error
                                ? failure.message
                                : "Could not update this audio.",
                        status: "",
                        done: true
                    });
            }
        }, PREVIEW_DELAY);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [request, execute, attempt]);
    const current =
        state?.request === request && state?.attempt === attempt
            ? state
            : undefined;
    return {
        value: current?.value,
        error: current?.error,
        pending: Boolean(request && !current?.done),
        status: request ? current?.status || "Waiting for changes…" : "",
        retry: () => retry((value) => value + 1)
    };
}
