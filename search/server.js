const express = require("express");
const cors = require("cors");

const port = 4000;
const startServer = (searchCallback, listCallback, randomCallback) => {
    const app = express();
    app.use(cors());
    app.get(
        "/search/query/:collection/:query/:count/:offset/:orderKey/:order",
        (req, res) => {
            const {
                collection,
                query,
                count,
                offset,
                orderKey,
                order
            } = req.params;
            const result = searchCallback(
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
        "/search/list/:collection/:count/:offset/:orderKey/:order",
        (req, res) => {
            const { collection, count, offset, orderKey, order } = req.params;
            const result = listCallback(
                collection,
                count,
                offset,
                orderKey,
                order
            );

            return res.send(result);
        }
    );

    app.get("/search/random/:collection/:count", (req, res) => {
        const { collection, count } = req.params;
        const result = randomCallback(collection, count);
        return res.send(result);
    });

    app.listen(port, () =>
        console.log(`Search app listening on port ${port}!`)
    );
};

module.exports = { startServer };
