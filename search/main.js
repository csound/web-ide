const cron = require("node-cron");
const { startServer } = require("./server");
const { getDatabase } = require("./database");
const {
    createDatabaseSearch,
    searchResultFilter,
    createDatabaseList
} = require("./search");

const getDatabaseType = async databaseID => {
    let database = await getDatabase(databaseID);
    let search = createDatabaseSearch(database);
    let list = createDatabaseList(database);

    return {
        database,
        search,
        list
    };
};

const main = async () => {
    let databases = {
        dev: await getDatabaseType("dev"),
        prod: await getDatabaseType("prod")
    };

    cron.schedule("0 */2 * * *", async () => {
        databases = {
            dev: await getDatabaseType("dev"),
            prod: await getDatabaseType("prod")
        };
    });

    startServer(
        (databaseID, collection, query, count, offset, orderKey, order) => {
            let result = databases[databaseID].search(collection, query);
            const totalRecords = result.length;
            result = searchResultFilter(result, count, offset, orderKey, order);
            return {
                data: result,
                totalRecords
            };
        },
        (databaseID, collection, count, offset, orderKey, order) => {
            let result = databases[databaseID].list(collection);
            const totalRecords = result.length;
            result = searchResultFilter(result, count, offset, orderKey, order);
            return {
                data: result,
                totalRecords
            };
        },
        (databaseID, collection, count) => {
            count = parseInt(count);

            let result = [...databases[databaseID].list(collection)];
            result = [...Array(count)]
                .map(
                    () =>
                        result.splice(
                            Math.floor(Math.random() * result.length),
                            1
                        )[0]
                )
                .filter(e => typeof e !== "undefined" && e !== null);

            return {
                data: result,
                totalRecords: result.length
            };
        }
    );
};

main();
// startServer();
