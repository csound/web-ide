import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";
import { projects } from "@config/firestore";

export interface ForkProjectDetails {
    sourceProjectUid: string;
    name: string;
    description: string;
    iconName: string;
    iconForegroundColor: string;
    iconBackgroundColor: string;
    public: boolean;
    tags: string[];
}

export async function createProjectFork(details: ForkProjectDetails) {
    const result = await httpsCallable<
        ForkProjectDetails,
        { projectUid: string }
    >(getFunctions(), "fork_project", { timeout: 330_000 })(details);
    return result.data.projectUid;
}

export interface ForkSource {
    id: string;
    name?: string;
    status: "loading" | "hidden" | "public" | "error";
}

export function subscribeToForkSource(
    id: string,
    onChange: (source: ForkSource) => void
) {
    if (id.includes("/") || [".", ".."].includes(id)) {
        onChange({ id, status: "error" });
        return () => {};
    }
    return onSnapshot(
        doc(projects, id),
        { includeMetadataChanges: true },
        (snapshot) => {
            // Cached names may outlive public access. Only show server-confirmed names.
            const data = snapshot.data();
            onChange(
                snapshot.metadata.fromCache ||
                    snapshot.metadata.hasPendingWrites
                    ? { id, status: "loading" }
                    : data?.public === true
                      ? {
                            id,
                            status: "public",
                            name:
                                typeof data.name === "string" && data.name
                                    ? data.name
                                    : "Untitled project"
                        }
                      : { id, status: "hidden" }
            );
        },
        (error) => {
            onChange({
                id,
                status: error.code === "permission-denied" ? "hidden" : "error"
            });
        }
    );
}
