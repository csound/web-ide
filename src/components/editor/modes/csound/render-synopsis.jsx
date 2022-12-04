import React from "react";

export const renderSynopsis = ({ root, synopsis }) => {
    const children = (
        <div>
            <p style={{ padding: 0, margin: 0 }}>{synopsis}</p>
        </div>
    );
    root.render(children);
};
