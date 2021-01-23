import React, { useState } from "react";
import Select from "react-select";
import { useTheme } from "@emotion/react";
import Tooltip from "@material-ui/core/Tooltip";
import { useDispatch, useSelector } from "react-redux";
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
        (item_) => typeof item_ !== "undefined",
        (item_) => `${item_}` !== "undefined",
        (item_) => !isNil(item_),
        (item_) => item_ !== null
    ])(item);

const titleTooltip = ({ documents, selectedTarget }) => {
    const mainDocument: IDocument | undefined =
        typeof selectedTarget === "object" &&
        has("targetDocumentUid", selectedTarget) &&
        documents[(selectedTarget || ({} as any)).targetDocumentUid];
    return mainDocument && selectedTarget.targetType === "main"
        ? `main: ${mainDocument.filename}`
        : `No document found for selected target: ${selectedTarget.targetName}`;
};

const TargetDropdown = ({ activeProjectUid }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const targets: ITargetMap | undefined = useSelector(
        selectProjectTargets(activeProjectUid)
    );

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
        isOwner ? [{ label: "Configure", value: "___toggle-configure" }] : []
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
                    onChange={(event) => {
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
                    styles={{
                        control: (provided, state) => SS.control,
                        container: (provided, state) =>
                            SS.dropdownContainer(theme),
                        groupHeading: (provided, state) =>
                            SS.groupHeading(theme),
                        placeholder: (provided, state) => SS.placeholder(theme),
                        menu: (provided, state) => SS.menu(theme),
                        menuList: (provided, state) => SS.menuList(theme),
                        option: (provided, state) => SS.menuOption(theme),
                        indicatorsContainer: (provided, state) =>
                            SS.indicatorContainer(theme),
                        indicatorSeparator: (provided, state) =>
                            SS.indicatorSeparator
                    }}
                />
            </div>
        </Tooltip>
    );
};

export default TargetDropdown;
