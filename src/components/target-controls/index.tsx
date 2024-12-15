import React, { useEffect } from "react";
import { RootState, useDispatch, useSelector } from "@root/store";
import TargetDropdown from "./dropdown";
import PlayButton from "./play-button";
import { selectProjectTargets, selectSelectedTarget } from "./selectors";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { ITarget, ITargetMap } from "./types";
import { setSelectedTarget } from "./actions";
import { path, pathOr, values } from "ramda";
import StopButton from "./stop-button";

const TargetControls = (): React.ReactElement => {
    const dispatch = useDispatch();

    const selectedTarget: string | undefined =
        useSelector(selectSelectedTarget);

    const activeProjectUid: string | undefined = useSelector(
        (store: RootState) => {
            return path(["ProjectsReducer", "activeProjectUid"], store);
        }
    );

    const isOwner = useSelector(selectIsOwner(activeProjectUid || ""));

    const targets: ITargetMap | undefined = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsValues: ITarget[] | undefined = targets && values(targets);

    const savedDefaultTarget: string | undefined = useSelector(
        (store: RootState) => {
            if (!activeProjectUid) return undefined;
            return (
                store.TargetControlsReducer[activeProjectUid]?.defaultTarget ??
                undefined
            );
        }
    );

    useEffect(() => {
        if (!selectedTarget) {
            if (savedDefaultTarget && savedDefaultTarget.length > 0) {
                activeProjectUid &&
                    dispatch(
                        setSelectedTarget(activeProjectUid, savedDefaultTarget)
                    );
            } else if (targetsValues && targetsValues.length > 0) {
                if (targetsValues.some((t) => t.targetName === "project.csd")) {
                    activeProjectUid &&
                        dispatch(
                            setSelectedTarget(activeProjectUid, "project.csd")
                        );
                } else {
                    activeProjectUid
                        ? dispatch(
                              setSelectedTarget(
                                  activeProjectUid,
                                  targetsValues[0].targetName
                              )
                          )
                        : console.error("Error: missing activeProjectUid");
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

    return activeProjectUid ? (
        <>
            <PlayButton activeProjectUid={activeProjectUid} isOwner={isOwner} />
            <StopButton />
            {isOwner && <TargetDropdown activeProjectUid={activeProjectUid} />}
        </>
    ) : (
        <></>
    );
};

export default TargetControls;
