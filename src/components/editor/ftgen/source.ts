/** Static previews never execute orchestra code, macros or score preprocessors. */
export type TableDefinition = {
    name: string;
    kind: "orchestra" | "score";
    from: number;
    to: number;
    end: number;
    arguments: string[];
};
export type TableRequest = {
    sampleRate: number;
    tables: { fields: number[]; gen?: string }[];
};
export const MAX_SAMPLES = 262144;
const MAX_SOURCE = 1024 * 1024;

function maskComments(text: string): string {
    return text.replace(
        /\/\*[\s\S]*?(?:\*\/|$)|\{\{[\s\S]*?(?:\}\}|$)|"(?:\\.|[^"\\])*"|;[^\n]*|\/\/[^\n]*/g,
        (part) =>
            part.startsWith('"') && !part.includes("\n")
                ? part
                : part.replace(/[^\n]/g, " ")
    );
}

function regions(text: string, filename: string) {
    if (/\.sco$/i.test(filename))
        return [{ from: 0, text, kind: "score" as const }];
    if (!/\.csd$/i.test(filename))
        return /\.(?:orc|udo)$/i.test(filename)
            ? [{ from: 0, text, kind: "orchestra" as const }]
            : [];
    const found = [];
    for (const match of text.matchAll(
        /<Cs(Instruments|Score)\b([^>]*)>([\s\S]*?)(?:<\/Cs\1\s*>|$)/gi
    )) {
        if (match[1].toLowerCase() === "score" && /\bbin\s*=/i.test(match[2]))
            continue;
        found.push({
            from: match.index! + match[0].indexOf(">") + 1,
            text: match[3],
            kind:
                match[1].toLowerCase() === "score"
                    ? ("score" as const)
                    : ("orchestra" as const)
        });
    }
    return found;
}

/** Preserve offsets while joining continued statements. Strings remain opaque. */
export function findTables(text: string, filename: string): TableDefinition[] {
    if (text.length > MAX_SOURCE) return [];
    const result: TableDefinition[] = [];
    for (const region of regions(maskComments(text), filename)) {
        const statements: { 0: string; index: number }[] = [];
        let offset = 0,
            depth = 0;
        for (const line of region.text.split("\n")) {
            const previous = statements.at(-1);
            if (previous && (depth > 0 || /(?:,|\\)\s*$/.test(previous[0])))
                previous[0] += "\n" + line;
            else {
                statements.push({ 0: line, index: offset });
                depth = 0;
            }
            for (const char of line.replace(/"(?:\\.|[^"\\])*"/g, "")) {
                if (char === "(" || char === "[") depth++;
                if (char === ")" || char === "]") depth--;
            }
            offset += line.length + 1;
        }
        for (const statement of statements) {
            if (!statement[0].trim()) continue;
            const line = statement[0];
            const match =
                region.kind === "orchestra"
                    ? /^(\s*)(g?i\w*|[A-Za-z_]\w*(?=\s*:\s*i\b))(?:\s*:\s*i\b)?\s*(?:\bftgen\b\s*|=\s*ftgen(?:\s*:\s*i)?\s*\()([\s\S]*)/.exec(
                          line
                      )
                    : /^(\s*)(f\s*([+]?(?:\d+(?:\.\d*)?|\.\d+)))\s+([\s\S]*)/.exec(
                          line
                      );
            if (!match) continue;
            const from = region.from + statement.index! + match[1].length;
            let args: string[];
            if (region.kind === "orchestra") {
                let body = match[3].replace(/\\\s*\n/g, " ").trim();
                if (/=\s*ftgen/.test(line) && body.endsWith(")"))
                    body = body.slice(0, -1);
                args = splitArguments(body, true);
            } else
                args = [
                    match[3],
                    ...splitArguments(match[4].replace(/\\\s*\n/g, " "), false)
                ];
            result.push({
                name:
                    region.kind === "score" ? `f${Number(match[3])}` : match[2],
                kind: region.kind,
                from,
                to: from + match[2].length,
                end: region.from + statement.index! + line.length,
                arguments: args
            });
            if (result.length >= 512) return result;
        }
    }
    return result;
}

