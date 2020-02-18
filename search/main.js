const cron = require("node-cron");

const { startServer } = require("./server");
const { getDatabase } = require("./database");

const main = async () => {
    const database = await getDatabase();
    console.log(database);
};

main();
// startServer();
// cron.schedule("* * * * *", () => {
//     console.log("running a task every minute");
// });
