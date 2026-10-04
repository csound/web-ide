export const projectTags = (project: { tags?: unknown }): string[] =>
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
