import React from "react";
import Select from "react-select";
import * as SS from "./styles";

const options = [{ value: "project.csd", label: "project.csd" }];

const TargetDropdown = () => {
    return (
        <Select
            value={null}
            placeholder={"project.csd"}
            onChange={() => {}}
            isSearchable={false}
            options={options}
            styles={{
                control: (provided, state) => SS.control,
                container: (provided, state) => SS.dropdownContainer,
                placeholder: (provided, state) => SS.placeholder,
                menu: (provided, state) => SS.menu,
                menuList: (provided, state) => SS.menuList
            }}
        />
    );
};

export default TargetDropdown;
