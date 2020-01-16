import React, { useState } from "react";
import Select from "react-select";
import Tooltip from "@material-ui/core/Tooltip";
import { useDispatch, useSelector } from "react-redux";
import {
    ITarget,
    ITargetMap,
    IDocument,
    IDocumentsMap
} from "@comp/Projects/types";
import { setSelectedTarget } from "./actions";
import {
    selectProjectDocuments,
    selectProjectTargets,
    selectSelectedTarget
} from "./selectors";
import { selectIsOwner } from "@comp/ProjectEditor/selectors";
import { append, concat, filter, has, values } from "ramda";
import { isEmpty, reduce } from "lodash";
import * as SS from "./styles";

interface IDropdownOption {
    label: string;
    value: string;
}

const titleTooltip = ({ documents, selectedTarget }) => {
    const mainDocument: IDocument | null =
        typeof selectedTarget === "object"
            ? documents[selectedTarget.targetDocumentUid]
            : null;
    if (mainDocument && selectedTarget.targetType === "main") {
        return `main: ${mainDocument.filename}`;
        // <div css={SS.dropdownTooltip}>
        //     <h4>{`main: ${mainDocument.filename}`}</h4>
        // </div>
    } else {
        return `No document found for selected target: ${selectedTarget.targetName}`;
    }
};

const TargetDropdown = ({ activeProjectUid }) => {
    const dispatch = useDispatch();
    const targets: ITargetMap | null = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const documents: IDocumentsMap | null = useSelector(
        selectProjectDocuments(activeProjectUid)
    );

    const selectedTargetName: string | null = useSelector(selectSelectedTarget);
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
        isOwner ? [{ label: "Configure" }] : []
    );

    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [tooltipIsOpen, setTooltipIsOpen] = useState(false);
    return (
        <Tooltip
            open={tooltipIsOpen}
            onOpen={() => !menuIsOpen && setTooltipIsOpen(true)}
            onClose={() => setTooltipIsOpen(false)}
            title={
                typeof selectedTarget === "object"
                    ? titleTooltip({ documents, selectedTarget })
                    : "No target found"
            }
            placement="bottom-end"
        >
            <div>
                <Select
                    value={selectedTargetName}
                    closeMenuOnSelect={true}
                    placeholder={
                        selectedTargetName
                            ? selectedTargetName!.length > 0
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
                    onChange={e => dispatch(setSelectedTarget(e.value))}
                    isSearchable={false}
                    options={options}
                    styles={{
                        control: (provided, state) => SS.control,
                        container: (provided, state) => SS.dropdownContainer,
                        groupHeading: (provided, state) => SS.groupHeading,
                        placeholder: (provided, state) => SS.placeholder,
                        menu: (provided, state) => SS.menu,
                        menuList: (provided, state) => SS.menuList,
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
