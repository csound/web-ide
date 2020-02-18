const express = require("express");
const port = 4000;
const startServer = () => {
    const app = express();
    app.get("/search/:document/:query", (req, res) => {
        console.log(req.params);

        return res.send({ name: "edward" });
    });

    app.listen(port, () =>
        console.log(`Search app listening on port ${port}!`)
    );
};

module.exports = { startServer };
