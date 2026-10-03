import { describe, expect, it, vi } from "vitest";
import { createReadlineConsole, type ReadlineEvent } from "./readline";

function setup() {
    const console = createReadlineConsole();
    const listeners = new Set<(event: ReadlineEvent) => void>();
    const engine = {
        on: vi.fn((_name, listener) => listeners.add(listener)),
        off: vi.fn((_name, listener) => listeners.delete(listener)),
        readlineSubmit: vi.fn(async (_id: number, _text: string) => 0)
    };
    const echo = vi.fn();
    const disconnect = console.connect(engine, "fixture", echo);
    const emit = (requestId: number, prompt: string | null = "> ") => {
        listeners.forEach((listener) => listener({ requestId, prompt }));
    };
    return { console, engine, echo, emit, disconnect };
}

describe("console readline", () => {
    it("waits for a real request, including an empty prompt and response", async () => {
        const { console, engine, emit } = setup();
        console.submit();
        expect(engine.readlineSubmit).not.toHaveBeenCalled();
        emit(1, "");
        expect(console.getSnapshot().request?.prompt).toBe("");
        console.submit();
        await vi.waitFor(() =>
            expect(engine.readlineSubmit).toHaveBeenCalledWith(1, "")
        );
        expect(console.getSnapshot().request).toBeNull();
    });

    it("sends multiline input in order, preserving spaces, Unicode and blank lines", async () => {
        const { console, engine, emit, echo } = setup();
        emit(1, "名前> ");
        console.setDraft("  héllo\r\n\rworld\n");
        console.submit();
        await vi.waitFor(() =>
            expect(console.getSnapshot().submitting).toBe(false)
        );
        expect(engine.readlineSubmit.mock.calls).toEqual([[1, "  héllo"]]);
        expect(console.getSnapshot().queued).toBe(3);
        for (const id of [2, 3, 4]) {
            emit(id);
            await vi.waitFor(() =>
                expect(console.getSnapshot().submitting).toBe(false)
            );
        }
        expect(engine.readlineSubmit.mock.calls).toEqual([
            [1, "  héllo"],
            [2, ""],
            [3, "world"],
            [4, ""]
        ]);
        expect(echo.mock.calls.flat()).toEqual([
            "名前>   héllo\n",
            "> \n",
            "> world\n",
            "> \n"
        ]);
    });

    it("handles the next prompt arriving before submission resolves and ignores stale closes", async () => {
        const { console, engine, emit } = setup();
        let finish!: (result: number) => void;
        engine.readlineSubmit.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        emit(1);
        console.setDraft("first\nsecond");
        console.submit();
        console.submit();
        emit(1, null);
        emit(2);
        emit(1, null);
        expect(console.getSnapshot().request?.requestId).toBe(2);
        expect(engine.readlineSubmit).toHaveBeenCalledTimes(1);
        finish(0);
        await vi.waitFor(() =>
            expect(engine.readlineSubmit.mock.calls).toEqual([
                [1, "first"],
                [2, "second"]
            ])
        );
    });

    it("keeps rejected input for editing and does not send later lines", async () => {
        const { console, engine, emit } = setup();
        engine.readlineSubmit.mockResolvedValueOnce(-1);
        emit(1);
        console.setDraft("first\nsecond");
        console.submit();
        await vi.waitFor(() =>
            expect(console.getSnapshot().error).not.toBe("")
        );
        expect(console.getSnapshot().draft).toBe("first\nsecond");
        expect(console.getSnapshot().queued).toBe(0);
        expect(engine.readlineSubmit).toHaveBeenCalledTimes(1);
        console.setDraft("corrected");
        console.submit();
        await vi.waitFor(() =>
            expect(engine.readlineSubmit).toHaveBeenLastCalledWith(
                1,
                "corrected"
            )
        );
    });

    it("clears queued lines without cancelling a line already sent", async () => {
        const { console, engine, emit } = setup();
        let finish!: (result: number) => void;
        engine.readlineSubmit.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        emit(1);
        console.setDraft("first\nsecond");
        console.submit();
        console.clearQueue();
        emit(2);
        finish(0);
        await vi.waitFor(() =>
            expect(console.getSnapshot().submitting).toBe(false)
        );
        expect(engine.readlineSubmit).toHaveBeenCalledTimes(1);
        expect(console.getSnapshot().request?.requestId).toBe(2);
        expect(console.getSnapshot().queued).toBe(0);
    });

    it("discards pending input on stop and ignores old events and promises after restart", async () => {
        const { console, engine, emit, disconnect, echo } = setup();
        let finish!: (result: number) => void;
        engine.readlineSubmit.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    finish = resolve;
                })
        );
        const oldListener = engine.on.mock.calls[0][1];
        emit(1);
        console.setDraft("first\nsecond");
        console.submit();
        disconnect();
        expect(console.getSnapshot()).toMatchObject({
            request: null,
            queued: 0,
            draft: "",
            submitting: false
        });
        console.connect(engine, "next-project", echo);
        emit(1, "New prompt");
        oldListener({ requestId: 1, prompt: null });
        disconnect();
        finish(0);
        await Promise.resolve();
        expect(console.getSnapshot().request).toEqual({
            requestId: 1,
            prompt: "New prompt",
            projectUid: "next-project"
        });
        expect(engine.readlineSubmit).toHaveBeenCalledTimes(1);
        expect(echo).not.toHaveBeenCalled();
    });

    it("leaves older Csound packages usable without the optional API", () => {
        const console = createReadlineConsole();
        const engine = { on: vi.fn(), off: vi.fn() };
        const disconnect = console.connect(engine, "fixture", vi.fn());
        expect(engine.on).not.toHaveBeenCalled();
        disconnect();
    });
});
