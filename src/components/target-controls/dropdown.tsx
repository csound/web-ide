import React, { useState } from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "@root/store";
import { useTheme } from "@emotion/react";
import Tooltip from "@mui/material/Tooltip";
import { setSelectedTarget, showTargetsConfigDialog } from "./actions";
import { ITarget, ITargetMap } from "./types";
import { IDocument, IDocumentsMap } from "@comp/projects/types";
import {
    selectProjectDocuments,
    selectProjectTargets,
    selectSelectedTarget
} from "./selectors";
import { selectIsOwner } from "@comp/project-editor/selectors";
import { append, allPass, concat, filter, isNil, has, values } from "ramda";
import { isEmpty, reduce } from "lodash";
import * as SS from "./styles";

interface IDropdownOption {
    label: string;
    value: string;
}

const paranoidNotNullChecker = (item: any): boolean =>
    allPass([
        (item_) => item_ !== undefined,
        (item_) => `${item_}` !== "undefined",
        (item_) => !isNil(item_),
        (item_) => item_ !== null
    ])(item);

const titleTooltip = ({ documents, selectedTarget }) => {
    const mainDocument: IDocument | undefined =
        typeof selectedTarget === "object" &&
        selectedTarget.targetDocumentUid &&
        documents[selectedTarget.targetDocumentUid];

    return mainDocument && selectedTarget.targetType === "main"
        ? `main: ${mainDocument.filename}`
        : `No document found for selected target: ${selectedTarget.targetName}`;
};

const TargetDropdown = ({
    activeProjectUid
}: {
    activeProjectUid: string;
}): React.ReactElement => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const targets: ITargetMap =
        useSelector(selectProjectTargets(activeProjectUid)) || {};

    const documents: IDocumentsMap | undefined = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const selectedTargetName: string | undefined = useSelector(
        selectSelectedTarget(activeProjectUid)
    );

    let selectedTarget: ITarget | undefined;
    if (targets && selectedTargetName && targets[selectedTargetName]) {
        selectedTarget = targets[selectedTargetName];
    }

    const isOwner = useSelector(selectIsOwner(activeProjectUid));

    const mainTargets: ITarget[] = Object.values(targets).filter(
        (target) => target.targetDocumentUid
    );

    const playlistTargets: ITarget[] = Object.values(targets).filter(
        (target) => target.playlistDocumentsUid
    );

    const mainDropdownOptions = isEmpty(mainTargets)
        ? []
        : reduce(
              mainTargets,
              (accumulator: IDropdownOption[], target) => {
                  return append(
                      {
                          value: target.targetName,
                          label: target.targetName
                      },
                      accumulator
                  );
              },
              [] as IDropdownOption[]
          );

    const playlistDropdownOptions = isEmpty(playlistTargets)
        ? []
        : reduce(
              playlistTargets,
              (accumulator, target) => {
                  return append(
                      {
                          value: target.targetName,
                          label: target.targetName
                      },
                      accumulator
                  );
              },
              [] as IDropdownOption[]
          );

    const options = concat(
        [
            { label: "Playlist", options: playlistDropdownOptions },
            {
                label: "Targets",
                options: mainDropdownOptions
            }
        ],
        isOwner
            ? [{ label: "Configure", value: "___toggle-configure" } as any]
            : []
    );

    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [tooltipIsOpen, setTooltipIsOpen] = useState(false);

    if (!activeProjectUid) {
        return <></>;
    }

    const tooltipText = paranoidNotNullChecker(selectedTarget)
        ? titleTooltip({ documents, selectedTarget })
        : "No target selected";

    return (
        <Tooltip
            open={tooltipIsOpen}
            onOpen={() => !menuIsOpen && setTooltipIsOpen(true)}
            onClose={() => setTooltipIsOpen(false)}
            title={tooltipText}
            placement="bottom-end"
        >
            <div>
                <Select
                    value={selectedTargetName}
                    closeMenuOnSelect={true}
                    placeholder={
                        values(targets || []).length > 0
                            ? selectedTargetName &&
                              selectedTargetName.length > 0
                                ? selectedTargetName
                                : "Select target"
                            : "No targets found"
                    }
                    // menuIsOpen={true}
                    onMenuOpen={() => {
                        setTooltipIsOpen(false);
                        setMenuIsOpen(true);
                    }}
                    onMenuClose={() => setMenuIsOpen(false)}
                    onChange={(event: any) => {
                        event.value === "___toggle-configure"
                            ? dispatch(showTargetsConfigDialog())
                            : dispatch(
                                  setSelectedTarget(
                                      activeProjectUid,
                                      event.value
                                  )
                              );
                    }}
                    isSearchable={false}
                    options={options}
                    styles={
                        {
                            control: () => SS.control,
                            container: () => SS.dropdownContainer(theme),
                            valueContainer: () => SS.valueContainer,
                            groupHeading: () => SS.groupHeading(theme),
                            placeholder: () => SS.placeholder(theme),
                            menu: () => SS.menu(theme),
                            menuList: () => SS.menuList(theme),
                            option: () => SS.menuOption(theme),
                            indicatorsContainer: () =>
                                SS.indicatorContainer(theme),
                            indicatorSeparator: () => SS.indicatorSeparator
                        } as any
                    }
                />
            </div>
        </Tooltip>
    );
};

export default TargetDropdown;
