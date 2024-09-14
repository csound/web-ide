import React from "react";
import styled from "@emotion/styled";

const Wrapper = styled.button`
    float: right;
    border: 1px solid #eee;
    border-radius: 2px;
    padding: 3px;
    margin-top: 10px;
    margin-left: 2px;
    display: inline-block;
    color: #777;
    vertical-align: middle;
    &:hover {
        color: black;
        cursor: pointer;
    }
    &:disabled,
    &[disabled] {
        border: 1px solid grey;
        background-color: #e7e7e7;
        cursor: not-allowed;
    }
`;

export default class ExtraButton extends React.PureComponent {
    static defaultProps = {
        disabled: false
    };

    render() {
        const { disabled, onClick, children } = this.props;
        return (
            <Wrapper onClick={onClick} disabled={disabled}>
                {children}
            </Wrapper>
        );
    }
}
