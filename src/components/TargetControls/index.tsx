import React, { useEffect } from "react";
import Dropdown from "./Dropdown";
import PlayButton from "./PlayButton";
import { IStore } from "@root/db/interfaces";
import { ITarget, ITargetMap } from "../Projects/types";
import { setSelectedTarget } from "./actons";
import { pathOr, values } from "ramda";
import { useDispatch, useSelector } from "react-redux";

const TargetControls = () => {
    const dispatch = useDispatch();

    const selectedTarget: string | null = useSelector((store: IStore) => {
        return pathOr(null, ["TargetControlsReducer", "selectedTarget"], store);
    });

    const activeProjectUid: string | null = useSelector((store: IStore) => {
        return pathOr(null, ["ProjectsReducer", "activeProjectUid"], store);
    });

    const targets: ITargetMap | null = useSelector((store: IStore) => {
        if (activeProjectUid) {
            return pathOr(
                {} as ITargetMap,
                ["ProjectsReducer", "projects", activeProjectUid, "targets"],
                store
            );
        } else {
            return null;
        }
    });

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
                dispatch(setSelectedTarget(savedDefaultTarget));
            } else if (targetsValues && targetsValues.length > 0) {
                if (targetsValues.some(t => t.targetName === "main")) {
                    dispatch(setSelectedTarget("main"));
                } else {
                    dispatch(setSelectedTarget(targetsValues[0].targetName));
                }
            }
        }
    }, [dispatch, targetsValues, savedDefaultTarget, selectedTarget]);

    if (!selectedTarget) {
        return <></>;
    } else {
        return (
            <>
                <PlayButton />
                <Dropdown selectedTarget={selectedTarget} targets={targets} />
            </>
        );
    }
};

export default TargetControls;
