import { useProjectToolFiles } from "../audio-tools/project-files";
import { checkPvxSize } from "./format";
import PvxTool from "./pvx-tool";
const accepts = (name: string) => /\.(pvx|txt|csv)$/i.test(name);
export default function ProjectPvx({ projectUid }: { projectUid: string }) {
    const { sources, onSave } = useProjectToolFiles(projectUid, accepts, {
        checkSize: checkPvxSize
    });
    return <PvxTool key={projectUid} sources={sources} onSave={onSave} />;
}
