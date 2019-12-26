import React from "react";
import Select from "react-select";
import { ITarget } from "../Projects/types";
import { append, filter, has, values } from "ramda";
import { isEmpty, reduce } from "lodash";
import * as SS from "./styles";

interface IDropdownOption {
    label: string;
    value: string;
}

const TargetDropdown = ({ selectedTarget, targets }) => {
    const mainTargets: ITarget[] = filter(
        has("targetDocumentUid"),
        values(targets)
    );

    const playlistTargets: ITarget[] = filter(
        has("playlistDocumentsUid"),
        values(targets)
    );

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
                selectedTarget.length > 0 ? selectedTarget : "Select target"
            }
            // onChange={e => setCurrentTarget(e.value)}
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
