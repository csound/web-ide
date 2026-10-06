import React from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import AccountTree from "@mui/icons-material/AccountTree";
import CodeRounded from "@mui/icons-material/CodeRounded";
import ContentCut from "@mui/icons-material/ContentCut";
import StackedLineChart from "@mui/icons-material/StackedLineChart";
import * as SS from "./styles";

const tabs = [
    { label: "Edit", Icon: CodeRounded, index: 0 },
    { label: "Files", Icon: AccountTree, index: 1 },
    { label: "Console", Icon: ListAltRoundedIcon, index: 2 },
    { label: "Manual", Icon: AutoStoriesRoundedIcon, index: 3 },
    { label: "Samples", Icon: ContentCut, index: 4 },
    { label: "Analysis", Icon: StackedLineChart, index: 5 }
] as const;

/** Switch between mobile workspace views with labelled, keyboard-accessible buttons. */
const MobileNavigation = ({
    mobileTabIndex,
    setMobileTabIndex
}: {
    mobileTabIndex: number;
    setMobileTabIndex: (index: number) => void;
}): React.ReactElement => {
    return (
        <nav css={SS.mobileNavContainer} aria-label="Editor views">
            <div css={SS.mobileNavTabGroup}>
                {tabs.map(({ label, Icon, index }) => (
                    <button
                        key={index}
                        type="button"
                        data-testid={
                            label === "Console" ? "console-tab" : undefined
                        }
                        css={SS.mobileNavTabButton(mobileTabIndex === index)}
                        onClick={() => setMobileTabIndex(index)}
                        aria-label={label}
                        aria-current={
                            mobileTabIndex === index ? "page" : undefined
                        }
                    >
                        <Icon />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default MobileNavigation;
