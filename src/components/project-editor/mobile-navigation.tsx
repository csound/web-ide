import React from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import AccountTree from "@mui/icons-material/AccountTree";
import FormatTextdirectionLToR from "@mui/icons-material/FormatTextdirectionLToR";
import * as SS from "./styles";
import { WebMcpLink } from "@root/webmcp/provider";

const tabs = [
    { label: "Edit", Icon: FormatTextdirectionLToR, index: 0 },
    { label: "Files", Icon: AccountTree, index: 1 },
    { label: "Console", Icon: ListAltRoundedIcon, index: 2 },
    { label: "Manual", Icon: AutoStoriesRoundedIcon, index: 3 }
] as const;

const MobileNavigation = ({
    mobileTabIndex,
    setMobileTabIndex,
    editorControl
}: {
    mobileTabIndex: number;
    setMobileTabIndex: (index: number) => void;
    editorControl?: React.ReactNode;
}): React.ReactElement => {
    return (
        <footer css={SS.mobileNavContainer} aria-label="Editor footer">
            <div css={SS.mobileNavTabGroup}>
                {tabs.map(({ label, Icon, index }) =>
                    index === 0 && editorControl ? (
                        <div
                            key={index}
                            css={{
                                display: "flex",
                                alignItems: "center",
                                padding: "0 4px"
                            }}
                        >
                            {editorControl}
                        </div>
                    ) : (
                        <button
                            key={index}
                            type="button"
                            data-testid={
                                label === "Console" ? "console-tab" : undefined
                            }
                            css={SS.mobileNavTabButton(
                                mobileTabIndex === index
                            )}
                            onClick={() => setMobileTabIndex(index)}
                            aria-label={label}
                            aria-selected={mobileTabIndex === index}
                        >
                            <Icon />
                            <span>{label}</span>
                        </button>
                    )
                )}
            </div>
            <WebMcpLink />
        </footer>
    );
};

export default MobileNavigation;
