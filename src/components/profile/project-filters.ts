import type { IProject } from "@comp/projects/types";
import { projectTags } from "@comp/projects/tags";

export const normalizeProjectText = (value: string) =>
    value.trim().normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

export function availableProjectTags(projects: IProject[]) {
    const tags = new Map<string, string>();
    for (const project of projects)
        for (const tag of projectTags(project)) {
            if (!tags.has(normalizeProjectText(tag)))
                tags.set(normalizeProjectText(tag), tag);
        }
    return [...tags.values()].sort((a, b) => a.localeCompare(b));
}

export function filterProfileProjects(
    projects: IProject[],
    query: string,
    selectedTags: string[]
) {
    const search = normalizeProjectText(query);
    return projects.filter((project) => {
        const tags = projectTags(project).map(normalizeProjectText);
        return (
            selectedTags.every((tag) =>
                tags.includes(normalizeProjectText(tag))
            ) &&
            (!search ||
                [project.name, project.description, ...tags].some((value) =>
                    normalizeProjectText(value || "").includes(search)
                ))
        );
    });
}
