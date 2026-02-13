import { ITargetMap, ITargetFromInput } from "../types";

export const firestoreNewTargets = (
    newTargets: ITargetFromInput[]
): ITargetMap => {
    return newTargets.reduce((accumulator: ITargetMap, target) => {
        const {
            targetName,
            targetType,
            targetDocumentUid,
            csoundOptions
        } = target;

        const firebaseTarget = {
            targetName,
            targetType,
            targetDocumentUid,
            csoundOptions: csoundOptions || {}
        };

        accumulator[targetName] = firebaseTarget;
        return accumulator;
    }, {} as ITargetMap);
};

export const validateTargetName = ({
    targetName,
    oldTargetName,
    newTargets
}: {
    targetName: string;
    oldTargetName: string;
    newTargets: ITargetFromInput[];
}): boolean => {
    if (!targetName.trim()) {
        return false;
    }

    if (oldTargetName === targetName) {
        return true;
    }

    const filteredTargets = newTargets.filter(
        (target) => target.oldTargetName !== oldTargetName
    );

    return !filteredTargets.some((target) => target.targetName === targetName);
};
