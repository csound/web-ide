import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { RootState } from "@root/store";
import DisabledByDefaultRoundedIcon from "@mui/icons-material/DisabledByDefaultRounded";
import { windowHeader as windowHeaderStyle } from "@styles/_common";
import { manualColors } from "@styles/manual-theme";
import Tooltip from "@mui/material/Tooltip";
import { setManualPanelOpen } from "./actions";
import { IProjectEditorReducer } from "./reducer";
import { ManualBridge } from "./manual-bridge";
import * as SS from "./styles";
import { loadManualExample } from "./manual-examples";
import { openTemporaryDocument } from "./temporary-documents";

/** Host the static manual and share the editor's theme and lookup requests. */
const ManualWindow = ({
    projectUid,
    isDragging = false,
    showHeader = true
}: {
    projectUid: string;
    isDragging?: boolean;
    showHeader?: boolean;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const frame = useRef<HTMLIFrameElement>(null);
    const [bridge] = useState(
        () =>
            new ManualBridge((message) =>
                frame.current?.contentWindow?.postMessage(
                    message,
                    window.location.origin
                )
            )
    );

    const manualLookupString = useSelector(
        (store: RootState) =>
            (store.ProjectEditorReducer as IProjectEditorReducer)
                .manualLookupString
    );
    const manualLookupVersion = useSelector(
        (store: RootState) => store.ProjectEditorReducer.manualLookupVersion
    );

    useEffect(() => {
        /** Apply the current palette after each document's ready handshake. */
        const sendTheme = () =>
            frame.current?.contentWindow?.postMessage(
                {
                    type: "csound-manual:theme",
                    mode: theme.mode,
                    colors: manualColors(theme)
                },
                window.location.origin
            );
        /** Ignore messages from other origins and other frames. */
        const onMessage = (event: MessageEvent) => {
            if (
                event.origin !== window.location.origin ||
                event.source !== frame.current?.contentWindow
            )
                return;
            if (bridge.receive(event.data)) sendTheme();
        };
        window.addEventListener("message", onMessage);
        if (bridge.isReady) sendTheme();
        return () => window.removeEventListener("message", onMessage);
    }, [theme, bridge]);

    useEffect(() => {
        bridge.lookup(manualLookupString);
    }, [manualLookupString, manualLookupVersion, bridge]);

    useEffect(() => {
        const controller = new AbortController();
        const onMessage = async (event: MessageEvent) => {
            const sender = frame.current?.contentWindow;
            const data = event.data;
            if (
                event.origin !== window.location.origin ||
                event.source !== sender ||
                data?.type !== "csound-manual:open-example" ||
                !bridge.isCurrentDocument(data.documentId) ||
                !Number.isSafeInteger(data.requestId)
            )
                return;
            let error: string | undefined;
            try {
                const document = await loadManualExample(
                    data.url,
                    data.assets,
                    controller.signal
                );
                if (
                    controller.signal.aborted ||
                    !bridge.isCurrentDocument(data.documentId)
                )
                    return;
                dispatch(openTemporaryDocument(document));
            } catch (cause) {
                if (controller.signal.aborted) return;
                error =
                    cause instanceof Error
                        ? cause.message
                        : "Could not open the example.";
            }
            sender?.postMessage(
                {
                    type: "csound-manual:example-opened",
                    documentId: data.documentId,
                    requestId: data.requestId,
                    error
                },
                window.location.origin
            );
        };
        window.addEventListener("message", onMessage);
        return () => {
            controller.abort();
            window.removeEventListener("message", onMessage);
        };
    }, [bridge, dispatch, projectUid]);

    useEffect(() => {
        sessionStorage.setItem(projectUid + ":manualVisible", "true");
        return () =>
            sessionStorage.setItem(projectUid + ":manualVisible", `false`);
    }, [projectUid]);

    useEffect(() => {
        const iframe = frame.current;
        if (!iframe || isDragging) return;
        // A non-passive listener fixes stalled iframe scrolling after resize.
        // Keep this no-op: the browser still handles scrolling and focus.
        const synchronizeWheel = () => undefined;
        let manualDocument: Document | null = null;
        const connect = () => {
            manualDocument?.removeEventListener(
                "wheel",
                synchronizeWheel,
                true
            );
            manualDocument = iframe.contentDocument;
            manualDocument?.addEventListener("wheel", synchronizeWheel, {
                capture: true,
                passive: false
            });
        };
        connect();
        iframe.addEventListener("load", connect);
        return () => {
            manualDocument?.removeEventListener(
                "wheel",
                synchronizeWheel,
                true
            );
            iframe.removeEventListener("load", connect);
        };
    }, [isDragging]);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                pointerEvents: isDragging ? "none" : "auto"
            }}
        >
            {showHeader && (
                <div css={windowHeaderStyle}>
                    <p>
                        Csound Manual
                        <span css={SS.headIconsContainer}>
                            <Tooltip title="close window">
                                <span
                                    onClick={() =>
                                        dispatch(setManualPanelOpen(false))
                                    }
                                >
                                    <DisabledByDefaultRoundedIcon
                                        style={{
                                            fill: theme.highlightBackgroundAlt
                                        }}
                                    />
                                </span>
                            </Tooltip>
                        </span>
                    </p>
                </div>
            )}
            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    width: "100%",
                    height: showHeader ? "calc(100% - 35px)" : "100%"
                }}
            >
                <iframe
                    ref={frame}
                    onLoad={() => bridge.connect()}
                    src="/manual/"
                    title="Csound reference manual"
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: "block" }}
                />
            </div>
        </div>
    );
};

export default ManualWindow;
