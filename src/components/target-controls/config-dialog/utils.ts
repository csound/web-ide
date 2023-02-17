import { assoc, isEmpty, reduce, reject, propEq } from "ramda";
import { ITargetMap, ITargetFromInput } from "../types";

export const firestoreNewTargets = (newTargets: ITargetFromInput[]) =>
    reduce(
        (
            accumulator: ITargetMap,
            {
                targetName,
                targetType,
                targetDocumentUid,
                csoundOptions,
                useCsound7
            }: ITargetFromInput
        ) => {
            const firebaseTarget = {
                targetName,
                targetType,
                targetDocumentUid,
                csoundOptions,
                useCsound7
            };
            return assoc(targetName, firebaseTarget, accumulator);
        },
        {},
        newTargets as ITargetFromInput[]
    ) as ITargetMap;

export const validateTargetName = ({ targetName, oldTargetName, newTargets }) =>
    !isEmpty(targetName) &&
    (oldTargetName === targetName
        ? true
        : !reject(propEq("oldTargetName", oldTargetName), newTargets).some(
              propEq("targetName", targetName)
          ));
