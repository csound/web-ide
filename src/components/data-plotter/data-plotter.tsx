import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis
    // ResponsiveContainer,
    // Line,
    // XAxis,
    // YAxis,
    // ReferenceLine,
    // ReferenceArea,
    // ReferenceDot,
    // Tooltip,
    // CartesianGrid,
    // Legend,
    // Brush,
    // ErrorBar,
    // AreaChart,
    // Area,
    // Label,
    // LabelList
} from "recharts";
// import { NonCloudFile } from "@comp/file-tree/types";
// import { IDocument } from "@comp/projects/types";

type PlotterDataType = "csv" | "tsv";

const DataPlotter = ({
    dataString,
    dataType
}: {
    dataString: string;
    dataType: PlotterDataType;
}) => {
    const [data, setData] = useState([] as any[]);
    useEffect(() => {
        const nextData = dataString
            .split(dataType === "csv" ? "," : /\t|\n/)
            .map((numericString, index) => ({
                value: Number.parseFloat(numericString),
                label: `${index}`
            }));
        setData(nextData);
    }, [dataString, dataType, setData]);

    return (
        <div style={{ width: "100%", height: "100%", padding: "24px" }}>
            <ResponsiveContainer>
                <LineChart
                    style={{ margin: "auto" }}
                    data={data}
                    key={dataString}
                >
                    <XAxis />
                    <YAxis />
                    <Line type="linear" dataKey="value" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DataPlotter;
