import { ITargetMap, ITargetFromInput } from "../types";

export const firestoreNewTargets = (
    newTargets: ITargetFromInput[]
): ITargetMap => {
    return newTargets.reduce((accumulator: ITargetMap, target) => {
        const {
            targetName,
            targetType,
            targetDocumentUid,
            playlistDocumentsUid,
            csoundOptions
        } = target;

        const firebaseTarget = {
            targetName,
            targetType,
            ...(targetDocumentUid ? { targetDocumentUid } : {}),
            ...(playlistDocumentsUid ? { playlistDocumentsUid } : {}),
            csoundOptions: csoundOptions || {}
        };

        accumulator[targetName] = firebaseTarget;
        return accumulator;
    }, {} as ITargetMap);
};

export const validateTargetName = ({
    targetName,
    targetIndex,
    newTargets
}: {
    targetName: string;
    targetIndex: number;
    newTargets: ITargetFromInput[];
}): boolean => {
    return (
        Boolean(targetName.trim()) &&
        !newTargets.some(
            (target, index) =>
                index !== targetIndex && target.targetName === targetName
        )
    );
};
