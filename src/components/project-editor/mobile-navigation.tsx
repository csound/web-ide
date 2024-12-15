import React from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import AccountTree from "@mui/icons-material/AccountTree";
import FormatTextdirectionLToR from "@mui/icons-material/FormatTextdirectionLToR";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import * as SS from "./styles";

const MobileNavigation = ({
    mobileTabIndex,
    setMobileTabIndex
}: {
    mobileTabIndex: number;
    setMobileTabIndex: (index: number) => void;
}): React.ReactElement => {
    return (
        <BottomNavigation
            value={mobileTabIndex}
            css={SS.mobileNavigationContainer}
            showLabels
        >
            <BottomNavigationAction
                value={0}
                onClick={() => setMobileTabIndex(0)}
                css={SS.mobileNavigationButton}
                label="Edit"
                icon={<FormatTextdirectionLToR fontSize="large" />}
            ></BottomNavigationAction>
            <BottomNavigationAction
                value={1}
                onClick={() => setMobileTabIndex(1)}
                css={SS.mobileNavigationButton}
                label="File Tree"
                icon={<AccountTree fontSize="large" />}
            ></BottomNavigationAction>
            <BottomNavigationAction
                value={2}
                onClick={() => setMobileTabIndex(2)}
                css={SS.mobileNavigationButton}
                label="Console"
                icon={<ListAltRoundedIcon fontSize="large" />}
            ></BottomNavigationAction>
            <BottomNavigationAction
                value={3}
                onClick={() => setMobileTabIndex(3)}
                css={SS.mobileNavigationButton}
                label="Manual"
                icon={<AutoStoriesRoundedIcon fontSize="large" />}
            ></BottomNavigationAction>
        </BottomNavigation>
    );
};

export default MobileNavigation;
