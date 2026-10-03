import { describe, expect, it, vi } from "vitest";
import { ManualBridge } from "./manual-bridge";

describe("manual lookup delivery", () => {
    it("waits for a document and retries an unacknowledged lookup after navigation", () => {
        const send = vi.fn();
        const bridge = new ManualBridge(send);
        bridge.lookup("oscili");
        expect(send).not.toHaveBeenCalled();
        bridge.receive({ type: "csound-manual:ready", documentId: "first" });
        const first = send.mock.calls.at(-1)?.[0];
        bridge.connect();
        bridge.receive({ type: "csound-manual:ready", documentId: "second" });
        expect(send).toHaveBeenLastCalledWith({
            ...first,
            documentId: "second"
        });
    });

    it("keeps a newer lookup when an older request starts navigation", () => {
        const send = vi.fn();
        const bridge = new ManualBridge(send);
        bridge.receive({ type: "csound-manual:ready", documentId: "first" });
        bridge.lookup("oscili");
        const first = send.mock.calls.at(-1)?.[0];
        bridge.lookup("ampmidicurve");
        const latest = send.mock.calls.at(-1)?.[0];
        bridge.receive({
            ...first,
            type: "csound-manual:accepted",
            navigating: true
        });
        expect(bridge.isReady).toBe(false);
        bridge.receive({ type: "csound-manual:ready", documentId: "second" });
        expect(send).toHaveBeenLastCalledWith({
            ...latest,
            documentId: "second"
        });
    });

    it("queues changes during navigation and sends only the latest request", () => {
        const send = vi.fn();
        const bridge = new ManualBridge(send);
        bridge.receive({ type: "csound-manual:ready", documentId: "first" });
        bridge.receive({
            type: "csound-manual:navigating",
            documentId: "first"
        });
        bridge.lookup("oscili");
        bridge.lookup("ampmidicurve");
        expect(send).not.toHaveBeenCalled();
        bridge.receive({ type: "csound-manual:ready", documentId: "second" });
        expect(send).toHaveBeenCalledOnce();
        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({ token: "ampmidicurve" })
        );
    });

    it("ignores old-document messages and clears only a matching acceptance", () => {
        const send = vi.fn();
        const bridge = new ManualBridge(send);
        bridge.lookup("oscili");
        bridge.receive({ type: "csound-manual:ready", documentId: "first" });
        const first = send.mock.calls.at(-1)?.[0];
        bridge.receive({ type: "csound-manual:ready", documentId: "second" });
        bridge.receive({
            ...first,
            type: "csound-manual:accepted",
            navigating: true
        });
        expect(bridge.isReady).toBe(true);
        bridge.receive({
            type: "csound-manual:navigating",
            documentId: "first"
        });
        expect(bridge.isReady).toBe(true);
        bridge.receive({
            ...first,
            documentId: "second",
            type: "csound-manual:accepted",
            navigating: true
        });
        expect(bridge.isReady).toBe(false);
        send.mockClear();
        bridge.receive({ type: "csound-manual:ready", documentId: "third" });
        expect(send).not.toHaveBeenCalled();
    });

    it("gives repeated lookups distinct IDs and ignores malformed readiness", () => {
        const send = vi.fn();
        const bridge = new ManualBridge(send);
        bridge.receive({ type: "csound-manual:ready" });
        expect(bridge.isReady).toBe(false);
        bridge.receive({ type: "csound-manual:ready", documentId: "page" });
        bridge.lookup("oscili");
        bridge.lookup("oscili");
        expect(send.mock.calls[0][0].requestId).not.toBe(
            send.mock.calls[1][0].requestId
        );
    });
});
