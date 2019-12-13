import React from "react";
import Select from "react-select";
// import { append } from "ramda";
import * as SS from "./styles";

const optionsDev = [
    { value: "project.csd", label: "project.csd" },
    { value: "project.csd", label: "project.csd" }
];

const TargetDropdown = () => {
    return (
        <Select
            value={null}
            placeholder={"project.csd"}
            onChange={() => {}}
            isSearchable={false}
            options={optionsDev}
            styles={{
                control: (provided, state) => SS.control,
                container: (provided, state) => SS.dropdownContainer,
                placeholder: (provided, state) => SS.placeholder,
                menu: (provided, state) => SS.menu,
                menuList: (provided, state) => SS.menuList,
                option: (provided, state) => SS.menuOption
            }}
        />
    );
};

export default TargetDropdown;
