export async function waitForCompilerMessages(
    messageCount: () => number,
    signal: AbortSignal
): Promise<void> {
    // Compiler replies and diagnostics use different worker ports. After a
    // failed compile, let pending logs arrive before termination drops them.
    // A quiet interval only counts after a new message has arrived.
    const deadline = Date.now() + 250;
    const initial = messageCount();
    let previous = initial;
    while (!signal.aborted) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) return;
        await new Promise((resolve) =>
            setTimeout(resolve, Math.min(20, remaining))
        );
        const current = messageCount();
        if (current > initial && current === previous) return;
        previous = current;
    }
}
