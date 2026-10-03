/* The manual runs on its own; the IDE may send theme and opcode messages. */
const root = new URL(document.body.dataset.manualRoot + "/", location.href);
const search = document.querySelector("#search");
const panel = document.querySelector("#search-panel");
const results = document.querySelector("#search-results");
const status = document.querySelector("#search-status");
const more = document.querySelector("#search-more");
const searchOpen = document.querySelector("#search-open");
let entries;
let matches = [];
let visible = 40;
let searchTimer;

const navigation = document.querySelector("#navigation");
const wide = matchMedia("(min-width: 1000px)");
navigation.open = wide.matches;
wide.addEventListener("change", () => {
    navigation.open = wide.matches;
});

// External references need their own tab when the manual sits in the IDE dock.
if (parent !== window) {
    for (const link of document.querySelectorAll("a[href]")) {
        if (new URL(link.href).origin !== location.origin) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
    }
}

/** Load search data on demand and allow retries after a failed request. */
async function getEntries() {
    if (!entries) {
        entries = fetch(new URL("search-index.json", root))
            .then((response) => {
                if (!response.ok) throw new Error("Search unavailable");
                return response.json();
            })
            .catch((error) => {
                entries = undefined;
                throw error;
            });
    }
    return entries;
}
/** Show the current result slice using text nodes for source content. */
function renderResults() {
    results.replaceChildren();
    for (const entry of matches.slice(0, visible)) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = new URL(entry.url, root).href;
        const title = document.createElement("strong");
        title.textContent = entry.title;
        const description = document.createElement("p");
        description.textContent = entry.description;
        link.append(title, description);
        item.append(link);
        results.append(item);
    }
    status.textContent = matches.length
        ? `${Math.min(visible, matches.length)} of ${matches.length} results`
        : "No matches. Try an opcode name or a shorter phrase.";
    more.hidden = matches.length <= visible;
}
/** Rank the current query and discard results from an older search. */
async function runSearch() {
    const query = search.value.trim().toLowerCase();
    results.replaceChildren();
    more.hidden = true;
    if (!query) {
        status.textContent = "Enter an opcode name or a phrase.";
        return;
    }
    status.textContent = "Searching…";
    try {
        const documents = await getEntries();
        if (query !== search.value.trim().toLowerCase() || !panel.open) return;
        const words = query.split(/\s+/);
        matches = documents
            .map((entry) => {
                const title = entry.title.toLowerCase();
                const text =
                    `${title} ${entry.description} ${entry.text}`.toLowerCase();
                const rank =
                    title === query
                        ? 0
                        : title.startsWith(query)
                          ? 1
                          : title.includes(query)
                            ? 2
                            : words.every((word) => text.includes(word))
                              ? 3
                              : 4;
                return { entry, rank };
            })
            .filter((item) => item.rank < 4)
            .sort(
                (a, b) =>
                    a.rank - b.rank ||
                    a.entry.title.localeCompare(b.entry.title)
            )
            .map((item) => item.entry);
        visible = 40;
        renderResults();
    } catch {
        if (query !== search.value.trim().toLowerCase() || !panel.open) return;
        results.replaceChildren();
        status.textContent =
            "Could not load search. Submit the search again to retry.";
    }
}
/** Use the whole manual view while keeping focus inside search. */
function openSearch(query) {
    if (typeof query === "string") search.value = query;
    if (!panel.open) panel.showModal();
    search.focus();
    runSearch();
}
searchOpen.addEventListener("click", () => openSearch());
search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 120);
});
document.querySelector("#manual-search").addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(searchTimer);
    runSearch();
});
/** Dismiss results and return keyboard focus to the search field. */
function closeSearch() {
    clearTimeout(searchTimer);
    panel.close();
    searchOpen.focus();
}
document.querySelector("#search-close").addEventListener("click", closeSearch);
panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeSearch();
});
more.addEventListener("click", () => {
    const next = visible;
    visible += 40;
    renderResults();
    results.children[next]?.querySelector("a")?.focus();
});
document.addEventListener("keydown", (event) => {
    if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    ) {
        event.preventDefault();
        openSearch();
    }
    if (
        event.key === "ArrowDown" &&
        document.activeElement === search &&
        panel.open
    ) {
        event.preventDefault();
        results.querySelector("a")?.focus();
    }
});

