import type { IProject } from "@comp/projects/types";

const normalize = (value: string) =>
    value.trim().normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
export const projectTags = (project: Pick<IProject, "tags">): string[] =>
    Array.isArray(project.tags)
        ? [
              ...new Set(
                  project.tags
                      .filter((tag) => typeof tag === "string")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
              )
          ]
        : [];

export function availableProjectTags(projects: IProject[]) {
    const tags = new Map<string, string>();
    for (const project of projects)
        for (const tag of projectTags(project)) {
            if (!tags.has(normalize(tag))) tags.set(normalize(tag), tag);
        }
    return [...tags.values()].sort((a, b) => a.localeCompare(b));
}

export function filterProfileProjects(
    projects: IProject[],
    query: string,
    selectedTags: string[]
) {
    const search = normalize(query);
    return projects.filter((project) => {
        const tags = projectTags(project).map(normalize);
        return (
            selectedTags.every((tag) => tags.includes(normalize(tag))) &&
            (!search ||
                [project.name, project.description, ...tags].some((value) =>
                    normalize(value || "").includes(search)
                ))
        );
    });
}
