const cron = require("node-cron");

cron.schedule("* * * * *", () => {
    console.log("running a task every minute");
});
