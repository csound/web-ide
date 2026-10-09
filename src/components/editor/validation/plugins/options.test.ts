import { expect, it } from "vitest";
import { requestedPlugins, pluginPath } from "./options";

it("reads quoted lists and repeated library options, ignoring comments and orchestra strings", () => {
    const source = `<!-- <CsOptions>--opcode-lib=hidden.wasm</CsOptions> -->
<CsOptions>
; --opcode-lib=comment.wasm
--opcode-lib="plugins/first voice.wasm,./second.wasm"
--opcode-lib third.wasm
// --opcode-lib=also-hidden.wasm
</CsOptions>
<CsInstruments>
S1 = "--opcode-lib=not-an-option.wasm"
</CsInstruments>`;
    expect(requestedPlugins(source)).toEqual([
        { path: "plugins/first voice.wasm", line: 4 },
        { path: "./second.wasm", line: 4 },
        { path: "third.wasm", line: 5 }
    ]);
    expect(
        requestedPlugins(
            "<CsInstruments>\nS1 = {{<CsOptions>--opcode-lib=no.wasm</CsOptions>}}"
        )
    ).toEqual([]);
    expect(requestedPlugins("<CsOptions>--opcode-lib=</CsOptions>")).toEqual([
        { path: "", line: 1 }
    ]);
});

it("matches project-root paths without allowing a path outside the project", () => {
    expect(pluginPath("/plugins/.././tb303.wasm")).toBe("tb303.wasm");
    expect(() => pluginPath("../../tb303.wasm")).toThrow();
    expect(() => pluginPath("")).toThrow();
});
