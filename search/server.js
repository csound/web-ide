const express = require("express");
const cors = require("cors");

const port = 4000;
const startServer = searchCallback => {
    const app = express();
    app.use(cors());
    app.get("/search/:collection/:query", (req, res) => {
        const { collection, query } = req.params;
        const result = searchCallback(collection, query);

        return res.send(result);
    });

    app.listen(port, () =>
        console.log(`Search app listening on port ${port}!`)
    );
};

module.exports = { startServer };
