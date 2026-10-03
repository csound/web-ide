import { describe, expect, it, vi } from "vitest";
import { observeAudio } from "./audio";

function fixture() {
    const analyser = { disconnect: vi.fn() };
    const node = {
        context: { createAnalyser: vi.fn(() => analyser) },
        connect: vi.fn(),
        disconnect: vi.fn()
    };
    const csound = {
        getNode: vi.fn(async () => node),
        on: vi.fn(),
        off: vi.fn()
    };
    const ready = vi.fn();
    const failed = vi.fn();
    return { analyser, node, csound, ready, failed };
}

describe("analyzer audio connection", () => {
    it("disconnects only its own analyzer, leaving playback connected", async () => {
        const { analyser, node, csound, ready, failed } = fixture();
        const dispose = observeAudio(csound as any, ready, failed);
        await vi.waitFor(() => expect(ready).toHaveBeenCalledWith(analyser));
        expect(analyser).toMatchObject({
            fftSize: 8192,
            smoothingTimeConstant: 0
        });
        dispose();
        expect(node.disconnect).toHaveBeenCalledExactlyOnceWith(analyser);
        expect(csound.off).toHaveBeenCalledWith(
            "realtimePerformanceStarted",
            csound.on.mock.calls[0][1]
        );
        expect(failed).not.toHaveBeenCalled();
    });

    it("does not connect an audio node that arrives after unmount", async () => {
        const { node, csound, ready, failed } = fixture();
        let resolve!: (node: any) => void;
        csound.getNode.mockReturnValue(
            new Promise((done) => {
                resolve = done;
            })
        );
        const dispose = observeAudio(csound as any, ready, failed);
        dispose();
        resolve(node);
        await Promise.resolve();
        expect(node.connect).not.toHaveBeenCalled();
        expect(ready).not.toHaveBeenCalled();
    });

    it("waits for the start event if the single-thread node is not ready yet", async () => {
        const { node, csound, ready, failed } = fixture();
        csound.getNode.mockResolvedValueOnce(undefined as any);
        const dispose = observeAudio(csound as any, ready, failed);
        await Promise.resolve();
        expect(ready).not.toHaveBeenCalled();
        await csound.on.mock.calls[0][1]();
        expect(node.connect).toHaveBeenCalledOnce();
        await csound.on.mock.calls[0][1]();
        expect(node.connect).toHaveBeenCalledOnce();
        dispose();
    });
});
