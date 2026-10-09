// The published inline-WASM decoder calls window.atob even in libcsound mode.
// Supply that small browser shim only inside this disposable worker.
Object.defineProperty(globalThis, "window", {
    value: { atob: atob.bind(globalThis), btoa: btoa.bind(globalThis) }
});
declare const __CSOUND_PLUGIN_TYPES_URL__: string;

self.onmessage = async ({ data }: MessageEvent<Uint8Array[]>) => {
    try {
        const { inspectPlugins } = await import("./inspect");
        let reader: Uint8Array | undefined;
        if (
            typeof __CSOUND_PLUGIN_TYPES_URL__ === "string" &&
            __CSOUND_PLUGIN_TYPES_URL__
        ) {
            const response = await fetch(__CSOUND_PLUGIN_TYPES_URL__);
            if (!response.ok) throw new Error("Could not load type reader");
            reader = new Uint8Array(await response.arrayBuffer());
        }
        self.postMessage({ metadata: await inspectPlugins(data, reader) });
    } catch {
        self.postMessage({ error: "Could not inspect opcode plugins" });
    }
};
