import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "@root/store";
import { useConsole, useSetConsole } from "@comp/console/context";
import { createEditorApi } from "./editor-api";
import { createTools } from "./tools";
import { pageModelContext, registerTools } from "./registration";

type Status = {
    state: "unsupported" | "idle" | "registering" | "ready" | "error";
    count: number;
};
const StatusContext = createContext<Status>({ state: "unsupported", count: 0 });

export function WebMcpProvider({ children }: { children: React.ReactNode }) {
    const projectUid = useSelector(
        (state) => state.ProjectsReducer.activeProjectUid
    );
    const logs = useConsole();
    const logsRef = useRef(logs);
    logsRef.current = logs;
    const setConsole = useSetConsole();
    const [status, setStatus] = useState<Status>({
        state: "unsupported",
        count: 0
    });
    // Complete old registration/cleanup before registering the next project,
    // including React StrictMode's mount -> cleanup -> mount cycle.
    const pending = useRef(Promise.resolve());
    useEffect(() => {
        const controller = new AbortController();
        const context = pageModelContext();
        setStatus({
            state: context
                ? projectUid
                    ? "registering"
                    : "idle"
                : "unsupported",
            count: 0
        });
        pending.current = pending.current.then(async () => {
            if (!context || !projectUid || controller.signal.aborted) return;
            try {
                const tools = createTools(
                    createEditorApi(
                        projectUid,
                        () => logsRef.current,
                        setConsole,
                        controller.signal
                    )
                );
                const count = await registerTools(
                    tools,
                    controller.signal,
                    context
                );
                if (!controller.signal.aborted)
                    setStatus({
                        state: count ? "ready" : "unsupported",
                        count
                    });
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.warn("WebMCP registration failed", error);
                    setStatus({ state: "error", count: 0 });
                }
            }
        });
        return () => controller.abort();
    }, [projectUid, setConsole]);
    return (
        <StatusContext.Provider value={status}>
            {children}
        </StatusContext.Provider>
    );
}

export function WebMcpLink() {
    const status = useContext(StatusContext);
    const label =
        status.state === "ready"
            ? "WebMCP ready"
            : status.state === "error"
              ? "WebMCP unavailable"
              : "WebMCP supported";
    const title =
        status.state === "ready"
            ? `${status.count} agent tools ready. Open the setup and tool guide.`
            : "Open the WebMCP setup and tool guide.";
    return (
        <a
            href="/documentation#webmcp"
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            data-testid="webmcp-status"
            css={(theme) => ({
                fontSize: 12,
                color: theme.headerTextColor,
                whiteSpace: "nowrap",
                margin: "0 8px",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                "@media (max-width: 600px)": {
                    fontSize: 10,
                    maxWidth: 62,
                    whiteSpace: "normal"
                }
            })}
        >
            {label}
        </a>
    );
}
