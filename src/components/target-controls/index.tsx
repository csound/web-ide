import { useEffect } from "react";
import { useSelector } from "@root/store";
import TargetDropdown from "./dropdown";
import PlayButton from "./play-button";
import StopButton from "./stop-button";
import { selectIsOwnerForProject } from "@comp/project-editor/selectors";
import { stopProjectPlayback } from "./playback";

export const TargetControls = ({
    activeProjectUid
}: {
    activeProjectUid: string;
}) => {
    const isOwner = useSelector(selectIsOwnerForProject(activeProjectUid));
    useEffect(
        () => () => stopProjectPlayback(activeProjectUid),
        [activeProjectUid]
    );
    return (
        <>
            <PlayButton activeProjectUid={activeProjectUid} isOwner={isOwner} />
            <StopButton />
            <TargetDropdown activeProjectUid={activeProjectUid} />
        </>
    );
};
