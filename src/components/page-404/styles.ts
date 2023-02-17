import { css } from "@emotion/react";

export const rootStyle = css({
    backgroundColor: "#e8e8e8",
    fontFamily: "'Space Mono', monospace",
    width: "100%",
    height: "auto",
    bottom: "0px",
    top: "0px",
    left: 0,
    position: "absolute"
});

export const centerBoxStyle = css({
    position: "absolute",
    width: "600px",
    height: "50px",
    top: "120px",
    left: "50%",
    marginTop: "-25px",
    marginLeft: "-50px"
});

export const startCodingButtonStyle = css({
    fontSize: "22px",
    border: "4px solid #518C82",
    borderRadius: "80%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "220px",
    height: "220px",
    textDecoration: "none",
    background: "#00DFCB"
});
