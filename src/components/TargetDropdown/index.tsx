import React from "react";
import Select from "react-select";
import { useSelector } from "react-redux";
import { IStore } from "../../db/interfaces";
import { append, filter, has, keys, pathOr, propOr } from "ramda";
import { find, isEmpty, reduce } from "lodash";
import * as SS from "./styles";

interface IDropdownOption {
    label: string;
    value: string;
}

const TargetDropdown = () => {
    // const dropdownRef = useRef();
    // const { current } = dropdownRef;

    const targets = useSelector((store: IStore) =>
        pathOr({}, ["projects", "activeProject", "targets"], store)
    );

    const mainTargets = filter(has("targetDocumentUid"), targets);

    const playlistTargets = find(targets, has("playlistDocumentsUid"));

    const defaultTarget = useSelector((store: IStore) =>
        pathOr("", ["projects", "activeProject", "defaultTarget"], store)
    );

    const mainDropdownOptions = isEmpty(mainTargets)
        ? []
        : reduce(
              keys(mainTargets),
              (acc, target) => {
                  return append(
                      {
                          value: target,
                          label: pathOr("", [target, "targetName"], targets)
                      },
                      acc
                  );
              },
              [] as IDropdownOption[]
          );

    const playlistDropdownOptions = isEmpty(playlistTargets)
        ? []
        : reduce(
              propOr([], "playlistDocumentsUid", playlistTargets),
              (acc, docUid) => {
                  return append(
                      {
                          value: docUid,
                          label: docUid
                      },
                      acc
                  );
              },
              [] as IDropdownOption[]
          );

    const defaultTargetData = isEmpty(defaultTarget)
        ? propOr({}, 0, mainDropdownOptions)
        : find(mainDropdownOptions, dd => dd.value === defaultTarget);

    return (
        <Select
            value={propOr(null, "value", defaultTargetData)}
            closeMenuOnSelect={true}
            menuIsOpen={true}
            placeholder={propOr("Select target", "label", defaultTargetData)}
            onChange={() => {}}
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
                option: (provided, state) => SS.menuOption
            }}
        />
    );
};

export default TargetDropdown;
