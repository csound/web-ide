export interface PluginRequest {
    path: string;
    line: number;
}

/** Read only opcode-library options. Never apply arbitrary CsOptions to the probe. */
export function requestedPlugins(source: string): PluginRequest[] {
    const visible = source.replace(/<!--[\s\S]*?-->/g, (comment) =>
        comment.replace(/[^\n]/g, " ")
    );
    const match = /<CsOptions\s*>([\s\S]*?)<\/CsOptions\s*>/i.exec(
        visible.split(/<CsInstruments\s*>/i)[0]
    );
    if (!match) return [];
    const body = match[1];
    const offset = match.index + match[0].indexOf(">") + 1;
    const tokens: { value: string; start: number }[] = [];
    for (let i = 0; i < body.length;) {
        if (/\s/.test(body[i])) {
            i++;
            continue;
        }
        if (body[i] === ";" || body.startsWith("//", i)) {
            const end = body.indexOf("\n", i);
            i = end < 0 ? body.length : end + 1;
            continue;
        }
        const start = i;
        let value = "";
        let quote = "";
        for (; i < body.length; i++) {
            const char = body[i];
            if (quote) {
                if (char === quote) quote = "";
                else value += char;
            } else if (char === '"' || char === "'") quote = char;
            else if (/\s/.test(char) || char === ";") break;
            else value += char;
        }
        tokens.push({ value, start });
    }
    const requests: PluginRequest[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!/^--opcode-lib(?:=|$)/.test(token.value)) continue;
        const list =
            token.value === "--opcode-lib"
                ? (tokens[++i]?.value ?? "")
                : token.value.slice(13);
        const line = source.slice(0, offset + token.start).split("\n").length;
        for (const path of list.split(","))
            requests.push({ path: path.trim(), line });
    }
    return requests;
}

/** Match the WASI filesystem's project-root paths, including ./ and / prefixes. */
export function pluginPath(path: string): string {
    const parts: string[] = [];
    for (const part of path.split("/")) {
        if (!part || part === ".") continue;
        if (part === "..") {
            if (!parts.length)
                throw new Error("Plugin path is outside the project");
            parts.pop();
        } else parts.push(part);
    }
    if (!parts.length || path.includes("\0"))
        throw new Error("Missing plugin path");
    return parts.join("/");
}
