import React from "react";
import { CloseIcon } from "./icon-svg.js";
import styled from "@emotion/styled";

const CloseWrapper = styled.button`
    display: inline-block;
    color: #777;
    margin-left: 5px;
    padding: 0;
    vertical-align: middle;
    border: 0;
    padding: 2px;
    outline: 0;
    z-index: 10;
    &:hover {
        color: black;
        background-color: #eee;
        cursor: pointer;
        border-radius: 50%;
    }
    > svg {
        vertical-align: middle;
    }
`;

export default class CloseButton extends React.PureComponent {
    render() {
        return (
            <CloseWrapper onClick={this.props.handleDelete}>
                <CloseIcon />
            </CloseWrapper>
        );
    }
}
