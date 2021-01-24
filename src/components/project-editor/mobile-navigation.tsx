import React from "react";
import { AccountTree, FormatTextdirectionLToR } from "@material-ui/icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStream, faBook } from "@fortawesome/free-solid-svg-icons";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";
import * as SS from "./styles";

const MobileNavigation = ({
    mobileTabIndex,
    setMobileTabIndex
}: {
    mobileTabIndex: number;
    setMobileTabIndex: (number) => void;
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
                icon={
                    <FontAwesomeIcon
                        style={{
                            color: mobileTabIndex === 2 ? "#3f51b5" : "inherit"
                        }}
                        css={SS.mobileNavigationButtonAwesome}
                        icon={faStream}
                        size="lg"
                    />
                }
            ></BottomNavigationAction>
            <BottomNavigationAction
                value={3}
                onClick={() => setMobileTabIndex(3)}
                css={SS.mobileNavigationButton}
                label="Manual"
                icon={
                    <FontAwesomeIcon
                        style={{
                            color: mobileTabIndex === 3 ? "#3f51b5" : "inherit"
                        }}
                        css={SS.mobileNavigationButtonAwesome}
                        icon={faBook}
                        size="lg"
                    />
                }
            ></BottomNavigationAction>
        </BottomNavigation>
    );
};

export default MobileNavigation;
