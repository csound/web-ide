import React, { useCallback, useEffect, useState } from "react";
import { slice } from "ramda";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from "recharts";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/components/index.css";
import * as SS from "./styles";

type PlotterDataType = "csv" | "tsv";

const DataPlotter = ({
    dataString,
    dataType
}: {
    dataString: string;
    dataType: PlotterDataType;
}) => {
    const [data, setData] = useState([] as any[]);
    // too large graphs are very bad for browser performance, so we start with low max amount
    const [rangeMax, setRangeMax] = useState(1024);
    const [[rangeFrom, rangeTo], setFromTo] = useState([0, 1024]);

    useEffect(() => {
        const nextData = dataString
            .split(dataType === "csv" ? "," : /\t|\n/)
            .map((numericString, index) => ({
                value: Number.parseFloat(numericString),
                label: `${index}`
            }));
        setData(nextData);
        setRangeMax(nextData.length);
    }, [dataString, dataType, setData]);

    const onInput = useCallback(
        (nextFromTo: [number, number]) => {
            setFromTo(nextFromTo);
        },
        [setFromTo]
    );

    return (
        <div style={{ width: "100%", height: "100%", padding: "24px" }}>
            <div css={SS.dataPlotterSlider}>
                <RangeSlider
                    min={0}
                    max={rangeMax}
                    step={1}
                    value={[rangeFrom, rangeTo]}
                    onInput={onInput}
                />
            </div>
            <ResponsiveContainer>
                <LineChart
                    style={{ margin: "auto" }}
                    data={slice(rangeFrom, rangeTo, data)}
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
