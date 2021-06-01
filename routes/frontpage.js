const router = require("express").Router();

router.get("/api/frontpage", (req, res) => {
    res.send({ frontpage });
});

module.exports = {
    router
};