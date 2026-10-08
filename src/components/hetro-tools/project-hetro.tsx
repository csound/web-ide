import { useProjectToolFiles } from "../audio-tools/project-files";
import HetroTool from "./hetro-tool";
import { checkHetroSize } from "./convert";
const accepts = (name: string) => /\.(het|txt|csv)$/i.test(name);
export default function ProjectHetro({ projectUid }: { projectUid: string }) {
    const { sources, onSave } = useProjectToolFiles(
        projectUid,
        accepts,
        checkHetroSize
    );
    return <HetroTool key={projectUid} sources={sources} onSave={onSave} />;
}
