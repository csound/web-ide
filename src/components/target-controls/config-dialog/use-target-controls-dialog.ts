import { useCallback, useEffect, useState } from "react";
import { closeModal } from "@comp/modal/actions";
import { useTheme } from "@emotion/react";
import { RootState, useDispatch, useSelector } from "@root/store";
import { IDocument, IDocumentsMap } from "@comp/projects/types";
import { ICsoundOptions } from "@comp/csound/types";
import {
    append,
    ascend,
    assoc,
    assocPath,
    equals,
    find,
    keys,
    map,
    pathOr,
    pipe,
    prop,
    propEq,
    reduce,
    reject,
    sort,
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

    const documentsMap: IDocumentsMap | undefined = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const allDocuments: IDocument[] | undefined =
        documentsMap && values(documentsMap);

    const targets: ITargetMap | undefined = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const targetsToLocalState = useCallback(
        () =>
            targets
                ? sort(
                      ascend(prop("targetName")),
                      reduce(
                          (accumulator: ITargetFromInput[], k: string) =>
                              (pipe as any)(
                                  assoc("isNameValid", true),
                                  assoc("isTypeValid", true),
                                  assoc("isOtherwiseValid", true),
                                  assoc(
                                      "isDefaultTarget",
                                      defaultTargetName ===
                                          targets[k].targetName
                                  ),
                                  assoc("oldTargetName", targets[k].targetName),
                                  (x) => append(x, accumulator)
                              )(targets[k]),
                          [],
                          keys(targets) as string[]
                      )
                  )
                : ([] as ITargetFromInput[]),
        [defaultTargetName, targets]
    );

    const [storedTargets, setStoredTargets] = useState(targetsToLocalState());
    const [newTargets, setNewTargets] = useState(storedTargets);

    const hasModifiedTargets = !equals(storedTargets, newTargets);

    useEffect(() => {
        setStoredTargets(targetsToLocalState());
        return () => setStoredTargets(targetsToLocalState());
    }, [targetsToLocalState]);

    const someErrorPresent: boolean =
        newTargets.some(propEq("isNameValid", false)) ||
        newTargets.some(propEq("isTypeValid", false)) ||
        newTargets.some(propEq("isOtherwiseValid", false));
    const someChangesMade = !equals(storedTargets, newTargets);
    const shouldDisallowSave = someErrorPresent || !someChangesMade;

    const handleCreateNewTarget = useCallback(() => {
        setNewTargets(
            append(
                {
                    csoundOptions: {} as ICsoundOptions,
                    isNameValid: false,
                    isTypeValid: false,
                    isOtherwiseValid: false,
                    isDefaultTarget: false,
                    useCsound7: false,
                    targetDocumentUid: "",
                    targetName: "",
                    targetType: ""
                } as ITargetFromInput,
                newTargets
            )
        );
    }, [setNewTargets, newTargets]);

    const handleCloseModal = useCallback(() => {
        dispatch(closeModal());
    }, [dispatch]);

    const handleSave = useCallback(() => {
        const maybeDefaultTarget = find(prop("isDefaultTarget"), newTargets);
        dispatch(
            saveChangesToTarget(
                activeProjectUid,
                firestoreNewTargets(newTargets),
                maybeDefaultTarget && maybeDefaultTarget.targetName,
                () => setStoredTargets(newTargets)
            )
        );
    }, [activeProjectUid, dispatch, newTargets, setStoredTargets]);

    const handleTargetDelete = useCallback(
        (targetName: string) => {
            setNewTargets(reject(propEq("targetName", targetName), newTargets));
        },
        [setNewTargets, newTargets]
    );

    const handleTargetNameChange = useCallback(
        ({
            nextValue,
            oldTargetName,
            targetIndex
        }: {
            nextValue: string;
            oldTargetName: string;
            targetIndex: number;
        }) => {
            const isNameValid = validateTargetName({
                targetName: nextValue,
                oldTargetName,
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

    const handleMarkAsDefaultTarget = useCallback(
        (nextDefaultTargetName: string) => {
            setNewTargets(
                map(
                    (target: ITargetFromInput) =>
                        (console.log(
                            target.targetName,
                            nextDefaultTargetName
                        ) as any) ||
                        assoc(
                            "isDefaultTarget",
                            target.targetName === nextDefaultTargetName,
                            target
                        ),
                    newTargets
                )
            );
        },
        [setNewTargets, newTargets]
    );

    const handleEnableCsound7 = useCallback(
        ({
            enableCsound7,
            targetIndex
        }: {
            enableCsound7: boolean;
            targetIndex: number;
        }) => {
            setNewTargets(
                assocPath(
                    [targetIndex, "useCsound7"],
                    enableCsound7,
                    newTargets
                )
            );
        },
        [setNewTargets, newTargets]
    );

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
        handleEnableCsound7,
        handleSave,
        shouldDisallowSave
    };
};
