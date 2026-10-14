import type { CsoundObj } from "../csound/types";
import type { IoSettings } from "./settings";

export async function allNotesOff(engine: Pick<CsoundObj, "midiMessage">) {
    for (let channel = 0; channel < 16; channel++) {
        await engine.midiMessage(0xb0 + channel, 64, 0);
        await engine.midiMessage(0xb0 + channel, 123, 0);
        await engine.midiMessage(0xb0 + channel, 120, 0);
    }
}

/** Own listeners so hot-plugged controllers work and a stopped project keeps none. */
export function routeMidi(
    access: MIDIAccess,
    settings: IoSettings,
    engine: Pick<CsoundObj, "midiMessage">,
    report: (text: string) => void
) {
    const attached = new Map<MIDIInput, (event: MIDIMessageEvent) => void>();
    let disposed = false;
    const update = () => {
        const selected = new Set(
            [...access.inputs.values()].filter(
                (input) =>
                    input.state === "connected" &&
                    (settings.midiInputs === "all" ||
                        settings.midiInputs.includes(input.id))
            )
        );
        for (const [input, listener] of attached)
            if (!selected.has(input)) {
                input.removeEventListener("midimessage", listener);
                attached.delete(input);
                void input.close().catch(() => {});
                if (!disposed) void allNotesOff(engine).catch(() => {});
            }
        for (const input of selected)
            if (!attached.has(input)) {
                const listener = (event: MIDIMessageEvent) => {
                    const data = event.data;
                    if (disposed || !data?.length || data[0] < 0x80) return;
                    if (
                        settings.midiChannel &&
                        data[0] < 0xf0 &&
                        (data[0] & 15) !== settings.midiChannel - 1
                    )
                        return;
                    void engine
                        .midiMessage(data[0], data[1] || 0, data[2] || 0)
                        .catch(() => report("Could not send a MIDI message."));
                };
                attached.set(input, listener);
                input.addEventListener("midimessage", listener);
                void input
                    .open()
                    .then(() => {
                        if (disposed || !attached.has(input))
                            return input.close();
                    })
                    .catch(
                        () =>
                            !disposed &&
                            report(
                                `Could not open MIDI input ${input.name || "controller"}.`
                            )
                    );
            }
    };
    access.addEventListener("statechange", update);
    update();
    return () => {
        disposed = true;
        access.removeEventListener("statechange", update);
        for (const [input, listener] of attached) {
            input.removeEventListener("midimessage", listener);
            void input.close().catch(() => {});
        }
        attached.clear();
    };
}
