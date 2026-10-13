import navigation from "../../../docs/guide/navigation.json";

export const sections = navigation;
export const articles = sections.flatMap((section) =>
    section.articles.map((article) => ({ ...article, section: section.title }))
);
export type Article = (typeof articles)[number];
export const articlePath = (slug: string) => `/documentation/${slug}`;
const sources = import.meta.glob<string>(
    ["../../../docs/guide/**/*.md", "!../../../docs/guide/README.md"],
    { query: "?raw", import: "default" }
);
export function loadArticle(slug: string): Promise<string> {
    const load = sources[`../../../docs/guide/${slug}.md`];
    return load ? load() : Promise.reject(new Error("Article not found"));
}
export function headingId(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-");
}
/** Articles use plain ATX headings. Ignore examples, including nested fences. */
export function articleHeadings(markdown: string) {
    const headings: {
        id: string;
        text: string;
        level: number;
        line: number;
    }[] = [];
    const used = new Set<string>();
    let fence = "";
    for (const [index, line] of markdown.split("\n").entries()) {
        const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
        if (fence) {
            if (
                marker?.[0] === fence[0] &&
                marker.length >= fence.length &&
                /^\s{0,3}(?:`+|~+)\s*$/.test(line)
            )
                fence = "";
            continue;
        }
        if (marker) {
            fence = marker;
            continue;
        }
        const match = /^(#{2,3})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
        if (!match) continue;
        const text = match[2],
            base = headingId(text);
        let id = base,
            suffix = 1;
        while (used.has(id)) id = `${base}-${suffix++}`;
        used.add(id);
        headings.push({ id, text, level: match[1].length, line: index + 1 });
    }
    return headings;
}
/** Keep relative .md links useful both on GitHub and in the reader. */
export function articleHref(
    href: string | undefined,
    slug: string
): string | undefined {
    if (!href || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)) return href;
    const url = new URL(href, `https://guide.local/${slug}.md`);
    if (!url.pathname.endsWith(".md")) return href;
    return `${articlePath(url.pathname.slice(1, -3))}${url.search}${url.hash}`;
}
export function findArticles(query: string) {
    const words = query.toLowerCase().trim().split(/\s+/);
    return articles.filter((article) => {
        const text =
            `${article.title} ${article.description} ${article.section} ${article.slug}`.toLowerCase();
        return words.every((word) => text.includes(word));
    });
}
