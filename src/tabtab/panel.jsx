import React from "react";
import styled from "@emotion/styled";

const PanelStyle = styled.div`
    text-align: left;
    padding: 20px 15px;
    ${(props) => (props.active ? "" : `display: none;`)}
    height: 100%;
    width: 100%;
`;

export default class PanelComponent extends React.PureComponent {
    render() {
        const { CustomPanelStyle, active, index, children } = this.props;
        const Panel = CustomPanelStyle || PanelStyle;
        return (
            <Panel
                role="tabpanel"
                id={`react-tabtab-panel-${index}`}
                aria-labelledby={`react-tabtab-${index}`}
                aria-hidden={false}
                active={active}
            >
                {active && children}
            </Panel>
        );
    }
}

export { PanelStyle };
