const router = require("express").Router();

router.get("/api/about", (req, res) => {
    res.send({ about });
});

module.exports = {
    router
};