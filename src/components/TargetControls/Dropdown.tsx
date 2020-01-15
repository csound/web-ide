import React from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { ITarget, ITargetMap } from "@comp/Projects/types";
import { setSelectedTarget } from "./actions";
import { selectProjectTargets, selectSelectedTarget } from "./selectors";
import { append, filter, has, values } from "ramda";
import { isEmpty, reduce } from "lodash";
import * as SS from "./styles";

interface IDropdownOption {
    label: string;
    value: string;
}

const TargetDropdown = ({ activeProjectUid }) => {
    const dispatch = useDispatch();
    const targets: ITargetMap | null = useSelector(
        selectProjectTargets(activeProjectUid)
    );

    const selectedTarget: string | null = useSelector(selectSelectedTarget);
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

    return (
        <Select
            value={selectedTarget}
            closeMenuOnSelect={true}
            placeholder={
                selectedTarget
                    ? selectedTarget!.length > 0
                        ? selectedTarget
                        : "Select target"
                    : "No targets found"
            }
            // menuIsOpen={true}
            onChange={e => dispatch(setSelectedTarget(e.value))}
            isSearchable={false}
            options={[
                { label: "Playlist", options: playlistDropdownOptions },
                {
                    label: "Targets",
                    options: mainDropdownOptions
                }
            ]}
            styles={{
                control: (provided, state) => SS.control,
                container: (provided, state) => SS.dropdownContainer,
                groupHeading: (provided, state) => SS.groupHeading,
                placeholder: (provided, state) => SS.placeholder,
                menu: (provided, state) => SS.menu,
                menuList: (provided, state) => SS.menuList,
                option: (provided, state) => SS.menuOption,
                indicatorsContainer: (provided, state) => SS.indicatorContainer,
                indicatorSeparator: (provided, state) => SS.indicatorSeparator
            }}
        />
    );
};

export default TargetDropdown;
