import React from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import AccountTree from "@mui/icons-material/AccountTree";
import FormatTextdirectionLToR from "@mui/icons-material/FormatTextdirectionLToR";
import * as SS from "./styles";

const tabs = [
    { label: "Edit", Icon: FormatTextdirectionLToR, index: 0 },
    { label: "Files", Icon: AccountTree, index: 1 },
    { label: "Console", Icon: ListAltRoundedIcon, index: 2 },
    { label: "Manual", Icon: AutoStoriesRoundedIcon, index: 3 }
] as const;

const MobileNavigation = ({
    mobileTabIndex,
    setMobileTabIndex
}: {
    mobileTabIndex: number;
    setMobileTabIndex: (index: number) => void;
}): React.ReactElement => {
    return (
        <div css={SS.mobileNavContainer}>
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
                        aria-selected={mobileTabIndex === index}
                    >
                        <Icon />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileNavigation;
