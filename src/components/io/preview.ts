import { audioContextClass, captureInput, routeOutput } from "./devices";
import type { IoSettings } from "./settings";

/** Tests own their devices. They never feed a microphone to the speakers. */
export async function previewInput(
    settings: IoSettings,
    signal: AbortSignal,
    meter: (level: number) => void
) {
    const Constructor = audioContextClass();
    if (!Constructor)
        throw new Error("Web Audio is unavailable in this browser.");
    const stream = await captureInput(settings, signal);
    let context: AudioContext;
    try {
        context = new Constructor();
    } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        throw error;
    }
    let frame = 0;
    const stop = () => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach((track) => track.stop());
        void context.close().catch(() => {});
        meter(0);
    };
    signal.addEventListener("abort", stop, { once: true });
    try {
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        if (settings.inputChannel) {
            const splitter = context.createChannelSplitter(
                Math.max(settings.inputChannel, source.channelCount)
            );
            source.connect(splitter);
            splitter.connect(analyser, settings.inputChannel - 1);
        } else source.connect(analyser);
        await context.resume();
        signal.throwIfAborted();
        const samples = new Float32Array(analyser.fftSize);
        const draw = () => {
            analyser.getFloatTimeDomainData(samples);
            let peak = 0;
            for (const sample of samples)
                peak = Math.max(peak, Math.abs(sample));
            // Map -60 to 0 dBFS onto the meter, without rendering React per frame.
            meter(
                Math.max(
                    0,
                    Math.min(1, (20 * Math.log10(peak || 0.000001) + 60) / 60)
                )
            );
            frame = requestAnimationFrame(draw);
        };
        draw();
    } catch (error) {
        stop();
        throw error;
    }
}

export async function previewOutput(settings: IoSettings, signal: AbortSignal) {
    const Constructor = audioContextClass();
    if (!Constructor)
        throw new Error("Web Audio is unavailable in this browser.");
    const context = new Constructor({
        latencyHint: settings.latency,
        ...(settings.sampleRate ? { sampleRate: settings.sampleRate } : {})
    });
    const stop = () => {
        void context.close().catch(() => {});
    };
    signal.addEventListener("abort", stop, { once: true });
    try {
        signal.throwIfAborted();
        await context.resume();
        await routeOutput(context, settings.outputDevice);
        signal.throwIfAborted();
        const tone = context.createOscillator();
        const gain = context.createGain();
        tone.frequency.value = 440;
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, context.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
        tone.connect(gain).connect(context.destination);
        await new Promise<void>((resolve) => {
            tone.onended = () => {
                signal.removeEventListener("abort", onAbort);
                resolve();
            };
            const onAbort = () => resolve();
            signal.addEventListener("abort", onAbort, { once: true });
            tone.start();
            tone.stop(context.currentTime + 0.55);
        });
    } finally {
        signal.removeEventListener("abort", stop);
        stop();
    }
}
