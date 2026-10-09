import { afterEach, expect, it, vi } from "vitest";
import { beginPlaybackAudioSession } from "./audio-session";

afterEach(() => vi.unstubAllGlobals());

function device(userAgent = "iPhone", maxTouchPoints = 5) {
    const session = { type: "auto" };
    vi.stubGlobal("navigator", {
        userAgent,
        maxTouchPoints,
        audioSession: session
    });
    return session;
}

it.each(["iPhone", "iPad", "iPod", "Macintosh"])(
    "requests media playback on %s and restores the previous session",
    (userAgent) => {
        const session = device(userAgent);
        const playback = beginPlaybackAudioSession();
        expect(session.type).toBe("playback");
        playback?.release();
        expect(session.type).toBe("auto");
    }
);

it.each(["Android", "Windows NT", "Macintosh"])(
    "leaves %s audio policy alone",
    (userAgent) => {
        const session = device(userAgent, 0);
        expect(beginPlaybackAudioSession()).toBeUndefined();
        expect(session.type).toBe("auto");
    }
);

it("supports playback when Audio Session is absent", () => {
    vi.stubGlobal("navigator", { userAgent: "iPhone" });
    expect(beginPlaybackAudioSession()).toBeUndefined();
});

it("does not break playback when the browser rejects session changes", () => {
    const session = device();
    Object.defineProperty(session, "type", {
        get: () => "auto",
        set: () => {
            throw new DOMException("Unavailable", "NotAllowedError");
        }
    });
    expect(beginPlaybackAudioSession()).toBeUndefined();
});

it("allows a restricted embed to ignore session changes", () => {
    const session = device();
    Object.defineProperty(session, "type", {
        get: () => "auto",
        set: () => {}
    });
    const playback = beginPlaybackAudioSession();
    expect(() => playback?.enableInput()).not.toThrow();
    expect(() => playback?.release()).not.toThrow();
    expect(session.type).toBe("auto");
});

it("keeps an existing recording session", () => {
    const session = device();
    session.type = "play-and-record";
    const playback = beginPlaybackAudioSession();
    expect(session.type).toBe("play-and-record");
    playback?.release();
    expect(session.type).toBe("play-and-record");
});

it("permits live input and restores the prior category", () => {
    const session = device();
    session.type = "ambient";
    const playback = beginPlaybackAudioSession();
    playback?.enableInput();
    expect(session.type).toBe("play-and-record");
    playback?.release();
    expect(session.type).toBe("ambient");
});

it("does not undo another audio user's session change", () => {
    const session = device();
    const playback = beginPlaybackAudioSession();
    session.type = "transient";
    playback?.release();
    expect(session.type).toBe("transient");
});

it("still releases playback when switching to microphone mode fails", () => {
    const session = device();
    let type = "auto";
    Object.defineProperty(session, "type", {
        get: () => type,
        set: (next: string) => {
            if (next === "play-and-record") throw new Error("Unavailable");
            type = next;
        }
    });
    const playback = beginPlaybackAudioSession();
    expect(() => playback?.enableInput()).not.toThrow();
    playback?.release();
    expect(type).toBe("auto");
});
