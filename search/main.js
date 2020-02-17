const cron = require("node-cron");
const { projects } = require("./firebase");

const projectArray = [];
projects
    .where("public", "==", true)
    .get()
    .then(query => {
        query.forEach(result => {
            projectArray.push(result.data());
        });
    });
console.log("helo");

// cron.schedule("* * * * *", () => {
//     console.log("running a task every minute");
// });
