import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { projects as projectCollection } from "@config/firestore";
import type { IProject } from "@comp/projects/types";

type StarredProject = Pick<
    IProject,
    | "projectUid"
    | "name"
    | "description"
    | "iconName"
    | "iconForegroundColor"
    | "iconBackgroundColor"
>;
type Result = { ids: string[]; projects: StarredProject[]; isLoading: boolean };

/** Only show projects whose current public metadata we can read. */
export function useStarredProjects(starIds: string[]) {
    const ids = useMemo(
        () =>
            [...new Set(starIds)].filter(
                (id) =>
                    typeof id === "string" &&
                    id.trim() &&
                    !id.includes("/") &&
                    id !== "." &&
                    id !== ".."
            ),
        [starIds]
    );
    const [result, setResult] = useState<Result>({
        ids: [],
        projects: [],
        isLoading: true
    });
    useEffect(() => {
        let active = true;
        const pending = new Set(ids);
        const visible = new Map<string, StarredProject>();
        const publish = () => {
            if (active)
                setResult({
                    ids,
                    projects: ids.flatMap((id) =>
                        visible.has(id) ? [visible.get(id)!] : []
                    ),
                    isLoading: pending.size > 0
                });
        };
        publish();
        const stops = ids.map((id) =>
            onSnapshot(
                doc(projectCollection, id),
                { includeMetadataChanges: true },
                (snapshot) => {
                    if (!active || snapshot.metadata.fromCache) return;
                    const data = snapshot.data();
                    if (
                        snapshot.exists() &&
                        data?.public === true &&
                        typeof data.name === "string" &&
                        data.name.trim()
                    ) {
                        visible.set(id, {
                            projectUid: id,
                            name: data.name,
                            description:
                                typeof data.description === "string"
                                    ? data.description
                                    : "",
                            iconName: data.iconName,
                            iconForegroundColor: data.iconForegroundColor,
                            iconBackgroundColor: data.iconBackgroundColor
                        });
                    } else visible.delete(id);
                    pending.delete(id);
                    publish();
                },
                () => {
                    if (!active) return;
                    visible.delete(id);
                    pending.delete(id);
                    publish();
                }
            )
        );
        return () => {
            active = false;
            stops.forEach((stop) => stop());
        };
    }, [ids]);
    // Never flash results from the previous profile or an older star list.
    return result.ids === ids
        ? result
        : { projects: [], isLoading: ids.length > 0 };
}
