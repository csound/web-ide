import React from "react";

export default class PanelList extends React.PureComponent {
    render() {
        const { children, activeIndex, customStyle, style } = this.props;
        if (!children || activeIndex === undefined) {
            return undefined;
        }

        let props = {};
        if (customStyle && customStyle.Panel) {
            props = { ...props, CustomPanelStyle: customStyle.Panel };
        }

        // to prevent the type of one children is object type
        const result = React.Children.toArray(children).map((child, index) =>
            React.cloneElement(child, {
                key: index,
                active: index === activeIndex,
                index,
                ...props
            })
        );
        return <div style={style || {}}>{result}</div>;
    }
}
