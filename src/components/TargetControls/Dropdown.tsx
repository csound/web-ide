import React, { useState } from "react";
import Select from "react-select";
import { useTheme } from "emotion-theming";
import Tooltip from "@material-ui/core/Tooltip";
import { useDispatch, useSelector } from "react-redux";
import { showTargetsConfigDialog } from "@comp/TargetControls/actions";
import { ITarget, ITargetMap } from "./types";
import { IDocument, IDocumentsMap } from "@comp/Projects/types";
import { setSelectedTarget } from "./actions";
import {
    selectProjectDocuments,
    selectProjectTargets,
    selectSelectedTarget
} from "./selectors";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import { append, allPass, concat, filter, isNil, has, values } from "ramda";
import { isEmpty, reduce } from "lodash";
import * as SS from "./styles";

interface IDropdownOption {
    label: string;
    value: string;
}

const paranoidNotNullChecker = (item: any): boolean =>
    allPass([
        i => typeof i !== "undefined",
        i => `${i}` !== "undefined",
        i => !isNil(i),
        i => i !== null
    ])(item);

const titleTooltip = ({ documents, selectedTarget }) => {
    const mainDocument: IDocument | null =
        typeof selectedTarget === "object" &&
        has("targetDocumentUid", selectedTarget)
            ? documents[(selectedTarget || ({} as any)).targetDocumentUid]
            : null;
    if (mainDocument && selectedTarget.targetType === "main") {
        return `main: ${mainDocument.filename}`;
    } else {
        return `No document found for selected target: ${selectedTarget.targetName}`;
    }
};

const TargetDropdown = ({ activeProjectUid }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const targets: ITargetMap | null = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const documents: IDocumentsMap | null = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const selectedTargetName: string | null = useSelector(
        selectSelectedTarget(activeProjectUid)
    );
    const selectedTarget: ITarget | null =
        targets && selectedTargetName
            ? targets[selectedTargetName] || null
            : null;
    const isOwner = useSelector(selectIsOwner(activeProjectUid));

    const mainTargets: ITarget[] = targets
        ? filter(has("targetDocumentUid"), values(targets))
        : [];

    const playlistTargets: ITarget[] = targets
        ? filter(has("playlistDocumentsUid"), values(targets))
        : [];

    const mainDropdownOptions = isEmpty(mainTargets)
        ? []
        : reduce(
              mainTargets,
              (acc: IDropdownOption[], target) => {
                  return append(
                      {
                          value: target.targetName,
                          label: target.targetName
                      },
                      acc
                  );
              },
              [] as IDropdownOption[]
          );

    const playlistDropdownOptions = isEmpty(playlistTargets)
        ? []
        : reduce(
              playlistTargets,
              (acc, target) => {
                  return append(
                      {
                          value: target.targetName,
                          label: target.targetName
                      },
                      acc
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
        isOwner ? [{ label: "Configure", value: "___toggle-configure" }] : []
    );

    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [tooltipIsOpen, setTooltipIsOpen] = useState(false);

    if (activeProjectUid == null) {
        return null;
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
                              selectedTargetName!.length > 0
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
                    onChange={e => {
                        e.value === "___toggle-configure"
                            ? dispatch(showTargetsConfigDialog())
                            : dispatch(
                                  setSelectedTarget(activeProjectUid, e.value)
                              );
                    }}
                    isSearchable={false}
                    options={options}
                    styles={{
                        control: (provided, state) => SS.control,
                        container: (provided, state) =>
                            SS.dropdownContainer(theme),
                        groupHeading: (provided, state) => SS.groupHeading,
                        placeholder: (provided, state) => SS.placeholder,
                        menu: (provided, state) => SS.menu,
                        menuList: (provided, state) => SS.menuList(theme),
                        option: (provided, state) => SS.menuOption,
                        indicatorsContainer: (provided, state) =>
                            SS.indicatorContainer,
                        indicatorSeparator: (provided, state) =>
                            SS.indicatorSeparator
                    }}
                />
            </div>
        </Tooltip>
    );
};

export default TargetDropdown;
