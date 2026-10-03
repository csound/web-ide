import { IProject } from "@comp/projects/types";

const escapeAttribute = (value: string) =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

export function projectShareLinks(
    origin: string,
    project: Pick<IProject, "projectUid" | "name">
) {
    const id = encodeURIComponent(project.projectUid);
    const editorUrl = new URL(`/editor/${id}`, origin).href;
    const embedUrl = new URL(`/embed/${id}`, origin).href;
    const embedCode = `<iframe src="${escapeAttribute(embedUrl)}" title="${escapeAttribute(project.name || "Csound project")}" width="100%" height="360" style="border: 0;" loading="lazy" allow="autoplay"></iframe>`;
    return { editorUrl, embedUrl, embedCode };
}
