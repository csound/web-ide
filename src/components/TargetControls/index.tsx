import React, { useEffect } from "react";
import { IStore } from "@store/types";
import TargetDropdown from "./Dropdown";
import PlayButton from "./PlayButton";
import { selectProjectTargets, selectSelectedTarget } from "./selectors";
import { ITarget, ITargetMap } from "@comp/Projects/types";
import { setSelectedTarget } from "./actions";
import { pathOr, values } from "ramda";
import { useDispatch, useSelector } from "react-redux";

const TargetControls = () => {
    const dispatch = useDispatch();

    const selectedTarget: string | null = useSelector(selectSelectedTarget);

    const activeProjectUid: string | null = useSelector((store: IStore) => {
        return pathOr(null, ["ProjectsReducer", "activeProjectUid"], store);
    });

    const targets: ITargetMap | null = useSelector((store: IStore) =>
        (selectProjectTargets as any)(activeProjectUid)
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
                dispatch(setSelectedTarget(savedDefaultTarget));
            } else if (targetsValues && targetsValues.length > 0) {
                if (targetsValues.some(t => t.targetName === "main")) {
                    dispatch(setSelectedTarget("main"));
                } else {
                    dispatch(setSelectedTarget(targetsValues[0].targetName));
                }
            }
        }
        return () => {
            setSelectedTarget(null);
        };
    }, [dispatch, targetsValues, savedDefaultTarget, selectedTarget]);

    if (!selectedTarget) {
        return <></>;
    } else {
        return (
            <>
                <PlayButton />
                <TargetDropdown activeProjectUid={activeProjectUid} />
            </>
        );
    }
};

export default TargetControls;
