import { describe, expect, it } from "vitest";
import {
    articles,
    articleHeadings,
    articleHref,
    findArticles,
    loadArticle
} from "./content";

it("keeps the article tree complete and its internal links valid", async () => {
    const sources = import.meta.glob<string>("../../../docs/guide/**/*.md", {
        query: "?raw",
        import: "default",
        eager: true
    });
    const paths = Object.keys(sources)
        .filter((path) => !path.endsWith("/README.md"))
        .map((path) =>
            path.replace("../../../docs/guide/", "").replace(/\.md$/, "")
        );
    expect(new Set(articles.map((article) => article.slug)).size).toBe(
        articles.length
    );
    expect(articles.map((article) => article.slug).sort()).toEqual(
        paths.sort()
    );
    for (const article of articles) {
        const source = await loadArticle(article.slug);
        expect(source.split("\n")[0], article.slug).toBe(`# ${article.title}`);
        expect(source.split("\n")[2], article.slug).toBe(article.description);
        expect(articleHeadings(source).length, article.slug).toBeGreaterThan(0);
        // All authored article links must survive both GitHub and site navigation.
        for (const match of source.matchAll(/\]\(([^)]+\.md(?:#[^)]*)?)\)/g)) {
            const href = articleHref(match[1], article.slug)!;
            const [slug, hash] = href.replace("/documentation/", "").split("#");
            expect(paths, `${article.slug}: ${match[1]}`).toContain(slug);
            if (hash)
                expect(
                    articleHeadings(await loadArticle(slug)).map(
                        (heading) => heading.id
                    )
                ).toContain(hash);
        }
    }
});

it("ignores fenced example headings and gives duplicate sections distinct anchors", () => {
    const text =
        "## Setup\n````markdown\n## Example\n```\n## Still example\n````\n## Setup\n### Setup-1\n~~~\n## Hidden\n~~~\n## Café & sound";
    expect(articleHeadings(text)).toEqual([
        { id: "setup", text: "Setup", level: 2, line: 1 },
        { id: "setup-1", text: "Setup", level: 2, line: 7 },
        { id: "setup-1-1", text: "Setup-1", level: 3, line: 8 },
        { id: "café-sound", text: "Café & sound", level: 2, line: 12 }
    ]);
});

describe("article links", () => {
    it.each([
        ["../tools/mixer.md#export", "/documentation/tools/mixer#export"],
        ["filesystem.md", "/documentation/projects/filesystem"],
        ["#write-and-preview", "#write-and-preview"],
        ["https://example.org/guide.md", "https://example.org/guide.md"],
        ["/manual/", "/manual/"]
    ])("resolves %s", (href, expected) => {
        expect(articleHref(href, "projects/readme")).toBe(expected);
    });
});

it("finds articles by task words and returns no matches for unknown terms", () => {
    expect(
        findArticles("sample rate").map((article) => article.slug)
    ).toContain("tools/sample-editor");
    expect(findArticles("WEBMCP").map((article) => article.slug)).toEqual([
        "reference/webmcp"
    ]);
    expect(findArticles("nonsense-no-match")).toEqual([]);
});
