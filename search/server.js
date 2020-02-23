const express = require("express");
const cors = require("cors");

const port = 4000;
const startServer = (searchCallback, listCallback) => {
    const app = express();
    app.use(cors());
    app.get(
        "/search/:collection/:query/:count/:offset/:orderKey/:order",
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

    app.get("/list/:collection/:count/:offset/:orderKey/:order", (req, res) => {
        const { collection, count, offset, orderKey, order } = req.params;
        const result = listCallback(collection, count, offset, orderKey, order);

        return res.send(result);
    });

    app.listen(port, () =>
        console.log(`Search app listening on port ${port}!`)
    );
};

module.exports = { startServer };
