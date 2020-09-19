import React, { useEffect } from "react";
import { IStore } from "@store/types";
import TargetDropdown from "./dropdown";
import PlayButton from "./play-button";
import { selectProjectTargets, selectSelectedTarget } from "./selectors";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { ITarget, ITargetMap } from "./types";
import { setSelectedTarget } from "./actions";
import { path, pathOr, values } from "ramda";
import { useDispatch, useSelector } from "react-redux";
import StopButton from "./stop-button";

const TargetControls = () => {
    const dispatch = useDispatch();

    const selectedTarget: string | undefined = useSelector(
        selectSelectedTarget
    );

    const activeProjectUid: string | undefined = useSelector(
        (store: IStore) => {
            return path(["ProjectsReducer", "activeProjectUid"], store);
        }
    );

    const isOwner = useSelector(selectIsOwner(activeProjectUid));

    const targets: ITargetMap | undefined = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsValues: ITarget[] | undefined = targets && values(targets);

    const savedDefaultTarget: string | undefined = useSelector(
        (store: IStore) => {
            return (
                activeProjectUid &&
                pathOr(
                    [
                        "ProjectsReducer",
                        "projects",
                        activeProjectUid,
                        "defaultTarget"
                    ],
                    store
                )
            );
        }
    );

    useEffect(() => {
        if (!selectedTarget) {
            if (savedDefaultTarget && savedDefaultTarget.length > 0) {
                dispatch(
                    setSelectedTarget(activeProjectUid, savedDefaultTarget)
                );
            } else if (targetsValues && targetsValues.length > 0) {
                if (targetsValues.some((t) => t.targetName === "project.csd")) {
                    dispatch(
                        setSelectedTarget(activeProjectUid, "project.csd")
                    );
                } else {
                    dispatch(
                        setSelectedTarget(
                            activeProjectUid,
                            targetsValues[0].targetName
                        )
                    );
                }
            }
        }
    }, [
        activeProjectUid,
        dispatch,
        targetsValues,
        savedDefaultTarget,
        selectedTarget
    ]);

    return (
        <>
            <PlayButton activeProjectUid={activeProjectUid} isOwner={isOwner} />
            <StopButton activeProjectUid={activeProjectUid} isOwner={isOwner} />
            {isOwner && <TargetDropdown activeProjectUid={activeProjectUid} />}
        </>
    );
};

export default TargetControls;
