import { isEmpty, reject, propEq } from "ramda";
import { ITargetMap, ITargetFromInput } from "../types";

export const firestoreNewTargets = (
    newTargets: ITargetFromInput[]
): ITargetMap => {
    return newTargets.reduce((accumulator, target) => {
        const {
            targetName,
            targetType,
            targetDocumentUid,
            csoundOptions,
            useCsound7
        } = target;

        const firebaseTarget = {
            targetName,
            targetType,
            targetDocumentUid,
            csoundOptions,
            useCsound7: useCsound7 || false
        };

        accumulator[targetName] = firebaseTarget;
        return accumulator;
    }, {});
};

export const validateTargetName = ({ targetName, oldTargetName, newTargets }) =>
    !isEmpty(targetName) &&
    (oldTargetName === targetName
        ? true
        : !reject(propEq("oldTargetName", oldTargetName), newTargets).some(
              propEq("targetName", targetName)
          ));
