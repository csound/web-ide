import Fuse from "fuse.js";
import memoize from "fast-memoize";

interface SearchOptions {
    keys?: string[];
}

interface DatabaseRecord {
    [key: string]: any;
}

interface DatabaseStructure {
    projects?: DatabaseRecord[];
    profiles?: DatabaseRecord[];
    tags?: DatabaseRecord[];
    [key: string]: DatabaseRecord[] | undefined;
}

const createFuzzySearch = (database: DatabaseStructure = {}, key: string = "", options: SearchOptions = {}): Fuse<DatabaseRecord> | null => {
    const items = database[key];
    if (typeof items === "undefined" || !Array.isArray(items)) {
        return null;
    }

    return new Fuse(items, options);
};

const createDatabaseSearch = (database: DatabaseStructure = {}) => {
    const projects = createFuzzySearch(database, "projects", {
        keys: ["name", "description"]
    });
    const profiles = createFuzzySearch(database, "profiles", {
        keys: ["username", "displayName", "bio"]
    });
    const tags = createFuzzySearch(database, "tags", { keys: ["id"] });
    const searchMap: Record<string, Fuse<DatabaseRecord> | null> = { projects, profiles, tags };

    return memoize((collection: string = "", query: string = ""): DatabaseRecord[] => {
        if (
            typeof collection !== "string" ||
            typeof query !== "string" ||
            typeof searchMap[collection] === "undefined" ||
            collection === "" ||
            query === ""
        ) {
            return [];
        }

        const fuse = searchMap[collection];
        if (!fuse) {
            return [];
        }

        const result = fuse.search(query);
        return result.map(item => item.item);
    });
};

const compareValues = (key: string, order: string = "asc") => {
    return (a: DatabaseRecord, b: DatabaseRecord): number => {
        if (!Object.hasOwn(a, key) || !Object.hasOwn(b, key)) {
            return 0;
        }

        const varA = typeof a[key] === "string" ? (a[key] as string).toUpperCase() : a[key];
        const varB = typeof b[key] === "string" ? (b[key] as string).toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return order === "desc" ? comparison * -1 : comparison;
    };
};

const orderArrayByKey = memoize((array: DatabaseRecord[] = [], orderKey: string | boolean = "", order: string | boolean = "asc"): DatabaseRecord[] => {
    if (
        Array.isArray(array) &&
        array.length > 0 &&
        orderKey !== false &&
        order !== false &&
        typeof orderKey === "string" &&
        typeof array[0][orderKey] !== "undefined" &&
        typeof order === "string"
    ) {
        array.sort(compareValues(orderKey, order));
    }

    return array;
});

const searchResultFilter = memoize(
    (result: DatabaseRecord[] = [], count: number | string | boolean = 0, offset: number | string | boolean = 0, orderKey: string | boolean = false, order: string | boolean = false): DatabaseRecord[] => {
        let parsedCount = count;
        let parsedOffset = offset;
        
        if (count !== false && offset !== false) {
            parsedCount = parseInt(String(count));
            parsedOffset = parseInt(String(offset));
        }

        if (
            !Array.isArray(result) ||
            result.length === 0 ||
            typeof parsedCount !== "number" ||
            typeof parsedOffset !== "number" ||
            parsedCount === 0 ||
            parsedOffset >= result.length
        ) {
            return [];
        }

        let sortResult = orderArrayByKey(result, orderKey, order);
        sortResult = sortResult.slice(parsedOffset, parsedOffset + parsedCount);
        return sortResult;
    }
);

const createDatabaseList = (database: DatabaseStructure = {}) => {
    return (collection: string = ""): DatabaseRecord[] => {
        if (
            typeof collection !== "string" ||
            typeof database[collection] === "undefined" ||
            collection === ""
        ) {
            return [];
        }

        const result = database[collection] ?? [];
        return result;
    };
};

export {
    createDatabaseSearch,
    searchResultFilter,
    createDatabaseList
};
