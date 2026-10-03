import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
execFileSync(
    process.execPath,
    [path.join(root, "scripts/prepare-manual.mjs")],
    { stdio: "inherit" }
);
const manual = path.join(root, "public/manual");
/** List local assets recursively for link and fragment checks. */
const walk = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
            ? walk(path.join(directory, entry.name))
            : [path.join(directory, entry.name)]
    );
/** Decode the entities emitted in this renderer's HTML attributes. */
const decode = (value) =>
    value.replace(
        /&(?:amp|quot|lt|gt|#\d+|#x[\da-f]+);/gi,
        (entity) =>
            ({ "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">" })[
                entity
            ] ??
            String.fromCodePoint(
                Number(
                    entity.startsWith("&#x")
                        ? "0x" + entity.slice(3, -1)
                        : entity.slice(2, -1)
                )
            )
    );
const pages = new Map(
    walk(manual)
        .filter((file) => file.endsWith(".html"))
        .map((file) => {
            const html = readFileSync(file, "utf8");
            return [
                file,
                {
                    html,
                    ids: new Set(
                        [...html.matchAll(/\bid="([^"]*)"/g)].map((match) =>
                            decode(match[1])
                        )
                    )
                }
            ];
        })
);
let links = 0;
const errors = [];
for (const [file, { html }] of pages) {
    for (const match of html.matchAll(
        /<(a|link|script|img|source|iframe)\b[^>]*?\b(?:href|src)="([^"]*)"/g
    )) {
        const url = new URL(
            decode(match[2]),
            "https://manual.test/manual/" + path.relative(manual, file)
        );
        if (url.origin !== "https://manual.test") {
            if (match[1] !== "a")
                errors.push(`${file}: external runtime asset ${url.href}`);
            continue;
        }
        if (!url.pathname.startsWith("/manual/")) continue;
        let target = path.join(
            manual,
            decodeURIComponent(url.pathname.slice("/manual/".length))
        );
        if (existsSync(target) && statSync(target).isDirectory())
            target = path.join(target, "index.html");
        if (!existsSync(target))
            errors.push(`${path.relative(manual, file)}: missing ${match[2]}`);
        else if (
            url.hash &&
            pages.has(target) &&
            !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))
        )
            errors.push(
                `${path.relative(manual, file)}: missing fragment ${match[2]}`
            );
        links++;
    }
    assert.ok(
        !html.includes("/src/index.tsx") &&
            !html.includes("firestore.googleapis.com"),
        `${file} loads the IDE`
    );
}
assert.deepEqual(errors, []);
assert.ok(
    pages.has(path.join(manual, "404.html")),
    "Missing manual fallback page"
);
const index = JSON.parse(
    readFileSync(path.join(manual, "search-index.json"), "utf8")
);
const build = JSON.parse(
    readFileSync(path.join(root, "public/manual/.build.json"), "utf8")
);
assert.equal(index.length, build.pages);
assert.ok(
    index.every((entry) => !/^\*\*.+\*\*$/.test(entry.title)),
    "Search titles still contain Markdown emphasis"
);
const home = pages.get(path.join(manual, "index.html")).html;
const opcodeLinks = [...home.matchAll(/<a href="opcodes\/([^"/]+)\/">/g)].map(
    (match) => match[1]
);
const sourceOpcodes = readdirSync(path.join(root, "csound-manual/docs/opcodes"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -3));
assert.deepEqual(
    [...opcodeLinks].sort(),
    sourceOpcodes.sort(),
    "The home page must list each opcode once"
);
for (const [index, name] of opcodeLinks.entries()) {
    const pagePath = path.join(manual, "opcodes", name, "index.html");
    const { html } = pages.get(pagePath);
    for (const [rel, offset] of [
        ["prev", -1],
        ["next", 1]
    ]) {
        const href = html.match(new RegExp(`rel="${rel}" href="([^"]+)"`))?.[1];
        const neighbor = opcodeLinks[index + offset];
        assert.equal(
            href
                ? new URL(
                      decode(href),
                      `https://manual.test/manual/opcodes/${name}/`
                  ).pathname
                : undefined,
            neighbor ? `/manual/opcodes/${neighbor}/` : undefined,
            `${name}: ${rel} must follow the opcode index`
        );
    }
}
for (const [, group] of home.matchAll(
    /<div class="opcode-list">([\s\S]*?)<\/div>/g
)) {
    const names = [...group.matchAll(/<code>([^<]*)<\/code>/g)].map((match) =>
        decode(match[1]).toLowerCase()
    );
    assert.deepEqual(
        names,
        [...names].sort(),
        "Opcode groups must stay alphabetical"
    );
}
for (const entry of index)
    assert.ok(pages.has(path.join(manual, entry.url, "index.html")), entry.url);
const lookup = JSON.parse(
    readFileSync(path.join(manual, "lookup.json"), "utf8")
);
assert.equal(lookup.oscili, "opcodes/oscili/");
assert.equal(lookup.Zerodbfs, "opcodes/0dbfs/");
assert.equal(lookup.GEN01, "scoregens/gen01/");
for (const url of Object.values(lookup))
    assert.ok(pages.has(path.join(manual, url, "index.html")), url);
for (const id of JSON.parse(
    readFileSync(path.join(root, "manual/legacy-ids.json"), "utf8")
)) {
    if (/^[A-Za-z0-9_-]+$/.test(id))
        assert.ok(
            pages.has(path.join(manual, id, "index.html")),
            `Missing old URL: ${id}`
        );
}
const oscillator = readFileSync(
    path.join(manual, "opcodes/oscili/index.html"),
    "utf8"
);
assert.ok(oscillator.includes("Modern") && oscillator.includes("Classic"));
assert.ok(!oscillator.includes("--8&lt;--"), "Unexpanded example snippet");
assert.ok(oscillator.includes("0dbfs"), "Missing included example");
assert.match(
    readFileSync(path.join(manual, "examples/oscili.csd"), "utf8"),
    /0dbfs\s*=\s*1/
);
const themeScript = readFileSync(path.join(manual, "assets/manual.js"), "utf8");
assert.ok(
    themeScript.includes("event.origin !== location.origin") &&
        themeScript.includes("event.source !== parent")
);
console.log(
    `Checked ${index.length} manual entries, ${pages.size} HTML pages, and ${links} local links. No missing files, fragments, or external runtime assets.`
);
