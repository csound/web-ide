const cron = require("node-cron");
const { startServer } = require("./server");
const { getDatabase } = require("./database");
const { createDatabaseSearch } = require("./search");

const main = async () => {
    let database = await getDatabase();
    let databaseSearch = createDatabaseSearch(database);
    cron.schedule("0 */2 * * *", async () => {
        database = await getDatabase();
        databaseSearch = createDatabaseSearch(database);
    });

    startServer((collection, query) => {
        return databaseSearch(collection, query);
    });
};

main();
// startServer();
