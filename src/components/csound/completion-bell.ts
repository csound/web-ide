// Unlock on the Render click; browsers may reject a new context after a long render.
export function prepareCompletionBell(): {
    ring: () => void;
    close: () => void;
} {
    const context = new AudioContext();
    void context.resume().catch(() => {});
    const close = () => {
        void context.close().catch(() => {});
    };
    return {
        close,
        ring: () => {
            if (context.state !== "running") {
                close();
                return;
            }
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                context.currentTime + 0.7
            );
            oscillator.connect(gain).connect(context.destination);
            oscillator.onended = close;
            oscillator.start();
            oscillator.stop(context.currentTime + 0.75);
        }
    };
}
