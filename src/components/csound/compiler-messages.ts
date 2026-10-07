export async function waitForCompilerMessages(
    messageCount: () => number,
    signal: AbortSignal
): Promise<void> {
    // Compiler replies and diagnostics use different worker ports. After a
    // failed compile, let pending logs arrive before termination drops them.
    const deadline = Date.now() + 250;
    let previous = messageCount();
    while (!signal.aborted && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        const current = messageCount();
        if (current === previous) return;
        previous = current;
    }
}
