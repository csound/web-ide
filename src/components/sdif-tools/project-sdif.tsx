import { useProjectToolFiles } from "../audio-tools/project-files";
import { checkSdifSize } from "./format";
import SdifTool from "./sdif-tool";
const accepts = (name: string) => /\.sdif$/i.test(name);
export default function ProjectSdif({ projectUid }: { projectUid: string }) {
    const files = useProjectToolFiles(projectUid, accepts, checkSdifSize);
    return <SdifTool key={projectUid} {...files} />;
}
