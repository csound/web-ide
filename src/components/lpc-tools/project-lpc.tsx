import { useProjectToolFiles } from "../audio-tools/project-files";
import { checkLpcSize } from "./format";
import LpcTool from "./lpc-tool";
const accepts = (name: string) => /\.(lpc|txt|csv)$/i.test(name);
export default function ProjectLpc({ projectUid }: { projectUid: string }) {
    const { sources, onSave } = useProjectToolFiles(
        projectUid,
        accepts,
        checkLpcSize
    );
    return <LpcTool key={projectUid} sources={sources} onSave={onSave} />;
}
