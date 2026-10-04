import { useCallback, useEffect, useState } from "react";
import { closeModal } from "@comp/modal/actions";
import { useTheme } from "@emotion/react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { IDocument } from "@comp/projects/types";
import { ICsoundOptions } from "@comp/csound/types";
import { filenameToCsoundType } from "@comp/csound/utils";
import {
    append,
    assocPath,
    equals,
    find,
    pathOr,
    pipe,
    prop,
    values
} from "ramda";
import { saveChangesToTarget } from "../actions";
import { ITargetMap, ITargetFromInput } from "../types";
import {
    selectDefaultTargetName,
    selectProjectDocuments,
    selectProjectTargets
} from "../selectors";
import { firestoreNewTargets, validateTargetName } from "./utils";

export const useTargetControlsDialog = () => {
    const dispatch = useDispatch();
    const theme: any = useTheme();

    const activeProjectUid: string = useSelector((store: RootState) => {
        return pathOr("", ["ProjectsReducer", "activeProjectUid"], store);
    });

    const defaultTargetName: string | undefined = useSelector(
        selectDefaultTargetName(activeProjectUid)
    );

    const documentsMap: Record<string, IDocument> | undefined = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const allDocuments: IDocument[] = documentsMap ? values(documentsMap) : [];

    const targets: ITargetMap | undefined = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsToLocalState = useCallback(() => {
        if (!targets) {
            return [] as ITargetFromInput[];
        }

        const processedTargets = Object.keys(targets).reduce<
            ITargetFromInput[]
        >((accumulator, key) => {
            const target = {
                ...targets[key],
                isNameValid: true,
                isTypeValid: true,
                isOtherwiseValid: true,
                isDefaultTarget: defaultTargetName === targets[key].targetName,
                oldTargetName: targets[key].targetName
            };
            accumulator.push(target);
            return accumulator;
        }, []);

        return processedTargets.sort((a, b) =>
            a.targetName.localeCompare(b.targetName)
        );
    }, [defaultTargetName, targets]);

    const [storedTargets, setStoredTargets] = useState(targetsToLocalState());
    const [newTargets, setNewTargets] = useState(storedTargets);

    const hasModifiedTargets = !equals(storedTargets, newTargets);

    useEffect(() => {
        setStoredTargets(targetsToLocalState());
        return () => setStoredTargets(targetsToLocalState());
    }, [targetsToLocalState]);

    const someErrorPresent = newTargets.some((target, targetIndex) => {
        const document = allDocuments.find(
            (doc) => doc.documentUid === target.targetDocumentUid
        );
        const type = document && filenameToCsoundType(document.filename);
        return (
            !validateTargetName({
                targetName: target.targetName,
                targetIndex,
                newTargets
            }) ||
            (target.targetType === "main" && type !== "csd" && type !== "orc")
        );
    });
    const shouldDisallowSave =
        someErrorPresent ||
        !hasModifiedTargets ||
        !newTargets.some((target) => target.isDefaultTarget);

    const handleCreateNewTarget = useCallback(() => {
        setNewTargets(
            append(
                {
                    csoundOptions: {} as ICsoundOptions,
                    isNameValid: false,
                    isTypeValid: false,
                    isOtherwiseValid: false,
                    isDefaultTarget: newTargets.length === 0,
                    oldTargetName: "",
                    targetDocumentUid: "",
                    targetName: "",
                    targetType: "main"
                } as ITargetFromInput,
                newTargets
            )
        );
    }, [setNewTargets, newTargets]);

    const handleCloseModal = useCallback(() => {
        dispatch(closeModal());
    }, [dispatch]);

    const handleSave = useCallback(() => {
        if (shouldDisallowSave) return;
        const maybeDefaultTarget = find(prop("isDefaultTarget"), newTargets);
        if (maybeDefaultTarget) {
            dispatch(
                saveChangesToTarget(
                    activeProjectUid,
                    firestoreNewTargets(newTargets),
                    maybeDefaultTarget && maybeDefaultTarget.targetName,
                    () => setStoredTargets(newTargets)
                )
            );
        }
    }, [
        activeProjectUid,
        dispatch,
        newTargets,
        setStoredTargets,
        shouldDisallowSave
    ]);

    const handleTargetDelete = useCallback(
        (targetIndex: number) => {
            setNewTargets(
                newTargets.filter((_, index) => index !== targetIndex)
            );
        },
        [setNewTargets, newTargets]
    );

    const handleTargetNameChange = useCallback(
        ({
            nextValue,
            targetIndex
        }: {
            nextValue: string;
            oldTargetName: string;
            targetIndex: number;
        }) => {
            const isNameValid = validateTargetName({
                targetName: nextValue,
                targetIndex,
                newTargets
            });
            (pipe as any)(
                assocPath([targetIndex, "targetName"], nextValue),
                assocPath([targetIndex, "isNameValid"], isNameValid),
                setNewTargets
            )(newTargets);
        },
        [setNewTargets, newTargets]
    );

    const handleSelectTargetDocument = useCallback(
        ({
            nextTargetDocumentUid,
            targetIndex
        }: {
            nextTargetDocumentUid: string;
            targetIndex: number;
        }) => {
            setNewTargets(
                assocPath(
                    [targetIndex, "targetDocumentUid"],
                    nextTargetDocumentUid,
                    newTargets
                )
            );
        },
        [setNewTargets, newTargets]
    );

    const handleMarkAsDefaultTarget = useCallback((targetIndex: number) => {
        setNewTargets((targets) =>
            targets.map((target, index) => ({
                ...target,
                isDefaultTarget: index === targetIndex
            }))
        );
    }, []);

    return {
        allDocuments,
        newTargets,
        setNewTargets,
        targets,
        theme,
        hasModifiedTargets,
        handleCloseModal,
        handleCreateNewTarget,
        handleMarkAsDefaultTarget,
        handleTargetNameChange,
        handleSelectTargetDocument,
        handleTargetDelete,
        handleSave,
        shouldDisallowSave
    };
};