function splitArguments(text: string, commas: boolean): string[] {
    const fields: string[] = [];
    let start = 0,
        depth = 0,
        quoted = false;
    for (let i = 0; i <= text.length; i++) {
        const c = text[i];
        if (c === '"' && text[i - 1] !== "\\") quoted = !quoted;
        if (!quoted) {
            if (c === "(" || c === "[") depth++;
            if (c === ")" || c === "]") depth--;
            if (
                i === text.length ||
                (!depth && (commas ? c === "," : /\s/.test(c)))
            ) {
                const part = text.slice(start, i).trim();
                if (commas || part) fields.push(part);
                start = i + 1;
            }
        }
    }
    return fields;
}

/** Small arithmetic grammar; deliberately no eval, functions or runtime globals. */
export function numberExpression(
    text: string,
    symbols = new Map<string, number>(),
    score = false
): number {
    const tokens =
        text.match(
            /(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[A-Za-z_]\w*|[^\s]/gi
        ) ?? [];
    let at = 0;
    if (tokens.length > 128)
        throw new Error("Expression is too large to preview.");
    const atom = (): number => {
        const token = tokens[at++];
        if (token === "+") return score ? atom() : product();
        if (token === "-") return score ? -atom() : -product();
        if (token === "(" || token === "[") {
            const value = sum();
            if (tokens[at++] !== (token === "(" ? ")" : "]"))
                throw new Error("Finish the numeric expression to preview it.");
            return value;
        }
        if (symbols.has(token)) return symbols.get(token)!;
        if (
            !token ||
            !/^(?:\d|\.)/.test(token) ||
            !Number.isFinite(Number(token))
        )
            throw new Error(
                "Preview needs numeric parameters or constants defined above this table."
            );
        return Number(token);
    };
    const power = (): number => {
        let value = atom();
        while (tokens[at] === "^") {
            at++;
            value **= score ? power() : atom();
        }
        return value;
    };
    const product = (): number => {
        let value = power();
        while (["*", "/", "%"].includes(tokens[at])) {
            const op = tokens[at++],
                right = power();
            value =
                op === "*"
                    ? value * right
                    : op === "/"
                      ? value / right
                      : value % right;
        }
        return value;
    };
    const sum = (): number => {
        let value = product();
        while (["+", "-"].includes(tokens[at])) {
            const op = tokens[at++],
                right = product();
            value = op === "+" ? value + right : value - right;
        }
        return value;
    };
    // Score brackets use different precedence. Require grouping around mixed
    // powers rather than show a graph with different parameters from Csound.
    if (score) {
        const groups: string[][] = [[]];
        const check = (ops: string[]) => {
            if (ops.includes("^") && ops.some((op) => op !== "^"))
                throw new Error(
                    "Group score powers with parentheses before previewing mixed arithmetic."
                );
        };
        for (const token of tokens) {
            if (token === "(" || token === "[") groups.push([]);
            else if (token === ")" || token === "]") check(groups.pop() ?? []);
            else if (["+", "-", "*", "/", "%", "^"].includes(token))
                groups.at(-1)?.push(token);
        }
        groups.forEach(check);
    }
    const value = sum();
    if (
        at !== tokens.length ||
        !Number.isFinite(value) ||
        Math.abs(value) > 1e9
    )
        throw new Error("Finish the numeric expression to preview it.");
    return value;
}

/** Resolve only the selected table and its explicit source tables. */
export function tableRequest(
    text: string,
    filename: string,
    selected: TableDefinition
): TableRequest {
    const definitions = findTables(text, filename);
    const symbols = new Map<string, number>();
    let sampleRate = 48000;
    const constants = maskComments(text)
        .slice(0, selected.end)
        .matchAll(/^\s*(g?i\w*|sr)\s*(?:=|init\b)\s*([^\n]+)$/gm);
    const constantList = [...constants];
    const resolved = new Map<
        number,
        { fields: number[]; gen?: string; definition: TableDefinition }
    >();
    let auto = 100;
    let constantIndex = 0;
    for (const definition of definitions) {
        if (definition.from > selected.from) break;
        while (
            constantIndex < constantList.length &&
            constantList[constantIndex].index! < definition.from
        ) {
            const constant = constantList[constantIndex++];
            try {
                const value = numberExpression(constant[2], symbols);
                symbols.set(constant[1], value);
            } catch {
                symbols.delete(constant[1]);
            }
        }
        sampleRate = symbols.get("sr") ?? sampleRate;
        try {
            const named = /^"([a-z]+)"$/i.exec(definition.arguments[3] ?? "");
            const fields = definition.arguments.map((arg, i) =>
                i === 3 && named
                    ? 0
                    : numberExpression(
                          arg,
                          definition.kind === "score" ? new Map() : symbols,
                          definition.kind === "score"
                      )
            );
            if (fields.length < 5 || fields.length > 1024)
                throw new Error(
                    "Finish the GEN parameters to preview this table."
                );
            if (definition.kind === "score" && !fields[0])
                throw new Error(
                    "f0 sets the score duration; it does not create a table."
                );
            if (!fields[0]) {
                do {
                    auto++;
                } while (resolved.has(auto));
                fields[0] = auto;
            }
            if (definition.kind === "orchestra")
                symbols.set(definition.name, fields[0]);
            resolved.set(fields[0], {
                fields,
                ...(named ? { gen: named[1] } : {}),
                definition
            });
        } catch (error) {
            symbols.delete(definition.name);
            try {
                resolved.delete(
                    numberExpression(definition.arguments[0], symbols)
                );
            } catch {
                /* Unresolved table number. */
            }
            if (definition.from === selected.from) throw error;
        }
    }
    const target = [...resolved.values()].find(
        (item) => item.definition.from === selected.from
    );
    if (!target) throw new Error("This table cannot be previewed yet.");
    const tables: TableRequest["tables"] = [],
        visiting = new Set<number>(),
        added = new Set<number>();
    const add = (table: typeof target) => {
        const { fields, gen } = table;
        if (visiting.has(fields[0]))
            throw new Error("Table sources contain a cycle.");
        if (added.has(fields[0])) return;
        visiting.add(fields[0]);
        const routine = Math.abs(fields[3]);
        const refs = [4, 24, 30, 31, 33, 34, 40].includes(routine)
            ? [fields[4]]
            : routine === 18 || routine === 32
              ? fields.slice(4).filter((_, i) => i % 4 === 0)
              : routine === 52
                ? fields.slice(5).filter((_, i) => i % 3 === 0)
                : routine === 53
                  ? [fields[4], ...(fields[6] ? [fields[6]] : [])]
                  : [];
        for (const ref of refs) {
            const source = resolved.get(ref);
            if (!source || source.definition.from >= table.definition.from)
                throw new Error(
                    `Define source table ${ref} before this table to preview it.`
                );
            add(source);
        }
        if (tables.length >= 32)
            throw new Error("Preview supports at most 32 source tables.");
        tables.push({ fields, ...(gen ? { gen } : {}) });
        visiting.delete(fields[0]);
        added.add(fields[0]);
    };
    add(target);
    return { sampleRate, tables };
}

/** Link unique global table references; don't guess local instrument scopes. */
export function tableLinks(
    text: string,
    filename: string,
    definitions: TableDefinition[]
) {
    const links = definitions.map((definition) => ({
        from: definition.from,
        to: definition.to,
        definition
    }));
    if (text.length > MAX_SOURCE) return links;
    const names = new Map<string, TableDefinition | null>();
    for (const d of definitions)
        if (d.kind === "orchestra" && d.name.startsWith("gi"))
            names.set(d.name, names.has(d.name) ? null : d);
    for (const region of regions(
        maskComments(text).replace(/"(?:\\.|[^"\\])*"/g, (part) =>
            " ".repeat(part.length)
        ),
        filename
    )) {
        if (region.kind !== "orchestra") continue;
        for (const word of region.text.matchAll(/\bgi\w+\b/g)) {
            const definition = names.get(word[0]);
            const from = region.from + word.index!;
            if (definition && from > definition.end)
                links.push({ from, to: from + word[0].length, definition });
            if (links.length >= 4096) break;
        }
    }
    return links.sort((a, b) => a.from - b.from);
}
