const express = require("express");
const cors = require("cors");

const port = 4000;
const startServer = (searchCallback, listCallback, randomCallback) => {
    const app = express();
    app.use(cors());
    app.get(
        "/search/:databaseID/query/:collection/:query/:count/:offset/:orderKey/:order",
        (req, res) => {
            const {
                databaseID,
                collection,
                query,
                count,
                offset,
                orderKey,
                order
            } = req.params;
            const result = searchCallback(
                databaseID,
                collection,
                query,
                count,
                offset,
                orderKey,
                order
            );

            return res.send(result);
        }
    );

    app.get(
        "/search/:databaseID/list/:collection/:count/:offset/:orderKey/:order",
        (req, res) => {
            const {
                databaseID,
                collection,
                count,
                offset,
                orderKey,
                order
            } = req.params;
            const result = listCallback(
                databaseID,
                collection,
                count,
                offset,
                orderKey,
                order
            );

            return res.send(result);
        }
    );

    app.get("/search/:databaseID/random/:collection/:count", (req, res) => {
        const { databaseID, collection, count } = req.params;
        const result = randomCallback(databaseID, collection, count);
        return res.send(result);
    });

    app.listen(port, () =>
        console.log(`Search app listening on port ${port}!`)
    );
};

module.exports = { startServer };
