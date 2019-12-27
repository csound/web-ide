// eslint-disable-next-line
import React, { useState, useEffect } from "react";

// https://dev.to/gabe_ragland/debouncing-with-react-hooks-jci
export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
        // eslint-disable-next-line
    }, [value]);
    return debouncedValue;
}
