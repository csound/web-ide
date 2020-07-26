import React, { useEffect } from "react";
import { IStore } from "@store/types";
import TargetDropdown from "./Dropdown";
import PlayButton from "./PlayButton";
import { selectProjectTargets, selectSelectedTarget } from "./selectors";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import { ITarget, ITargetMap } from "./types";
import { setSelectedTarget } from "./actions";
import { pathOr, values } from "ramda";
import { useDispatch, useSelector } from "react-redux";
import StopButton from "./StopButton";

const TargetControls = () => {
    const dispatch = useDispatch();

    const selectedTarget: string | null = useSelector(selectSelectedTarget);

    const activeProjectUid: string | null = useSelector((store: IStore) => {
        return pathOr(null, ["ProjectsReducer", "activeProjectUid"], store);
    });

    const isOwner = useSelector(selectIsOwner(activeProjectUid));

    const targets: ITargetMap | null = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsValues: ITarget[] | null = targets ? values(targets) : null;

    const savedDefaultTarget: string | null = useSelector((store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                "",
                [
                    "ProjectsReducer",
                    "projects",
                    activeProjectUid,
                    "defaultTarget"
                ],
                store
            );
        } else {
            return null;
        }
    });

    useEffect(() => {
        if (selectedTarget === null) {
            if (savedDefaultTarget && savedDefaultTarget.length > 0) {
                dispatch(
                    setSelectedTarget(activeProjectUid, savedDefaultTarget)
                );
            } else if (targetsValues && targetsValues.length > 0) {
                if (targetsValues.some(t => t.targetName === "project.csd")) {
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

    //return isEmpty(keys(targets)) ? null : (
    return (
        <>
            <PlayButton activeProjectUid={activeProjectUid} isOwner={isOwner} />
            <StopButton activeProjectUid={activeProjectUid} isOwner={isOwner} />
            {isOwner && <TargetDropdown activeProjectUid={activeProjectUid} />}
        </>
    );
};

export default TargetControls;
