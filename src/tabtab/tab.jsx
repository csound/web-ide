import React from "react";
import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { closeButton as ProjectEditorCloseButtonStyle } from "@comp/project-editor/styles";

export const TabStyle = styled.li`
    display: ${(props) => (props.vertical ? "block" : "inline-block")};
    ${(props) =>
        props.vertical
            ? `
      background-color: white;
      color: black;
      padding: 10px 10px;
      z-index: 100000;
    `
            : (props) =>
                  props.closable
                      ? "padding: 10px 10px 10px 15px;"
                      : "padding: 10px 15px;"}

    user-select: none;
    &:hover {
        cursor: pointer;
        color: black;
    }
`;

const TabText = styled.span`
    vertical-align: middle;
`;

export const Tab = React.forwardRef(
    (
        {
            CustomTabStyle,
            closeCallback,
            active,
            closable,
            vertical,
            handleTabChange,
            index,
            children,
            currentIndex,
            thisIndex
        },
        ref
    ) => {
        const theme = useTheme();

        const clickTab = React.useCallback(() => {
            // console.log(event);
            handleTabChange(index);
        }, [handleTabChange, index]);

        return (
            <CustomTabStyle
                className="tab"
                active={active}
                vertical={vertical}
                closable={closable}
                role="tab"
                id={`react-tabtab-tab-${index}`}
                aria-controls={`react-tabtab-panel-${index}`}
                aria-selected={active}
                onClick={clickTab}
            >
                <TabText ref={ref}>{children}</TabText>
                <Tooltip title={"close"} placement="right-end">
                    <IconButton
                        size="small"
                        css={ProjectEditorCloseButtonStyle}
                        style={{ marginTop: "-4px", marginRight: "-5px" }}
                        onClick={() => {
                            closeCallback();
                        }}
                    >
                        <CloseIcon
                            style={{
                                fill:
                                    currentIndex === thisIndex
                                        ? theme.textColor
                                        : theme.unfocusedTextColor
                            }}
                        />
                    </IconButton>
                </Tooltip>
            </CustomTabStyle>
        );
    }
);

Tab.displayName = "Tab";

// export { TabStyle };
