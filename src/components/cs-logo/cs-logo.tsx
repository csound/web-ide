import React from "react";
import styled from "@emotion/styled";
import Tooltip from "@mui/material/Tooltip";
import { Link } from "react-router-dom";

interface ILogoContainer {
    size: number;
    interactive?: boolean;
}
// a
const LogoContainer = styled.div<ILogoContainer>`
    font-family: ${(properties) => properties.theme.font.regular};
    display: inline-block;
    border-radius: ${(properties) => properties.size / 2}px;
    font-size: 200%;
    color: ${(properties) => properties.theme.headerTextColor};
    box-sizing: border-box;
    line-height: ${(properties) => properties.size}px;
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    font-weight: bold;
    user-select: none;
    background: ${(properties) =>
        properties.interactive ? "inherit" : properties.theme.buttonBackground};
    & > p {
        margin: 0;
        padding: 0;
    }
`;
// a
export default function CsLogo(properties: ILogoContainer): React.ReactElement {
    // const containerReference = useRef();

    /*
    // look into this, can this tranparentize the globe backround
    // as well as be padded inwards for looser fit?
    useEffect(() => {
        (async () => {
            if (containerReference.current) {
                const faviconNode = document.querySelector("#favicon");
                const result = await domToImage.toPng(
                    containerReference.current,
                    {
                        style: {
                            color: "#fff",
                            // zoom: "20%",
                            // fontSize: "10% !important",
                            // border: "1px solid #fff",
                            // borderRadius: "50%",
                            // padding: "20%",
                            boxSizing: "border-box",
                            // position: "absolute",
                            boxShadow: "inset 0px 0px 0px 3px #fff"
                            // left: "-20%",
                            // top: "-20%"
                        }
                    }
                );
                faviconNode?.setAttribute("href", result);
            }
        })();
    }, [containerReference]);
    */

    return (
        <Link to="/">
            <Tooltip title="Go back home" followCursor>
                <LogoContainer
                    size={properties.size}
                    interactive={properties.interactive}
                >
                    <p>Cs</p>
                </LogoContainer>
            </Tooltip>
        </Link>
    );
}
