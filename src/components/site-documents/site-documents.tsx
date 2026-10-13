import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { useTheme } from "@emotion/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import IconButton from "@mui/material/IconButton";
import SearchRounded from "@mui/icons-material/SearchRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { Header } from "../header/header";
import {
    articles,
    articleHeadings,
    articleHref,
    articlePath,
    findArticles,
    loadArticle,
    sections,
    type Article
} from "./content";
import { readerStyle } from "./styles";

function CodeBlock({ children }: { children?: ReactNode }) {
    const ref = useRef<HTMLPreElement>(null);
    const [status, setStatus] = useState("Copy code");
    useEffect(() => {
        if (status === "Copy code") return;
        const timer = window.setTimeout(() => setStatus("Copy code"), 2500);
        return () => window.clearTimeout(timer);
    }, [status]);
    return (
        <div className="doc-code">
            <pre ref={ref}>{children}</pre>
            <IconButton
                aria-label={status}
                title={status}
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(
                            ref.current?.textContent ?? ""
                        );
                        setStatus("Copied");
                    } catch {
                        setStatus("Copy failed. Select and copy the code.");
                    }
                }}
            >
                {status === "Copied" ? (
                    <CheckRounded fontSize="small" />
                ) : (
                    <ContentCopyRounded fontSize="small" />
                )}
            </IconButton>
            <span className="doc-sr-only" role="status">
                {status === "Copy code" ? "" : status}
            </span>
        </div>
    );
}
function ArticleBody({ article }: { article: Article }) {
    const [source, setSource] = useState<string>();
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const main = useRef<HTMLElement>(null);
    const { hash } = useLocation();
    useEffect(() => {
        let current = true;
        setFailed(false);
        void loadArticle(article.slug).then(
            (text) => {
                if (current) setSource(text);
            },
            () => {
                if (current) setFailed(true);
            }
        );
        return () => {
            current = false;
        };
    }, [article.slug, attempt]);
    useEffect(() => {
        const previous = document.title;
        document.title = `${article.title} | Csound Web-IDE Guide`;
        return () => {
            document.title = previous;
        };
    }, [article.title]);
    useEffect(() => {
        if (!source) return;
        let id = hash.slice(1);
        try {
            id = decodeURIComponent(id);
        } catch {
            /* A malformed fragment still opens the article. */
        }
        const target = id
            ? main.current?.querySelector<HTMLElement>(
                  `[id="${CSS.escape(id)}"]`
              )
            : main.current;
        (target ?? main.current)?.scrollIntoView({ block: "start" });
        if (!hash) main.current?.focus({ preventScroll: true });
    }, [source, hash]);
    const headings = articleHeadings(source ?? "");
    const components: Components = {
        p: ({ children, node }) => (
            <>
                <p>{children}</p>
                {node?.position?.start.line === 3 && headings.length > 0 && (
                    <details className="doc-inline-outline">
                        <summary>On this page</summary>
                        <nav aria-label="Article sections">
                            {headings.map((heading) => (
                                <a key={heading.id} href={`#${heading.id}`}>
                                    {heading.text}
                                </a>
                            ))}
                        </nav>
                    </details>
                )}
            </>
        ),
        h2: ({ children, node }) => (
            <h2
                id={
                    headings.find((h) => h.line === node?.position?.start.line)
                        ?.id
                }
            >
                {children}
            </h2>
        ),
        h3: ({ children, node }) => (
            <h3
                id={
                    headings.find((h) => h.line === node?.position?.start.line)
                        ?.id
                }
            >
                {children}
            </h3>
        ),
        a: ({ children, href }) => {
            const to = articleHref(href, article.slug);
            return to?.startsWith("/documentation/") ? (
                <Link to={to}>{children}</Link>
            ) : (
                <a href={to}>{children}</a>
            );
        },
        pre: CodeBlock,
        table: ({ children }) => (
            <div
                className="doc-table"
                role="region"
                aria-label="Reference table"
                tabIndex={0}
            >
                <table>{children}</table>
            </div>
        ),
        img: ({ alt, src }) => <img alt={alt ?? ""} src={src} loading="lazy" />
    };
    const index = articles.indexOf(article);
    return (
        <>
            <main
                id="guide-article"
                ref={main}
                tabIndex={-1}
                className="doc-article"
                aria-label={article.title}
                aria-busy={!source && !failed}
            >
                <div className="doc-eyebrow">
                    {article.section}
                    <span aria-hidden="true">/</span> Csound Web-IDE
                </div>
                {source ? (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={components}
                    >
                        {source}
                    </ReactMarkdown>
                ) : (
                    <>
                        <h1>{article.title}</h1>
                        {failed ? (
                            <div role="alert">
                                <p>
                                    This article could not load. Check your
                                    connection and try again.
                                </p>
                                <button
                                    onClick={() =>
                                        setAttempt((value) => value + 1)
                                    }
                                >
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <p role="status">Loading article...</p>
                        )}
                    </>
                )}
                {source && (
                    <footer className="doc-footer">
                        <a
                            className="doc-edit"
                            href={`https://github.com/csound/web-ide/edit/develop/docs/guide/${article.slug}.md`}
                        >
                            <EditOutlined fontSize="small" />
                            Edit this page
                        </a>
                        <nav
                            aria-label="Adjacent articles"
                            className="doc-pagination"
                        >
                            {index > 0 ? (
                                <Link
                                    to={articlePath(articles[index - 1].slug)}
                                >
                                    <small>Previous</small>
                                    {articles[index - 1].title}
                                </Link>
                            ) : (
                                <span />
                            )}
                            {index < articles.length - 1 && (
                                <Link
                                    to={articlePath(articles[index + 1].slug)}
                                >
                                    <small>Next</small>
                                    {articles[index + 1].title}
                                    <ArrowForwardRounded fontSize="small" />
                                </Link>
                            )}
                        </nav>
                    </footer>
                )}
            </main>
            <aside className="doc-outline" aria-label="On this page">
                {headings.length > 0 && (
                    <>
                        <span className="doc-label">On this page</span>
                        <nav>
                            {headings.map((heading) => (
                                <a
                                    key={heading.id}
                                    href={`#${heading.id}`}
                                    className={
                                        heading.level === 3
                                            ? "doc-subheading"
                                            : undefined
                                    }
                                >
                                    {heading.text}
                                </a>
                            ))}
                        </nav>
                    </>
                )}
            </aside>
        </>
    );
}
export const SiteDocuments = () => {
    const theme = useTheme();
    const params = useParams();
    const location = useLocation();
    const slug = params["*"]?.replace(/\/$/, "") || "getting-started";
    const article = articles.find((item) => item.slug === slug);
    const [query, setQuery] = useState("");
    const [expanded, setExpanded] = useState(false);
    const matches = findArticles(query);
    useEffect(() => {
        setExpanded(false);
        setQuery("");
    }, [slug]);
    // Keep existing links from WebMCP clients and bookmarks working.
    if (!params["*"] && location.hash === "#webmcp")
        return <Navigate replace to={articlePath("reference/webmcp")} />;
    return (
        <div css={readerStyle(theme)}>
            <Header />
            <a href="#guide-article" className="doc-skip">
                Skip to article
            </a>
            <div className="doc-layout">
                <aside
                    className={`doc-sidebar${expanded ? " is-expanded" : ""}`}
                >
                    <div className="doc-brand">
                        <Link to="/documentation">
                            <MenuBookRounded />
                            User guide
                        </Link>
                        <button
                            className="doc-menu"
                            aria-expanded={expanded}
                            aria-controls="guide-contents"
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? "Close contents" : "Contents"}
                        </button>
                    </div>
                    <div id="guide-contents" className="doc-contents">
                        <label className="doc-search">
                            <SearchRounded fontSize="small" />
                            <span className="doc-sr-only">Find an article</span>
                            <input
                                type="search"
                                placeholder="Find an article"
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                            />
                        </label>
                        <nav aria-label="Guide contents">
                            {sections.map((section) => {
                                const visible = section.articles.filter(
                                    (item) =>
                                        matches.some(
                                            (match) => match.slug === item.slug
                                        )
                                );
                                return visible.length ? (
                                    <section key={section.title}>
                                        <h2 className="doc-label">
                                            {section.title}
                                        </h2>
                                        {visible.map((item) => (
                                            <Link
                                                key={item.slug}
                                                to={articlePath(item.slug)}
                                                onClick={() => {
                                                    setExpanded(false);
                                                    setQuery("");
                                                    if (slug === item.slug) {
                                                        const main =
                                                            document.getElementById(
                                                                "guide-article"
                                                            );
                                                        main?.focus();
                                                        main?.scrollIntoView({
                                                            block: "start"
                                                        });
                                                    }
                                                }}
                                                aria-current={
                                                    slug === item.slug
                                                        ? "page"
                                                        : undefined
                                                }
                                            >
                                                {item.title}
                                            </Link>
                                        ))}
                                    </section>
                                ) : null;
                            })}
                        </nav>
                        {matches.length === 0 && (
                            <p role="status">
                                No articles match &quot;{query}&quot;. Try a
                                tool name or a shorter phrase.
                            </p>
                        )}
                        {query && (
                            <button
                                className="doc-clear"
                                onClick={() => setQuery("")}
                            >
                                Clear search
                            </button>
                        )}
                        <a
                            className="doc-contribute"
                            href="https://github.com/csound/web-ide/issues"
                        >
                            Report a problem{" "}
                            <ArrowForwardRounded fontSize="small" />
                        </a>
                    </div>
                </aside>
                {article ? (
                    <ArticleBody key={article.slug} article={article} />
                ) : (
                    <main
                        className="doc-article"
                        id="guide-article"
                        tabIndex={-1}
                    >
                        <h1>Article not found</h1>
                        <p>
                            This address does not match a guide article. Choose
                            a topic from the contents or{" "}
                            <Link to="/documentation">
                                start with the guide
                            </Link>
                            .
                        </p>
                    </main>
                )}
            </div>
        </div>
    );
};