for (const block of document.querySelectorAll(".highlight")) {
    const code = block.querySelector("code");
    if (!code) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code";
    button.textContent = "Copy code";
    button.addEventListener("click", async () => {
        const content = code.cloneNode(true);
        content
            .querySelectorAll(".linenos")
            .forEach((element) => element.remove());
        try {
            await navigator.clipboard.writeText(content.textContent);
            button.textContent = "Copied";
        } catch {
            button.textContent = "Select code to copy";
        }
        setTimeout(() => {
            button.textContent = "Copy code";
        }, 2000);
    });
    block.append(button);
}
const documentId = Array.from(crypto.getRandomValues(new Uint32Array(4))).join(
    "-"
);
let leaving = false;
let lookup;
let lookupRequest;

/** Identify the document that accepted work, even across iframe navigation. */
function notifyParent(type, details = {}) {
    if (parent !== window)
        parent.postMessage({ type, documentId, ...details }, location.origin);
}

/** Stop accepting work before navigation removes this document's listeners. */
function markLeaving() {
    leaving = true;
    notifyParent("csound-manual:navigating");
}
window.addEventListener("beforeunload", markLeaving);
window.addEventListener("pagehide", markLeaving);
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        leaving = false;
        lookupRequest = undefined;
        notifyParent("csound-manual:ready");
    }
});
document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
    )
        return;
    const destination = new URL(link.href);
    if (
        destination.origin === location.origin &&
        (destination.pathname.endsWith("/") ||
            destination.pathname.endsWith(".html")) &&
        (destination.pathname !== location.pathname ||
            destination.search !== location.search)
    )
        markLeaving();
});

/** Resolve the newest request and acknowledge it before navigating or searching. */
async function lookupEntry(token, requestId) {
    if (
        leaving ||
        typeof token !== "string" ||
        token.length > 100 ||
        !Number.isSafeInteger(requestId) ||
        requestId === lookupRequest
    )
        return;
    lookupRequest = requestId;
    try {
        if (!lookup)
            lookup = fetch(new URL("lookup.json", root))
                .then((response) => {
                    if (!response.ok) throw new Error("Lookup unavailable");
                    return response.json();
                })
                .catch((error) => {
                    lookup = undefined;
                    throw error;
                });
        const table = await lookup;
        if (leaving || lookupRequest !== requestId) return;
        const path = table[token];
        if (typeof path === "string") {
            const url = new URL(path, root);
            if (
                url.origin === location.origin &&
                url.pathname.startsWith(root.pathname)
            ) {
                leaving = true;
                notifyParent("csound-manual:accepted", {
                    requestId,
                    navigating: true
                });
                location.assign(url);
                return;
            }
        }
    } catch {
        // Search still works if the opcode lookup table is unavailable.
    }
    if (leaving || lookupRequest !== requestId) return;
    openSearch(token);
    notifyParent("csound-manual:accepted", { requestId, navigating: false });
}
window.addEventListener("message", (event) => {
    if (
        event.origin !== location.origin ||
        event.source !== parent ||
        parent === window
    )
        return;
    const data = event.data;
    if (data?.type === "csound-manual:connect" && !leaving)
        notifyParent("csound-manual:ready");
    if (data?.type === "csound-manual:lookup" && data.documentId === documentId)
        lookupEntry(data.token, data.requestId);
});
notifyParent("csound-manual:ready");
const query = new URLSearchParams(location.search).get("q");
if (query) openSearch(query);

// MathJax stays local and only loads on pages that contain equations.
if (document.querySelector(".arithmatex")) {
    window.MathJax = {
        loader: { paths: { a11y: new URL("assets/mathjax", root).href } },
        tex: { inlineMath: [["\\(", "\\)"]], displayMath: [["\\[", "\\]"]] },
        options: {
            enableMenu: false,
            ignoreHtmlClass: ".*",
            processHtmlClass: "arithmatex"
        },
        svg: { fontCache: "global" }
    };
    const script = document.createElement("script");
    script.src = new URL("assets/mathjax/tex-svg-full.js", root).href;
    script.async = true;
    document.head.append(script);
}
