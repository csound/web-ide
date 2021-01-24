// svgMock.js
import React from "react";

const createComponent = function (name) {
    return class extends React.Component {
        // overwrite the displayName, since this is a class created dynamically
        static displayName = name;

        render() {
            return React.createElement(name, this.props, this.props.children);
        }
    };
};

export const ReactComponent = createComponent("svg");
export default `"<svg name=\"mock\"></svg>"`;
